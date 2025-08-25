#!/usr/bin/env bash
set -euo pipefail

# --- prerequisites ---
for bin in aws jq pnpm; do
  command -v "$bin" >/dev/null 2>&1 || {
    echo "Required command '$bin' not found on PATH."; exit 1;
  }
done

lower() { printf '%s' "${1:-}" | tr '[:upper:]' '[:lower:]'; }

# --- choose environment ---
echo "🔍 Select Environment:"
echo "1) staging"
echo "2) prod"
echo ""
read -r -p "Enter choice (1-2): " choice
case "${choice:-}" in
  1) ENV="staging" ;;
  2) ENV="prod" ;;
  *) echo "Invalid choice"; exit 1 ;;
esac

# --- client key / subdomain ---
read -r -p "Client key/subdomain (e.g., acme): " SUBDOMAIN
SUBDOMAIN="$(lower "$SUBDOMAIN")"
if [[ -z "$SUBDOMAIN" || ! "$SUBDOMAIN" =~ ^[a-z0-9]([a-z0-9-]*[a-z0-9])?$ ]]; then
  echo "Invalid subdomain. Use letters, numbers, and hyphens (no leading/trailing hyphen)."
  exit 1
fi

BASE_DOMAIN="theanswer.ai"
if [[ "$ENV" == "staging" ]]; then
  CLIENT_DOMAIN="staging.${SUBDOMAIN}.${BASE_DOMAIN}"
else
  CLIENT_DOMAIN="${SUBDOMAIN}.${BASE_DOMAIN}"
fi
export CLIENT_DOMAIN

# --- auth0 base url (always https) ---
AUTH0_BASE_URL="https://${CLIENT_DOMAIN}"
export AUTH0_BASE_URL

echo ""
echo "✅ Using:"
echo "   ENV             = $ENV"
echo "   CLIENT_DOMAIN   = $CLIENT_DOMAIN"
echo "   AUTH0_BASE_URL  = $AUTH0_BASE_URL"

# --- bootstrap / deploy the copilot environment (infra) ---
echo ""
echo "🚀 Bootstrapping Copilot env '$ENV'..."
pnpm copilot env init --name "$ENV" || true
pnpm copilot env deploy --name "$ENV" || true   # allow 'no changes' without failing

# --- service selection ---
echo ""
echo "🧩 What do you want to deploy?"
echo "1) flowise"
echo "2) web"
echo "3) both"
echo "4) exit"
read -r -p "Enter choice (1-4): " svc_choice
SERVICES=()
case "${svc_choice:-}" in
  1) SERVICES=("flowise") ;;
  2) SERVICES=("web") ;;
  3) SERVICES=("flowise" "web") ;;  # order preserved: flowise then web
  4) echo "Aborted."; exit 0 ;;
  *) echo "Invalid choice"; exit 1 ;;
esac

needs_flowise=false
for s in "${SERVICES[@]}"; do
  [[ "$s" == "flowise" ]] && needs_flowise=true
done

