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
  echo -e "\n${PURPLE}${BOLD}╔═══════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${PURPLE}${BOLD}║${NC}${WHITE}${BOLD} $text${NC}${PURPLE}${BOLD}║${NC}"
  echo -e "${PURPLE}${BOLD}╚═══════════════════════════════════════════════════════════════╝${NC}\n"
}

print_phase() {
  echo -e "\n${CYAN}${BOLD}▶ PHASE $1: $2${NC}"
  echo -e "${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
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

# Source shared validation functions
source "$(dirname "${BASH_SOURCE[0]}")/../lib/validation-functions.sh"

# Main validation function
main() {
  # Check if running in deployment mode
  local deployment_mode=false
  if [[ "${1:-}" == "--deployment-mode" ]]; then
    deployment_mode=true
  fi
  
  if [[ "$deployment_mode" == "false" ]]; then
    print_header "BULLETPROOF COPILOT VALIDATION"
    print_info "Testing configuration before deployment..."
    
    # Set required environment variables for testing
    # Try to detect domain from current app context
    local detected_domain
    if [[ -f "copilot/.workspace" ]]; then
      local app_name=$(grep "application:" copilot/.workspace | cut -d' ' -f2)
      # Extract domain from app name (e.g., "acme-aai" -> "acme.theanswer.ai")
      if [[ "$app_name" =~ ^(.+)-aai$ ]]; then
        detected_domain="${BASH_REMATCH[1]}.theanswer.ai"
      else
        detected_domain="optimized.theanswer.ai"  # fallback
      fi
    else
      detected_domain="optimized.theanswer.ai"  # fallback
    fi
    
    export CLIENT_DOMAIN="${CLIENT_DOMAIN:-$detected_domain}"
    export AUTH0_BASE_URL="${AUTH0_BASE_URL:-https://$detected_domain}"
    
    print_info "Using environment variables:"
    print_info "  CLIENT_DOMAIN: $CLIENT_DOMAIN"
    print_info "  AUTH0_BASE_URL: $AUTH0_BASE_URL"
    print_info "  Detected from app: $app_name"
    
    print_phase "1" "VALIDATION"
  fi
  
  local validation_errors=0
  local services=("flowise" "web")
  
  # Validate addons first
  if ! validate_addons; then
    ((validation_errors++))
  fi
  
  if [[ "$deployment_mode" == "false" ]]; then
    echo ""
  fi
  
  # Validate each service
  for svc in "${services[@]}"; do
    # Get the current app name from workspace or use a default
    local app_name
    if [[ -f "copilot/.workspace" ]]; then
      app_name=$(grep "application:" copilot/.workspace | cut -d' ' -f2)
    else
      app_name="optimized-aai"  # fallback default
    fi
    
    # Use shared validation function
    if ! validate_service "$svc" "$app_name"; then
      ((validation_errors+=$?))
    fi
    
    if [[ "$deployment_mode" == "false" ]]; then
      echo ""
    fi
  done
  
  # Handle validation results
  if [[ $validation_errors -gt 0 ]]; then
    if [[ "$deployment_mode" == "false" ]]; then
      print_warning "⚠️  Found $validation_errors validation issue(s)"
      
      echo ""
      print_validation_fixes
      
      echo ""
      print_error "❌ Validation failed - fix issues before deployment"
    fi
    exit 1
  else
    if [[ "$deployment_mode" == "false" ]]; then
      print_success "✅ All validation checks passed!"
      print_info "🚀 Your configuration is bulletproof and ready for deployment!"
    fi
  fi
}

# Run main function
main "$@"
