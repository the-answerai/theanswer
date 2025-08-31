#!/usr/bin/env bash
set -euo pipefail

# Route53 Zone Manager Script
# Purpose: Manage Route53 hosted zones for TheAnswer Copilot deployments
# Usage: ./route53-zone-manager.sh <subdomain> <env> <base_domain>

# Color constants for consistent output with main script
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly PURPLE='\033[0;35m'
readonly CYAN='\033[0;36m'
readonly WHITE='\033[1;37m'
readonly NC='\033[0m' # No Color
readonly BOLD='\033[1m'

# Visual helper functions (matching main script style)
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

print_ns_records() {
  local zone_id="$1"
  local domain="$2"
  
  echo ""
  echo -e "${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${WHITE}${BOLD}📋 NS Records for Manual Configuration${NC}"
  echo -e "${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo -e "${WHITE}Domain:${NC} ${CYAN}$domain${NC}"
  echo ""
  echo -e "${WHITE}Name Servers:${NC}"
  
  # Get NS records for the zone
  local ns_records
  ns_records=$(aws route53 list-resource-record-sets \
    --hosted-zone-id "$zone_id" \
    --query "ResourceRecordSets[?Type=='NS' && Name=='${domain}.'].ResourceRecords[].Value" \
    --output text 2>/dev/null || echo "")
  
  if [[ -n "$ns_records" ]]; then
    echo "$ns_records" | while read -r ns; do
      echo -e "  ${GREEN}•${NC} ${WHITE}${ns}${NC}"
    done
  else
    print_error "Could not retrieve NS records"
  fi
  
  echo ""
  echo -e "${YELLOW}${BOLD}Instructions:${NC}"
  echo -e "  1. Log into your DNS provider for the parent domain"
  echo -e "  2. Create an NS record for: ${CYAN}$domain${NC}"
  echo -e "  3. Add the name servers listed above"
  echo -e "  4. Wait for DNS propagation (usually 5-30 minutes)"
  echo ""
  echo -e "${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
}

# Helper function to convert to lowercase
lower() { 
  printf '%s' "${1:-}" | tr '[:upper:]' '[:lower:]'
}

