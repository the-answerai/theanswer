#!/usr/bin/env bash
set -euo pipefail

# Color constants for better visual output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly PURPLE='\033[0;35m'
readonly CYAN='\033[0;36m'
readonly WHITE='\033[1;37m'
readonly NC='\033[0m' # No Color
readonly BOLD='\033[1m'

# Visual helper functions
print_header() {
  local text="$1"
  local box_width=63
  local text_length=${#text}
  local available_width=$((box_width - 0))  # Subtract border characters
  local total_padding=$((available_width - text_length))
  local left_padding=$((total_padding / 2 + 1))
  local right_padding=$((total_padding - left_padding))
  
  # Create padding strings
  local left_spaces=$(printf '%*s' "$left_padding" '')
  local right_spaces=$(printf '%*s' "$right_padding" '')
  
  echo -e "\n${PURPLE}${BOLD}╔═══════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${PURPLE}${BOLD}║${NC}${left_spaces}${WHITE}${BOLD}${text}${NC}${right_spaces}${PURPLE}${BOLD}║${NC}"
  echo -e "${PURPLE}${BOLD}╚═══════════════════════════════════════════════════════════════╝${NC}\n"
}

print_phase() {
  echo -e "\n${CYAN}${BOLD}▶ PHASE $1: $2${NC}"
  echo -e "${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_deployment_success() {
  local service_name="$1"
  local health_url="$2"
  
  echo -e "\n${GREEN}${BOLD}╔═══════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${WHITE}${BOLD}  🚀 SERVICE DEPLOYED SUCCESSFULLY${NC}"
  echo -e "${CYAN}  Service:${NC} ${WHITE}${BOLD}$service_name${NC}"
  if [[ -n "$health_url" ]]; then
    echo -e "${GREEN}  Health Check:${NC} ${CYAN}$health_url${NC}"
  fi
  echo -e "${GREEN}${BOLD}╚═══════════════════════════════════════════════════════════════╝${NC}\n"
}

print_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
}

print_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

print_step() {
  echo -e "${WHITE}${BOLD}→ $1${NC}"
}

# AWS account verification function
verify_aws_account() {
  print_step "Verifying AWS account..."
  print_info "Ensure AWS_PROFILE is set correctly (e.g., export AWS_PROFILE=saml or demo-sso or default, etc)"
  echo -e "   ${PURPLE}Docs: https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-sso.html${NC}"
  echo -e "   ${CYAN}AWS_SESSION_EXPIRATION:${NC} ${GREEN}${AWS_SESSION_EXPIRATION:-not set}${NC}"
  echo -e "   ${CYAN}AWS_PROFILE:${NC} ${GREEN}${AWS_PROFILE:-not set}${NC}"
  echo -e "   ${CYAN}AWS_REGION:${NC} ${GREEN}${AWS_REGION:-not set}${NC}"
  echo -e "   ${CYAN}AWS_DEFAULT_REGION:${NC} ${GREEN}${AWS_DEFAULT_REGION:-not set}${NC}"
  print_info "Running 'aws sts get-caller-identity' to check the profile you're logged in with"
  
  # Run aws sts get-caller-identity and capture output safely
  local aws_output
  aws_output=$(aws sts get-caller-identity 2>&1) || true
  
  # Check for SSO token expiration error specifically
  if [[ "$aws_output" == *"Token has expired and refresh failed"* ]] || \
     [[ "$aws_output" == *"ExpiredToken"* ]] || \
     [[ "$aws_output" == *"The security token included in the request is expired"* ]]; then
    echo -e "$aws_output"
    echo ""
    print_error "AWS SSO token has expired"
    print_info "Please re-authenticate with AWS SSO:"
    if [[ -n "${AWS_PROFILE:-}" ]]; then
      echo -e "   ${CYAN}• Login to SSO: aws sso login --profile $AWS_PROFILE${NC}"
    else
      echo -e "   ${CYAN}• Login to SSO: aws sso login${NC}"
    fi
    echo -e "   ${CYAN}• Check available profiles: aws configure list-profiles${NC}"
    echo -e "   ${CYAN}• Set correct profile: export AWS_PROFILE=<profile-name>${NC}"
    echo ""
    print_info "Run this script again after re-authenticating: ${GREEN}pnpm copilot:auto${NC}"
    exit 1
  fi
  
  # Display the output for all cases (success or other errors)
  echo -e "$aws_output"
  
  # Ask user to confirm
  read -r -p "$(echo -e "${WHITE}Is this the correct AWS account? (y/N): ${NC}")" confirm
  if [[ "${confirm:-}" != "y" && "${confirm:-}" != "yes" ]]; then
    echo ""
    print_warning "AWS account verification cancelled by user."
    print_info "To fix your AWS configuration:"
    echo -e ""
    echo -e "   ${CYAN}• Set correct AWS_PROFILE: export AWS_PROFILE=<profile-name>${NC}"
    echo -e "   ${CYAN}• Login to SSO: aws sso login${NC}"
    echo -e "   ${CYAN}• Check available profiles: aws configure list-profiles${NC}"
    echo -e "   ${CYAN}• Configure new profiles: aws configure --profile <profile-name>${NC}"
    echo ""
    print_info "Run this script again when ready: ${GREEN}pnpm copilot:auto${NC}"
    exit 0
  fi
  
  print_success "AWS account verified"
}

