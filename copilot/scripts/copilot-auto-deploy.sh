#!/usr/bin/env bash
set -euo pipefail

# Trap signals for clean exit
cleanup() {
  echo ""
  echo "🛑 Interrupted! Cleaning up..."
  exit 130
}
trap cleanup SIGINT SIGTERM

# --- prerequisites ---
for bin in aws jq copilot; do
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

# --- check and setup environment files ---
echo ""
echo "🔍 Checking environment files..."
# First switch to the correct app context
export CLIENT_DOMAIN
export AUTH0_BASE_URL
bash ./copilot/scripts/copilot-switch-app.sh

# Then check/create environment files for this app
# Pass the environment explicitly since we know it
# Read the app name from the workspace file created by switch script
if [[ -f "copilot/.workspace" ]]; then
  APP_NAME="$(cat copilot/.workspace | grep 'application:' | cut -d':' -f2 | xargs)"
fi

# Check if app exists in the copilot app list first
if copilot app ls 2>/dev/null | grep -q "^${APP_NAME}$"; then
  # App exists - normal interactive flow
  if ! bash ./copilot/scripts/copilot-check-env-files.sh "$ENV"; then
    echo "❌ Environment file setup failed or was cancelled"
    exit 1
  fi
else
  # App doesn't exist - auto-select template creation, then prompt for guided vs empty
  if ! bash ./copilot/scripts/copilot-check-env-files.sh "$ENV" --auto-templates; then
    echo "❌ Environment file setup failed or was cancelled"
    exit 1
  fi
fi

# --- check if copilot app exists ---
echo ""
echo "🔍 Checking Copilot app status..."
APP_EXISTS=false
if copilot app show >/dev/null 2>&1; then
  APP_EXISTS=true
  echo "✅ Copilot app exists"
else
  echo "❌ Copilot app does not exist"
  read -r -p "Create new Copilot app with domain '$CLIENT_DOMAIN'? (y/N): " create_app
  create_app_lc="$(lower "$create_app")"
  if [[ "$create_app_lc" == "y" || "$create_app_lc" == "yes" ]]; then
    echo "🚀 Initializing Copilot app..."
    copilot app init --domain "$CLIENT_DOMAIN"
    APP_EXISTS=true
  else
    echo "Aborted: Cannot proceed without Copilot app"
    exit 1
  fi
fi

# --- check if environment exists ---
echo ""
echo "🔍 Checking environment '$ENV' status..."
ENV_EXISTS=false
if copilot env show --name "$ENV" >/dev/null 2>&1; then
  ENV_EXISTS=true
  echo "✅ Environment '$ENV' exists"
else
  echo "❌ Environment '$ENV' does not exist"
  read -r -p "Create environment '$ENV'? (y/N): " create_env
  create_env_lc="$(lower "$create_env")"
  if [[ "$create_env_lc" != "y" && "$create_env_lc" != "yes" ]]; then
    echo "Aborted: Cannot proceed without environment '$ENV'"
    exit 1
  fi
fi

# --- bootstrap / deploy the copilot environment (infra) ---
if [[ "$ENV_EXISTS" == "true" ]]; then
  echo ""
  echo "🔄 Deploying existing environment '$ENV'..."
  copilot env deploy --name "$ENV" || true   # allow 'no changes' without failing
else
  echo ""
  echo "🚀 Creating and bootstrapping environment '$ENV'..."
  copilot env init --name "$ENV"
  copilot env deploy --name "$ENV"
fi

# --- service selection (defaults to BOTH after 15s or on blank) ---
echo ""
echo "🧩 What do you want to deploy?"
echo "1) flowise"
echo "2) web"
echo "3) Both (flowise and web) - default"
echo "4) exit"
svc_choice=""
if read -t 15 -r -p "Enter choice (1-4) [default 3 in 15s]: " svc_choice; then
  :
else
  printf '\n⏭️  No input after 15s — defaulting to "both".\n'
  svc_choice="3"
fi
# Treat blank as default 3
if [[ -z "${svc_choice// }" ]]; then
  svc_choice="3"
fi

SERVICES=()
case "${svc_choice}" in
  1) SERVICES=("flowise") ;;
  2) SERVICES=("web") ;;
  3) SERVICES=("flowise" "web") ;;  # order preserved: flowise then web
  4) echo "Aborted."; exit 0 ;;
  *) echo "Invalid choice '$svc_choice'"; exit 1 ;;
esac

# needs_flowise=false
# for s in "${SERVICES[@]}"; do
#   [[ "$s" == "flowise" ]] && needs_flowise=true
# done