# Validate input parameters
if [[ $# -ne 3 ]]; then
  print_error "Invalid arguments"
  echo ""
  echo -e "${WHITE}${BOLD}Route53 Zone Manager Script${NC}"
  echo -e "${CYAN}Purpose:${NC} Manage Route53 hosted zones for TheAnswer Copilot deployments"
  echo ""
  echo -e "${WHITE}${BOLD}Usage:${NC}"
  echo -e "  ${CYAN}$0 <subdomain> <env> <base_domain>${NC}"
  echo ""
  echo -e "${WHITE}${BOLD}Parameters:${NC}"
  echo -e "  ${CYAN}subdomain${NC}    - Client subdomain (e.g., 'acme' for acme.theanswer.ai)"
  echo -e "  ${CYAN}env${NC}          - Environment ('staging' or 'prod')"
  echo -e "  ${CYAN}base_domain${NC}  - Base domain (e.g., 'theanswer.ai')"
  echo ""
  echo -e "${WHITE}${BOLD}Examples:${NC}"
  echo -e "  ${CYAN}$0 acme staging theanswer.ai${NC}     # Creates staging.acme.theanswer.ai"
  echo -e "  ${CYAN}$0 acme prod theanswer.ai${NC}        # Creates acme.theanswer.ai"
  echo ""
  echo -e "${YELLOW}${BOLD}Note:${NC} This script can be used manually or called by the auto-deploy script."
  echo -e "For complete automated deployment, use: ${CYAN}pnpm copilot:auto${NC}"
  echo ""
  exit 1
fi

SUBDOMAIN="$1"
ENV="$2"
BASE_DOMAIN="$3"

# Validate parameter values
if [[ -z "$SUBDOMAIN" ]]; then
  print_error "Subdomain parameter is required"
  exit 1
fi

if [[ ! "$ENV" =~ ^(staging|prod)$ ]]; then
  print_error "Environment must be 'staging' or 'prod', got: '$ENV'"
  exit 1
fi

if [[ -z "$BASE_DOMAIN" ]]; then
  print_error "Base domain parameter is required"
  exit 1
fi

# Validate subdomain format (same as main script)
if [[ ! "$SUBDOMAIN" =~ ^[a-z0-9]([a-z0-9-]*[a-z0-9])?$ ]] || [[ "$SUBDOMAIN" =~ -- ]]; then
  print_error "Invalid subdomain format: '$SUBDOMAIN'"
  echo -e "${YELLOW}Use letters, numbers, and hyphens (no leading/trailing hyphen, no double hyphens).${NC}"
  exit 1
fi

# Determine target domain based on environment
if [[ "$ENV" == "staging" ]]; then
  TARGET_DOMAIN="staging.${SUBDOMAIN}.${BASE_DOMAIN}"
  PARENT_DOMAIN="${SUBDOMAIN}.${BASE_DOMAIN}"
else
  TARGET_DOMAIN="${SUBDOMAIN}.${BASE_DOMAIN}"
  PARENT_DOMAIN="${BASE_DOMAIN}"
fi

print_step "Route53 Zone Management for: ${CYAN}${TARGET_DOMAIN}${NC}"

# Step 1: List all Route53 zones
print_step "Analyzing existing Route53 zones..."
ZONES_JSON=$(aws route53 list-hosted-zones --output json 2>/dev/null || echo '{"HostedZones":[]}')

# Parse zones into an array for easier processing
declare -A ZONE_MAP
while IFS= read -r zone_data; do
  zone_name=$(echo "$zone_data" | jq -r '.Name' | sed 's/\.$//')
  zone_id=$(echo "$zone_data" | jq -r '.Id' | sed 's|/hostedzone/||')
  ZONE_MAP["$zone_name"]="$zone_id"
done < <(echo "$ZONES_JSON" | jq -c '.HostedZones[]' 2>/dev/null || echo "")

# Display found zones
if [[ ${#ZONE_MAP[@]} -gt 0 ]]; then
  print_info "Found ${#ZONE_MAP[@]} existing Route53 zone(s):"
  for zone in "${!ZONE_MAP[@]}"; do
    echo -e "  ${CYAN}•${NC} $zone"
  done
else
  print_warning "No existing Route53 zones found"
fi

# Step 2: Check if target zone exists
TARGET_ZONE_ID=""
if [[ -n "${ZONE_MAP[$TARGET_DOMAIN]:-}" ]]; then
  TARGET_ZONE_ID="${ZONE_MAP[$TARGET_DOMAIN]}"
  print_success "Target zone exists: ${TARGET_DOMAIN} (${TARGET_ZONE_ID})"
else
  print_warning "Target zone does not exist: ${TARGET_DOMAIN}"
fi

# Step 3: Check parent zone access permissions
PARENT_ZONE_ID=""
PARENT_ACCESSIBLE=false
if [[ -n "${ZONE_MAP[$PARENT_DOMAIN]:-}" ]]; then
  PARENT_ZONE_ID="${ZONE_MAP[$PARENT_DOMAIN]}"
  print_info "Parent zone found: ${PARENT_DOMAIN} (${PARENT_ZONE_ID})"
  
  # Test write access to parent zone
  print_step "Testing write access to parent zone..."
  TEST_RECORD="_route53-test-${RANDOM}.${PARENT_DOMAIN}"
  
  # Create test TXT record
  CHANGE_BATCH=$(cat <<EOF
{
  "Changes": [{
    "Action": "CREATE",
    "ResourceRecordSet": {
      "Name": "${TEST_RECORD}",
      "Type": "TXT",
      "TTL": 60,
      "ResourceRecords": [{"Value": "\"test\""}]
    }
  }]
}
EOF
)
  
  if aws route53 change-resource-record-sets \
    --hosted-zone-id "$PARENT_ZONE_ID" \
    --change-batch "$CHANGE_BATCH" \
    >/dev/null 2>&1; then
    
    # Clean up test record
    CHANGE_BATCH=$(cat <<EOF
{
  "Changes": [{
    "Action": "DELETE",
    "ResourceRecordSet": {
      "Name": "${TEST_RECORD}",
      "Type": "TXT",
      "TTL": 60,
      "ResourceRecords": [{"Value": "\"test\""}]
    }
  }]
}
EOF
)
    aws route53 change-resource-record-sets \
      --hosted-zone-id "$PARENT_ZONE_ID" \
      --change-batch "$CHANGE_BATCH" \
      >/dev/null 2>&1 || true
    
    PARENT_ACCESSIBLE=true
    print_success "Write access confirmed for parent zone"
  else
    print_warning "No write access to parent zone (manual NS configuration required)"
  fi
else
  print_warning "Parent zone not found in Route53: ${PARENT_DOMAIN}"
  
  # Offer to create parent zone if it doesn't exist
  if [[ "$ENV" == "staging" ]]; then
    echo ""
    read -r -p "$(echo -e "${WHITE}Create parent zone '${CYAN}${PARENT_DOMAIN}${WHITE}' in this account? (y/N): ${NC}")" create_parent
    create_parent_lc="$(lower "$create_parent")"
    
    if [[ "$create_parent_lc" == "y" || "$create_parent_lc" == "yes" ]]; then
      print_step "Creating parent zone: ${PARENT_DOMAIN}..."
      
      # Generate caller reference for parent zone
      PARENT_CALLER_REF="theanswer-parent-$(date +%s)-${RANDOM}"
      
      # Create the parent hosted zone
      PARENT_CREATE_OUTPUT=$(aws route53 create-hosted-zone \
        --name "$PARENT_DOMAIN" \
        --caller-reference "$PARENT_CALLER_REF" \
        --hosted-zone-config "Comment=TheAnswer parent zone for ${SUBDOMAIN}" \
        --output json 2>&1) || {
        print_error "Failed to create parent zone"
        echo "$PARENT_CREATE_OUTPUT"
        print_info "Manual NS configuration will be required"
        PARENT_ACCESSIBLE=false
      }
      
      # Extract parent zone ID from creation output
      PARENT_ZONE_ID=$(echo "$PARENT_CREATE_OUTPUT" | jq -r '.HostedZone.Id' | sed 's|/hostedzone/||')
      print_success "Parent zone created successfully: ${PARENT_ZONE_ID}"
      
      # Update our zone map
      ZONE_MAP["$PARENT_DOMAIN"]="$PARENT_ZONE_ID"
      PARENT_ACCESSIBLE=true
    else
      print_info "Manual NS configuration will be required"
      PARENT_ACCESSIBLE=false
    fi
  else
    print_info "Manual NS configuration will be required"
    PARENT_ACCESSIBLE=false
  fi
fi

# Step 4: Create zone if it doesn't exist
if [[ -z "$TARGET_ZONE_ID" ]]; then
  echo ""
  read -r -p "$(echo -e "${WHITE}Create Route53 hosted zone for '${CYAN}${TARGET_DOMAIN}${WHITE}'? (y/N): ${NC}")" create_zone
  create_zone_lc="$(lower "$create_zone")"
  
  if [[ "$create_zone_lc" == "y" || "$create_zone_lc" == "yes" ]]; then
    print_step "Creating hosted zone: ${TARGET_DOMAIN}..."
    
    # Generate caller reference
    CALLER_REF="theanswer-$(date +%s)-${RANDOM}"
    
    # Create the hosted zone
    CREATE_OUTPUT=$(aws route53 create-hosted-zone \
      --name "$TARGET_DOMAIN" \
      --caller-reference "$CALLER_REF" \
      --hosted-zone-config "Comment=TheAnswer deployment for ${SUBDOMAIN} (${ENV})" \
      --output json 2>&1) || {
      print_error "Failed to create hosted zone"
      echo "$CREATE_OUTPUT"
      echo ""
      read -r -p "$(echo -e "${WHITE}Continue anyway? (y/N): ${NC}")" continue_anyway
      continue_anyway_lc="$(lower "$continue_anyway")"
      if [[ "$continue_anyway_lc" != "y" && "$continue_anyway_lc" != "yes" ]]; then
        exit 1
      fi
      exit 0
    }
    
    # Extract zone ID from creation output
    TARGET_ZONE_ID=$(echo "$CREATE_OUTPUT" | jq -r '.HostedZone.Id' | sed 's|/hostedzone/||')
    print_success "Hosted zone created successfully: ${TARGET_ZONE_ID}"
    
    # Update our zone map
    ZONE_MAP["$TARGET_DOMAIN"]="$TARGET_ZONE_ID"
  else
    print_error "Cannot proceed without Route53 hosted zone"
    echo ""
    print_info "To create the zone manually:"
    echo -e "  ${CYAN}aws route53 create-hosted-zone --name ${TARGET_DOMAIN} --caller-reference \$(date +%s)${NC}"
    echo ""
    read -r -p "$(echo -e "${WHITE}Exit deployment? (Y/n): ${NC}")" exit_deploy
    exit_deploy_lc="$(lower "$exit_deploy")"
    if [[ "$exit_deploy_lc" != "n" && "$exit_deploy_lc" != "no" ]]; then
      exit 1
    fi
    exit 0
  fi
fi

# Step 5: Handle NS records
if [[ -n "$TARGET_ZONE_ID" ]]; then
  print_step "Configuring NS records..."
  
  # Get NS records for the target zone
  NS_RECORDS=$(aws route53 list-resource-record-sets \
    --hosted-zone-id "$TARGET_ZONE_ID" \
    --query "ResourceRecordSets[?Type=='NS' && Name=='${TARGET_DOMAIN}.'].ResourceRecords[].Value" \
    --output json 2>/dev/null || echo "[]")
  
  if [[ "$NS_RECORDS" == "[]" ]]; then
    print_error "Could not retrieve NS records for zone"
  else
    # Check if we can create NS records in parent zone
    if [[ "$PARENT_ACCESSIBLE" == "true" && -n "$PARENT_ZONE_ID" ]]; then
      print_step "Checking existing NS delegation in parent zone..."
      
      # Check if NS record already exists
      EXISTING_NS=$(aws route53 list-resource-record-sets \
        --hosted-zone-id "$PARENT_ZONE_ID" \
        --query "ResourceRecordSets[?Type=='NS' && Name=='${TARGET_DOMAIN}.']" \
        --output json 2>/dev/null || echo "[]")
      
      if [[ "$EXISTING_NS" != "[]" ]]; then
        print_success "NS delegation already exists in parent zone"
      else
        print_step "Creating NS delegation in parent zone..."
        
        # Build resource records JSON
        RESOURCE_RECORDS=$(echo "$NS_RECORDS" | jq -c 'map({"Value": .})')
        
        # Create NS record in parent zone
        CHANGE_BATCH=$(cat <<EOF
{
  "Changes": [{
    "Action": "CREATE",
    "ResourceRecordSet": {
      "Name": "${TARGET_DOMAIN}",
      "Type": "NS",
      "TTL": 300,
      "ResourceRecords": ${RESOURCE_RECORDS}
    }
  }]
}
EOF
)
        
        if aws route53 change-resource-record-sets \
          --hosted-zone-id "$PARENT_ZONE_ID" \
          --change-batch "$CHANGE_BATCH" \
          >/dev/null 2>&1; then
          print_success "NS delegation created successfully in parent zone"
          print_info "DNS propagation may take 5-30 minutes"
        else
          print_warning "Failed to create NS delegation automatically"
          print_ns_records "$TARGET_ZONE_ID" "$TARGET_DOMAIN"
          read -r -p "$(echo -e "${WHITE}Press Enter when DNS configuration is complete...${NC}")"
        fi
      fi
    else
      # Manual NS configuration required
      print_warning "Manual NS configuration required"
      print_ns_records "$TARGET_ZONE_ID" "$TARGET_DOMAIN"
      read -r -p "$(echo -e "${WHITE}Press Enter when DNS configuration is complete...${NC}")"
    fi
  fi
fi

# Step 6: Final validation
print_step "Validating Route53 configuration..."

# Check if zone exists and is queryable
if [[ -n "$TARGET_ZONE_ID" ]]; then
  # Verify zone is active
  ZONE_STATUS=$(aws route53 get-hosted-zone \
    --id "$TARGET_ZONE_ID" \
    --query 'HostedZone.ResourceRecordSetCount' \
    --output text 2>/dev/null || echo "0")
  
  if [[ "$ZONE_STATUS" -gt 0 ]]; then
    print_success "Route53 zone is active with $ZONE_STATUS record(s)"
  else
    print_warning "Route53 zone exists but may not be fully configured"
  fi
  
  print_success "Route53 configuration complete for: ${TARGET_DOMAIN}"
  echo ""
  print_info "Summary:"
  echo -e "  ${CYAN}Target Domain:${NC} ${TARGET_DOMAIN}"
  echo -e "  ${CYAN}Zone ID:${NC} ${TARGET_ZONE_ID}"
  echo -e "  ${CYAN}Parent Zone:${NC} ${PARENT_DOMAIN} $(if [[ "$PARENT_ACCESSIBLE" == "true" ]]; then echo -e "${GREEN}(accessible)${NC}"; else echo -e "${YELLOW}(manual config)${NC}"; fi)"
  echo ""
else
  print_error "Route53 zone configuration incomplete"
  exit 1
fi

exit 0