# Trap signals for clean exit
cleanup() {
  echo ""
  print_error "Interrupted! Cleaning up..."
  exit 130
}
trap cleanup SIGINT SIGTERM

print_header "COPILOT AUTO-DEPLOY SCRIPT"
print_info "Automated deployment script for TheAnswer Copilot services"

print_phase "1" "PREREQUISITES & SETUP"

# Verify AWS account first
verify_aws_account

print_step "Checking required tools..."
for bin in aws jq copilot; do
  command -v "$bin" >/dev/null 2>&1 || {
    print_error "Required command '$bin' not found on PATH."
    exit 1
  }
done
print_success "All required tools found (aws, jq, copilot)"

lower() { printf '%s' "${1:-}" | tr '[:upper:]' '[:lower:]'; }

print_phase "2" "CLIENT DOMAIN SELECTION"
print_step "Enter client domain key..."
print_info "This is the main domain key (e.g., 'acme' for acme.theanswer.ai, not 'staging.acme')"
read -r -p "$(echo -e "${WHITE}Client domain key (e.g., acme): ${NC}")" SUBDOMAIN
SUBDOMAIN="$(lower "$SUBDOMAIN")"
if [[ -z "$SUBDOMAIN" || ! "$SUBDOMAIN" =~ ^[a-z0-9]([a-z0-9-]*[a-z0-9])?$ || "$SUBDOMAIN" =~ -- ]]; then
  print_error "Invalid domain key. Use letters, numbers, and hyphens (no leading/trailing hyphen, no double hyphens)."
  exit 1
fi

print_phase "3" "ENVIRONMENT SELECTION"
print_info "Select target environment:"
echo -e "  ${WHITE}1)${NC} staging"
echo -e "  ${WHITE}2)${NC} prod"
echo ""
read -r -p "$(echo -e "${WHITE}Enter choice (1-2 or staging/prod): ${NC}")" choice
case "${choice:-}" in
  1|staging) ENV="staging" ;;
  2|prod) ENV="prod" ;;
  *) print_error "Invalid choice"; exit 1 ;;
esac
print_success "Selected environment: $ENV"

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

print_success "Configuration validated:"
echo -e "   ${CYAN}ENV${NC}             = ${WHITE}$ENV${NC}"
echo -e "   ${CYAN}CLIENT_DOMAIN${NC}   = ${WHITE}$CLIENT_DOMAIN${NC}"
echo -e "   ${CYAN}AUTH0_BASE_URL${NC}  = ${WHITE}$AUTH0_BASE_URL${NC}"

print_phase "4" "APPLICATION SETUP"
print_step "Switching to correct app context..."
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

print_step "Checking environment files for app: ${APP_NAME:-unknown}"
# Check if app exists in the copilot app list first
if copilot app ls 2>/dev/null | grep -q "^${APP_NAME}$"; then
  # App exists - normal interactive flow
  if ! node ./copilot/scripts/create-env-files.js "$ENV"; then
    print_error "Environment file setup failed or was cancelled"
    exit 1
  fi
else
  # App doesn't exist - auto-select template creation, then prompt for guided vs empty
  if ! node ./copilot/scripts/create-env-files.js "$ENV" --auto-templates; then
    print_error "Environment file setup failed or was cancelled"
    exit 1
  fi
fi
print_success "Environment files configured"

print_phase "5" "COPILOT APPLICATION"
print_step "Checking Copilot app status..."
APP_EXISTS=false
if copilot app show >/dev/null 2>&1; then
  APP_EXISTS=true
  print_success "Copilot app exists"