# --- optional DB/Redis info (only relevant for flowise deployments) ---
# SHOW_DB=false
# if $needs_flowise; then
#   echo ""
#   echo "🗄️  Do you need DB/Redis connection details for updating Copilot env files before deploying flowise?"
#   # Auto-skip after 15s with default 'No'
#   if read -t 15 -r -p "Show DB/Redis info? (y/N) [auto-skip in 15s]: " need_db; then
#     need_db_lc="$(lower "$need_db")"
#     case "$need_db_lc" in
#       y|yes) SHOW_DB=true ;;
#       *) SHOW_DB=false ;;
#     esac
#   else
#     printf '\n⏭️  No input after 15s — skipping DB/Redis info.\n'
#   fi
#
#   if $SHOW_DB; then
#     echo ""
#     echo "🔎 Resolving CloudFormation stack for '$ENV'..."
#     STACK_QUERY="StackSummaries[?contains(StackName, 'aai-${ENV}-AddonsStack')].StackName"
#     STACKS_RAW="$(aws cloudformation list-stacks \
#       --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE \
#       --query "$STACK_QUERY" \
#       --output text || true)"
#     read -r -a STACKS <<< "$STACKS_RAW"
#
#     if (( ${#STACKS[@]} == 0 )); then
#       echo "❌ No 'aai-${ENV}-AddonsStack' stacks found in this account/region."
#       echo "   (Tip: ensure AWS_PROFILE/AWS_REGION are set correctly.)"
#       exit 1
#     elif (( ${#STACKS[@]} == 1 )); then
#       STACK="${STACKS[0]}"
#     else
#       echo "Multiple matching stacks found:"
#       select s in "${STACKS[@]}"; do
#         if [[ -n "${s:-}" ]]; then STACK="$s"; break; fi
#       done
#     fi
#     echo "📋 Stack: $STACK"
#
#     echo ""
#     echo "🗄️  Database:"
#     DB_SECRET="$(aws cloudformation describe-stacks \
#       --stack-name "$STACK" \
#       --query "Stacks[0].Outputs[?OutputKey==\`flowiseclusterSecret\`].OutputValue" \
#       --output text || true)"
#     if [[ -z "${DB_SECRET:-}" || "$DB_SECRET" == "None" ]]; then
#       echo "   (No DB secret output 'flowiseclusterSecret' found.)"
#     else
#       DB_CREDS="$(aws secretsmanager get-secret-value \
#         --secret-id "$DB_SECRET" \
#         --query 'SecretString' \
#         --output text)"
#       echo "   Host:     $(echo "$DB_CREDS" | jq -r '.host')"
#       echo "   Port:     $(echo "$DB_CREDS" | jq -r '.port')"
#       echo "   Database: $(echo "$DB_CREDS" | jq -r '.dbname')"
#       echo "   Username: $(echo "$DB_CREDS" | jq -r '.username')"
#       echo "   Password: $(echo "$DB_CREDS" | jq -r '.password')"
#     fi
#
#     echo ""
#     echo "🔴 Redis:"
#     REDIS_ENDPOINT="$(aws cloudformation describe-stacks --stack-name "$STACK" --query 'Stacks[0].Outputs[?OutputKey==`RedisEndpoint`].OutputValue' --output text || true)"
#     REDIS_PORT="$(aws cloudformation describe-stacks --stack-name "$STACK" --query 'Stacks[0].Outputs[?OutputKey==`RedisPort`].OutputValue' --output text || true)"
#     REDIS_URL="$(aws cloudformation describe-stacks --stack-name "$STACK" --query 'Stacks[0].Outputs[?OutputKey==`RedisURL`].OutputValue' --output text || true)"
#     echo "   Endpoint: ${REDIS_ENDPOINT:-N/A}"
#     echo "   Port:     ${REDIS_PORT:-N/A}"
#     echo "   URL:      ${REDIS_URL:-N/A}"
#
#     echo ""
#     echo "⏸️  Pause: Update your Copilot env files for '$ENV' with the following:"
#     echo "     CLIENT_DOMAIN=$CLIENT_DOMAIN"
#     echo "     AUTH0_BASE_URL=$AUTH0_BASE_URL"
#     echo "     # plus any DB/Redis values shown above as needed"
#     read -r -p "Type 'done' to continue (or Ctrl+C to abort): " confirmed
#     confirmed_lc="$(lower "$confirmed")"
#     if [[ "$confirmed_lc" != "done" ]]; then
#       echo "Aborted."; exit 1
#     fi
#   fi
# fi

# --- deploy selected services ---
echo ""
echo "🚀 Deploying to '$ENV'..."
for svc in "${SERVICES[@]}"; do
  echo "→ copilot deploy --name $svc --env $ENV"
  copilot deploy --name "$svc" --env "$ENV"
done

echo ""
echo "✅ Done."
echo "   (To reuse later in your shell: export CLIENT_DOMAIN=\"$CLIENT_DOMAIN\" AUTH0_BASE_URL=\"$AUTH0_BASE_URL\")"
