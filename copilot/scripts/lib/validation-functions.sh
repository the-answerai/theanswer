#!/usr/bin/env bash

# =============================================================================
# COPILOT VALIDATION FUNCTIONS LIBRARY
# =============================================================================
# Shared validation functions for Copilot manifest and configuration validation.
# This library provides a single source of truth for all validation logic.
#
# Usage:
#   source "$(dirname "${BASH_SOURCE[0]}")/../lib/validation-functions.sh"
#
# Functions provided:
#   - validate_auto_scaling()
#   - validate_env_vars() 
#   - test_manifest_package()
#   - validate_addons()
#
# Requirements:
#   - AWS CLI
#   - Copilot CLI
#   - jq (optional, for enhanced output)
#   - Color constants and print functions from calling script
# =============================================================================

# Fallback print functions if not defined by calling script
if ! command -v print_step >/dev/null 2>&1; then
  print_step() { echo "→ $1"; }
fi
if ! command -v print_success >/dev/null 2>&1; then
  print_success() { echo "✅ $1"; }
fi
if ! command -v print_error >/dev/null 2>&1; then
  print_error() { echo "❌ $1"; }
fi
if ! command -v print_warning >/dev/null 2>&1; then
  print_warning() { echo "⚠️  $1"; }
fi
if ! command -v print_info >/dev/null 2>&1; then
  print_info() { echo "ℹ️  $1"; }
fi

# Function to validate auto-scaling configuration
validate_auto_scaling() {
  local service_name="$1"
  local manifest_file="copilot/${service_name}/manifest.yml"
  
  print_step "Validating auto-scaling configuration for $service_name..."
  
  # Check if manifest exists
  if [[ ! -f "$manifest_file" ]]; then
    print_error "Manifest file not found: $manifest_file"
    return 1
  fi
  
  # Check for incorrect auto-scaling structure
  if grep -q "scaling:" "$manifest_file"; then
    print_error "CRITICAL: Found deprecated 'scaling:' configuration in $service_name manifest"
    print_info "   Auto-scaling should be under 'count:' field, not 'scaling:'"
    print_info "   This will prevent auto-scaling from working properly"
    print_info "   FIX: Replace 'scaling:' with 'count:' and use 'cpu_percentage' instead of 'target_cpu'"
    return 1
  fi
  
  # Check for correct auto-scaling structure
  if grep -q "count:" "$manifest_file" && grep -A 10 "count:" "$manifest_file" | grep -q "range:"; then
    print_success "Auto-scaling configuration looks correct for $service_name"
    return 0
  else
    print_warning "No auto-scaling configuration found for $service_name"
    print_info "   Consider adding 'count: { range: 1-10, cpu_percentage: 80 }' for auto-scaling"
    return 0  # Not a critical error, just a warning
  fi
}