else
  print_warning "Copilot app does not exist"
  read -r -p "$(echo -e "${WHITE}Create new Copilot app with domain '${CYAN}$CLIENT_DOMAIN${WHITE}'? (y/N): ${NC}")" create_app
  create_app_lc="$(lower "$create_app")"
  if [[ "$create_app_lc" == "y" || "$create_app_lc" == "yes" ]]; then
    print_step "Initializing Copilot app..."
    copilot app init --domain "$CLIENT_DOMAIN"
    APP_EXISTS=true
    print_success "Copilot app created successfully"
  else
    echo ""
    echo "╔══════════════════════════════════════════════════════════════════════════════╗"
    echo "║                                                                              ║"
    echo "║  🚫 Deployment Aborted                                                       ║"
    echo "║                                                                              ║"
    echo "║  Cannot proceed without a Copilot app.                                       ║"
    echo "║                                                                              ║"
    echo "║  Re-run this script when you're ready to proceed.                            ║"
    echo "║                                                                              ║"
    echo "╚══════════════════════════════════════════════════════════════════════════════╝"
    echo ""
    exit 1
  fi
fi

print_phase "6" "ENVIRONMENT MANAGEMENT"
print_step "Checking environment '$ENV' status..."
ENV_EXISTS=false
if copilot env show --name "$ENV" >/dev/null 2>&1; then
  ENV_EXISTS=true
  print_success "Environment '$ENV' exists"
else
  print_warning "Environment '$ENV' does not exist"
  read -r -p "$(echo -e "${WHITE}Create environment '${CYAN}$ENV${WHITE}'? (y/N): ${NC}")" create_env
  create_env_lc="$(lower "$create_env")"
  if [[ "$create_env_lc" != "y" && "$create_env_lc" != "yes" ]]; then
    print_error "Aborted: Cannot proceed without environment '$ENV'"
    exit 1
  fi
fi

# --- bootstrap / deploy the copilot environment (infra) ---
if [[ "$ENV_EXISTS" == "true" ]]; then
  print_step "Deploying existing environment '$ENV'..."
  copilot env deploy --name "$ENV" || true   # allow 'no changes' without failing
  print_success "Environment deployment completed"
else
  print_step "Creating and bootstrapping environment '$ENV'..."
  copilot env init --name "$ENV"
  copilot env deploy --name "$ENV"
  print_success "Environment created and deployed"
fi

print_phase "7" "SERVICE SELECTION"
print_info "Select services to deploy:"
echo -e "  ${WHITE}1)${NC} Both (flowise and web) - ${GREEN}default${NC}"
echo -e "  ${WHITE}2)${NC} flowise"
echo -e "  ${WHITE}3)${NC} web"
echo -e "  ${WHITE}4)${NC} exit"
svc_choice=""
if read -t 15 -r -p "$(echo -e "${WHITE}Enter choice (1-4) [default 1 in 15s]: ${NC}")" svc_choice; then
  :
else
  printf '\n'
  print_warning "No input after 15s — defaulting to \"both\""
  svc_choice="1"
fi
# Treat blank as default 1
if [[ -z "${svc_choice// }" ]]; then
  svc_choice="1"
fi

SERVICES=()
case "${svc_choice}" in
  1) SERVICES=("flowise" "web") ;;  # order preserved: flowise then web
  2) SERVICES=("flowise") ;;
  3) SERVICES=("web") ;;
  4) print_info "Aborted by user choice"; exit 0 ;;
  *) print_error "Invalid choice '$svc_choice'"; exit 1 ;;
esac

print_success "Selected services: ${SERVICES[*]}"

print_phase "8" "SERVICE DEPLOYMENT"
print_info "Deploying services to environment '$ENV'..."

for svc in "${SERVICES[@]}"; do
  print_step "Deploying service: $svc"
  copilot deploy --name "$svc" --env "$ENV"
  
  # Show health check URLs based on service type
  case "$svc" in
    "flowise")
      print_deployment_success "$svc" "https://api.${CLIENT_DOMAIN}/api/v1/ping"
      ;;
    "web")
      print_deployment_success "$svc" "https://${CLIENT_DOMAIN}/healthcheck"
      ;;
    *)
      print_deployment_success "$svc" ""
      ;;
  esac
done

print_header "DEPLOYMENT COMPLETE"
print_success "All services deployed successfully to '$ENV'"
print_info "Environment variables for future use:"
echo -e "   ${CYAN}export CLIENT_DOMAIN=\"$CLIENT_DOMAIN\"${NC}"
echo -e "   ${CYAN}export AUTH0_BASE_URL=\"$AUTH0_BASE_URL\"${NC}"