# --- optional DB/Redis info (only relevant for flowise deployments) ---
SHOW_DB=false
if $needs_flowise; then
  echo ""
  echo "🗄️  Do you need DB/Redis connection details for updating Copilot env files before deploying flowise?"
  # Auto-skip after 30s with default 'No'
  if read -t 30 -r -p "Show DB/Redis info? (y/N) [auto-skip in 30s]: " need_db; then
    need_db_lc="$(lower "$need_db")"
    case "$need_db_lc" in
      y|yes) SHOW_DB=true ;;
      *) SHOW_DB=false ;;
    esac
  else
    printf '\n⏭️  No input after 30s — skipping DB/Redis info.\n'
  fi

  if $SHOW_DB; then
    echo ""
    echo "🔎 Resolving CloudFormation stack for '$ENV'..."
    STACK_QUERY="StackSummaries[?contains(StackName, 'aai-${ENV}-AddonsStack')].StackName"
    STACKS_RAW="$(aws cloudformation list-stacks \
      --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE \
      --query "$STACK_QUERY" \
      --output text || true)"
    read -r -a STACKS <<< "$STACKS_RAW"

    if (( ${#STACKS[@]} == 0 )); then
      echo "❌ No 'aai-${ENV}-AddonsStack' stacks found in this account/region."
      echo "   (Tip: ensure AWS_PROFILE/AWS_REGION are set correctly.)"
      exit 1
    elif (( ${#STACKS[@]} == 1 )); then
      STACK="${STACKS[0]}"
    else
      echo "Multiple matching stacks found:"
      select s in "${STACKS[@]}"; do
        if [[ -n "${s:-}" ]]; then STACK="$s"; break; fi
      done
    fi
    echo "📋 Stack: $STACK"

    echo ""
    echo "🗄️  Database:"
    DB_SECRET="$(aws cloudformation describe-stacks \
      --stack-name "$STACK" \
      --query "Stacks[0].Outputs[?OutputKey==\`flowiseclusterSecret\`].OutputValue" \
      --output text || true)"
    if [[ -z "${DB_SECRET:-}" || "$DB_SECRET" == "None" ]]; then
      echo "   (No DB secret output 'flowiseclusterSecret' found.)"
    else
      DB_CREDS="$(aws secretsmanager get-secret-value \
        --secret-id "$DB_SECRET" \
        --query 'SecretString' \
        --output text)"
      echo "   Host:     $(echo "$DB_CREDS" | jq -r '.host')"
      echo "   Port:     $(echo "$DB_CREDS" | jq -r '.port')"
      echo "   Database: $(echo "$DB_CREDS" | jq -r '.dbname')"
      echo "   Username: $(echo "$DB_CREDS" | jq -r '.username')"
      echo "   Password: $(echo "$DB_CREDS" | jq -r '.password')"
    fi

    echo ""
    echo "🔴 Redis:"
    REDIS_ENDPOINT="$(aws cloudformation describe-stacks --stack-name "$STACK" --query 'Stacks[0].Outputs[?OutputKey==`RedisEndpoint`].OutputValue' --output text || true)"
    REDIS_PORT="$(aws cloudformation describe-stacks --stack-name "$STACK" --query 'Stacks[0].Outputs[?OutputKey==`RedisPort`].OutputValue' --output text || true)"
    REDIS_URL="$(aws cloudformation describe-stacks --stack-name "$STACK" --query 'Stacks[0].Outputs[?OutputKey==`RedisURL`].OutputValue' --output text || true)"
    echo "   Endpoint: ${REDIS_ENDPOINT:-N/A}"
    echo "   Port:     ${REDIS_PORT:-N/A}"
    echo "   URL:      ${REDIS_URL:-N/A}"

    echo ""
    echo "⏸️  Pause: Update your Copilot env files for '$ENV' with the following:"
    echo "     CLIENT_DOMAIN=$CLIENT_DOMAIN"
    echo "     AUTH0_BASE_URL=$AUTH0_BASE_URL"
    echo "     # plus any DB/Redis values shown above as needed"
    read -r -p "Type 'done' to continue (or Ctrl+C to abort): " confirmed
    confirmed_lc="$(lower "$confirmed")"
    if [[ "$confirmed_lc" != "done" ]]; then
      echo "Aborted."; exit 1
    fi
  fi
fi

# --- deploy selected services ---
echo ""
echo "🚀 Deploying to '$ENV'..."
for svc in "${SERVICES[@]}"; do
  echo "→ pnpm copilot deploy --name $svc --env $ENV"
  pnpm copilot deploy --name "$svc" --env "$ENV"
done

echo ""
echo "✅ Done."
echo "   (To reuse later in your shell: export CLIENT_DOMAIN=\"$CLIENT_DOMAIN\" AUTH0_BASE_URL=\"$AUTH0_BASE_URL\")"