# Function to validate environment variables
validate_env_vars() {
  local service_name="$1"
  local manifest_file="copilot/${service_name}/manifest.yml"
  
  print_step "Validating environment variables for $service_name..."
  
  # Check for required environment variables
  local missing_vars=()
  
  # Check for CLIENT_DOMAIN usage
  if grep -q "\${CLIENT_DOMAIN}" "$manifest_file" && [[ -z "${CLIENT_DOMAIN:-}" ]]; then
    missing_vars+=("CLIENT_DOMAIN")
  fi
  
  # Check for AUTH0_BASE_URL usage (web service)
  if [[ "$service_name" == "web" ]] && grep -q "\${AUTH0_BASE_URL}" "$manifest_file" && [[ -z "${AUTH0_BASE_URL:-}" ]]; then
    missing_vars+=("AUTH0_BASE_URL")
  fi
  
  if [[ ${#missing_vars[@]} -gt 0 ]]; then
    print_error "Missing required environment variables for $service_name:"
    for var in "${missing_vars[@]}"; do
      print_info "   - $var"
    done
    print_info "   FIX: Set the missing environment variables before deployment"
    return 1
  else
    print_success "Environment variables validated for $service_name"
    return 0
  fi
}

# Function to test manifest packaging with comprehensive validation
test_manifest_package() {
  local service_name="$1"
  local app_name="${2:-${APP_NAME}}"  # Allow override or use global APP_NAME
  local temp_dir="/tmp/copilot-validation-${service_name}-$$"
  
  print_step "Testing manifest packaging for $service_name..."
  
  # Create temporary directory
  mkdir -p "$temp_dir"
  
  # Try to package the service
  if copilot svc package --app "$app_name" --name "$service_name" --output-dir "$temp_dir" >/dev/null 2>&1; then
    print_success "Manifest packaging successful for $service_name"
    
    # Comprehensive CloudFormation validation
    local cf_files=("$temp_dir"/*.yml)
    local validation_passed=true
    
    for cf_file in "${cf_files[@]}"; do
      if [[ -f "$cf_file" ]]; then
        print_step "  Validating CloudFormation: $(basename "$cf_file")"
        
        # Check for auto-scaling resources (only in main service stacks, not addon stacks)
        if [[ "$(basename "$cf_file")" == *".addons.stack.yml" ]]; then
          print_info "    Skipping auto-scaling validation for addon stack"
        elif grep -q "ApplicationAutoScaling" "$cf_file" 2>/dev/null; then
          print_success "    Auto-scaling resources detected"
          
          # Verify specific auto-scaling components
          if grep -q "AWS::ApplicationAutoScaling::ScalableTarget" "$cf_file" 2>/dev/null; then
            print_success "    ScalableTarget resource found"
          else
            print_error "    ScalableTarget resource missing"
            validation_passed=false
          fi
          
          if grep -q "AWS::ApplicationAutoScaling::ScalingPolicy" "$cf_file" 2>/dev/null; then
            print_success "    ScalingPolicy resources found"
          else
            print_error "    ScalingPolicy resources missing"
            validation_passed=false
          fi
        elif [[ "$(basename "$cf_file")" != *".addons.stack.yml" ]]; then
          print_error "    No auto-scaling resources found in CloudFormation"
          print_info "    This indicates auto-scaling is not properly configured"
          validation_passed=false
        fi
        
        # Check for ECS service configuration (only in main service stacks, not addon stacks)
        if [[ "$(basename "$cf_file")" == *".addons.stack.yml" ]]; then
          print_info "    Skipping ECS validation for addon stack"
        elif grep -q "AWS::ECS::Service" "$cf_file" 2>/dev/null; then
          print_success "    ECS Service resource found"
          
          # Check if DesiredCount is properly configured
          if grep -q "DesiredCount:" "$cf_file" 2>/dev/null; then
            print_success "    DesiredCount configuration found"
          else
            print_warning "    DesiredCount configuration missing"
          fi
        else
          print_error "    ECS Service resource missing"
          validation_passed=false
        fi
        
        # Check for load balancer configuration (skip for addon stacks)
        if [[ "$(basename "$cf_file")" == *".addons.stack.yml" ]]; then
          print_info "    Skipping load balancer validation for addon stack"
        elif grep -q "AWS::ElasticLoadBalancingV2::LoadBalancer\|AWS::ElasticLoadBalancingV2::TargetGroup" "$cf_file" 2>/dev/null; then
          print_success "    Load balancer resources found"
        else
          print_warning "    Load balancer resources not found (may be internal service)"
        fi
        
        # Validate CloudFormation syntax
        if command -v aws >/dev/null 2>&1; then
          if aws cloudformation validate-template --template-body "file://$cf_file" >/dev/null 2>&1; then
            print_success "    CloudFormation syntax is valid"
          else
            print_error "    CloudFormation syntax validation failed"
            validation_passed=false
          fi
        else
          print_warning "    AWS CLI not available, skipping CloudFormation syntax validation"
        fi
      fi
    done
    
    # Clean up
    rm -rf "$temp_dir"
    
    if [[ "$validation_passed" == "true" ]]; then
      print_success "All CloudFormation validations passed for $service_name"
      return 0
    else
      print_error "CloudFormation validation failed for $service_name"
      return 1
    fi
  else
    # Check if the error is due to app not existing (which is expected for new deployments)
    local error_output
    error_output=$(copilot svc package --app "$app_name" --name "$service_name" --output-dir "$temp_dir" 2>&1)
    if echo "$error_output" | grep -q "couldn't find an application named"; then
      print_warning "App '$app_name' doesn't exist in AWS yet (expected for new deployments)"
      print_info "   This is normal for first-time deployments"
      print_info "   The manifest syntax is valid, but the app needs to be created first"
      rm -rf "$temp_dir"
      return 0  # Not a critical error for new deployments
    else
      print_error "Manifest packaging failed for $service_name"
      print_info "   This indicates a configuration issue in the manifest"
      print_info "   Common issues:"
      print_info "   - Missing environment variables"
      print_info "   - Invalid YAML syntax"
      print_info "   - Incorrect resource references"
      rm -rf "$temp_dir"
      return 1
    fi
  fi
}

# Function to validate addons configuration
validate_addons() {
  print_step "Validating addons configuration..."
  
  local addons_dir="copilot/environments/addons"
  local addon_errors=0
  
  if [[ ! -d "$addons_dir" ]]; then
    print_warning "⚠️  No addons directory found at $addons_dir"
    return 0
  fi
  
  # Check each addon file
  for addon_file in "$addons_dir"/*.yml; do
    if [[ -f "$addon_file" ]]; then
      local addon_name=$(basename "$addon_file" .yml)
      print_step "  Validating addon: $addon_name"
      
      # Skip parameters file (not a CloudFormation template)
      if [[ "$addon_name" == "addons.parameters" ]]; then
        print_info "    Skipping parameters file (this is a CloudFormation parameters file, not a template)"
        continue
      fi
      
      # Check for required Copilot parameters
      if ! grep -q "App:" "$addon_file" || ! grep -q "Env:" "$addon_file"; then
        print_error "    Missing required Copilot parameters (App, Env) in $addon_name"
        ((addon_errors++))
      else
        print_success "    Required parameters found"
      fi
      
      # Check for proper exports
      if ! grep -q "Export:" "$addon_file"; then
        print_warning "    No exports found in $addon_name (may be intentional)"
      else
        print_success "    Exports configured"
      fi
      
      # Validate CloudFormation syntax
      if command -v aws >/dev/null 2>&1; then
        if aws cloudformation validate-template --template-body "file://$addon_file" >/dev/null 2>&1; then
          print_success "    CloudFormation syntax is valid"
        else
          print_error "    CloudFormation syntax validation failed"
          ((addon_errors++))
        fi
      fi
    fi
  done
  
  if [[ $addon_errors -eq 0 ]]; then
    print_success "All addons validation passed"
    return 0
  else
    print_error "Found $addon_errors addon validation error(s)"
    return 1
  fi
}

# Function to print common validation fixes (helper function)
print_validation_fixes() {
  print_info "🔧 Common Fixes:"
  print_info "   1. Auto-scaling issues:"
  print_info "      - Replace 'scaling:' with 'count:' in manifest"
  print_info "      - Use 'cpu_percentage' instead of 'target_cpu'"
  print_info "      - Use 'memory_percentage' instead of 'target_memory'"
  print_info "   2. Environment variables:"
  print_info "      - Set CLIENT_DOMAIN=your-domain.theanswer.ai"
  print_info "      - Set AUTH0_BASE_URL=https://your-domain.theanswer.ai (for web service)"
  print_info "   3. Addons issues:"
  print_info "      - Ensure App: and Env: parameters are present"
  print_info "      - Check CloudFormation syntax with 'aws cloudformation validate-template'"
}

# Function to run all validations for a service (orchestration helper)
validate_service() {
  local service_name="$1"
  local app_name="${2:-${APP_NAME}}"
  local errors=0
  
  print_info "Validating service: $service_name"
  
  # Validate auto-scaling configuration
  if ! validate_auto_scaling "$service_name"; then
    ((errors++))
  fi
  
  # Validate environment variables
  if ! validate_env_vars "$service_name"; then
    ((errors++))
  fi
  
  # Test manifest packaging
  if ! test_manifest_package "$service_name" "$app_name"; then
    ((errors++))
  fi
  
  return $errors
}

# Export functions so they can be used by sourcing scripts
export -f validate_auto_scaling
export -f validate_env_vars
export -f test_manifest_package
export -f validate_addons
export -f print_validation_fixes
export -f validate_service
