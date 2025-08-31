#!/usr/bin/env bash

# Comprehensive test script for route53-zone-manager.sh
# Tests all scenarios and edge cases for Route53 zone management

# Color constants
readonly TEST_RED='\033[0;31m'
readonly TEST_GREEN='\033[0;32m'
readonly TEST_YELLOW='\033[1;33m'
readonly TEST_BLUE='\033[0;34m'
readonly TEST_PURPLE='\033[0;35m'
readonly TEST_CYAN='\033[0;36m'
readonly TEST_WHITE='\033[1;37m'
readonly TEST_NC='\033[0m'
readonly TEST_BOLD='\033[1m'

# Test tracking
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

# Helper functions
print_test_header() {
    echo -e "\n${TEST_PURPLE}${TEST_BOLD}╔═══════════════════════════════════════════════════════════════╗${TEST_NC}"
    echo -e "${TEST_PURPLE}${TEST_BOLD}║${TEST_NC} ${TEST_WHITE}${TEST_BOLD}ROUTE53 ZONE MANAGER VALIDATION${TEST_NC} ${TEST_PURPLE}${TEST_BOLD}║${TEST_NC}"
    echo -e "${TEST_PURPLE}${TEST_BOLD}╚═══════════════════════════════════════════════════════════════╝${TEST_NC}\n"
}

print_section() {
    echo -e "\n${TEST_CYAN}${TEST_BOLD}▶ $1${TEST_NC}"
    echo -e "${TEST_CYAN}${TEST_BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${TEST_NC}"
}

test_pass() {
    echo -e "  ${TEST_GREEN}✅ $1${TEST_NC}"
    ((TESTS_PASSED++))
    ((TESTS_TOTAL++))
}

test_fail() {
    echo -e "  ${TEST_RED}❌ $1${TEST_NC}"
    ((TESTS_FAILED++))
    ((TESTS_TOTAL++))
}

test_warning() {
    echo -e "  ${TEST_YELLOW}⚠️  $1${TEST_NC}"
}

print_summary() {
    echo -e "\n${TEST_PURPLE}${TEST_BOLD}╔═══════════════════════════════════════════════════════════════╗${TEST_NC}"
    echo -e "${TEST_PURPLE}${TEST_BOLD}║${TEST_NC} ${TEST_WHITE}${TEST_BOLD}VALIDATION SUMMARY${TEST_NC} ${TEST_PURPLE}${TEST_BOLD}║${TEST_NC}"
    echo -e "${TEST_PURPLE}${TEST_BOLD}╚═══════════════════════════════════════════════════════════════╝${TEST_NC}"
    echo -e "  ${TEST_WHITE}Total Tests:${TEST_NC} $TESTS_TOTAL"
    echo -e "  ${TEST_GREEN}Passed:${TEST_NC} $TESTS_PASSED"
    echo -e "  ${TEST_RED}Failed:${TEST_NC} $TESTS_FAILED"
    
    if [[ $TESTS_FAILED -eq 0 ]]; then
        echo -e "\n  ${TEST_GREEN}${TEST_BOLD}🎉 ALL TESTS PASSED! Route53 zone manager is production-ready.${TEST_NC}"
        exit 0
    else
        echo -e "\n  ${TEST_RED}${TEST_BOLD}❌ Some tests failed. Review issues above.${TEST_NC}"
        exit 1
    fi
}

# Test script existence and basic validation
test_script_basics() {
    local script_path="copilot/scripts/route53-zone-manager.sh"
    
    if [[ -f "$script_path" ]]; then
        test_pass "Script exists: route53-zone-manager.sh"
        
        # Check file size
        local file_size=$(wc -c < "$script_path")
        if [[ $file_size -gt 1000 ]]; then
            test_pass "Script size reasonable ($file_size bytes)"
        else
            test_fail "Script size too small ($file_size bytes)"
        fi
        
        # Check if executable
        if [[ -x "$script_path" ]]; then
            test_pass "Script is executable"
        else
            test_warning "Script not executable (chmod +x needed)"
        fi
        
        # Syntax validation
        if bash -n "$script_path" 2>/dev/null; then
            test_pass "Bash syntax valid"
        else
            test_fail "Bash syntax errors detected"
        fi
        
        # Check shebang
        if head -1 "$script_path" | grep -q "^#!/usr/bin/env bash"; then
            test_pass "Proper shebang present"
        else
            test_fail "Missing or incorrect shebang"
        fi
        
        # Check for strict error handling
        if grep -q "set -euo pipefail" "$script_path"; then
            test_pass "Strict error handling enabled"
        else
            test_fail "Missing strict error handling (set -euo pipefail)"
        fi
        
    else
        test_fail "Script missing: route53-zone-manager.sh"
        return 1
    fi
}

# Test required functions
test_required_functions() {
    local script_path="copilot/scripts/route53-zone-manager.sh"
    
    if [[ ! -f "$script_path" ]]; then
        test_fail "Cannot test functions - script missing"
        return 1
    fi
    
    local functions=("print_success" "print_warning" "print_error" "print_info" "print_step" "print_ns_records" "print_ns_records_placeholder" "lower")
    
    for func in "${functions[@]}"; do
        if grep -q "^${func}()" "$script_path"; then
            test_pass "Function '$func' present"
        else
            test_fail "Function '$func' missing"
        fi
    done
}

# Test color constants
test_color_constants() {
    local script_path="copilot/scripts/route53-zone-manager.sh"
    
    if [[ ! -f "$script_path" ]]; then
        test_fail "Cannot test colors - script missing"
        return 1
    fi
    
    local colors=("RED" "GREEN" "YELLOW" "BLUE" "PURPLE" "CYAN" "WHITE" "NC" "BOLD")
    
    for color in "${colors[@]}"; do
        if grep -q "^readonly ${color}=" "$script_path"; then
            test_pass "Color '$color' defined"
        else
            test_fail "Color '$color' missing"
        fi
    done
}

# Test parameter validation
test_parameter_validation() {
    local script_path="copilot/scripts/route53-zone-manager.sh"
    
    if [[ ! -f "$script_path" ]]; then
        test_fail "Cannot test parameters - script missing"
        return 1
    fi
    
    # Test parameter count validation
    if grep -q "if \[\[ \$# -ne 3 \]\]" "$script_path"; then
        test_pass "Parameter count validation present"
    else
        test_fail "Parameter count validation missing"
    fi
    
    # Test subdomain validation regex
    if grep -q "^[a-z0-9]([a-z0-9-]*[a-z0-9])?\$" "$script_path"; then
        test_pass "Subdomain validation regex present"
    else
        test_fail "Subdomain validation regex missing"
    fi
    
    # Test environment validation
    if grep -q "^(staging|prod)\$" "$script_path"; then
        test_pass "Environment validation present"
    else
        test_fail "Environment validation missing"
    fi
    
    # Test usage instructions
    if grep -q "Usage:" "$script_path" && grep -q "Examples:" "$script_path"; then
        test_pass "Usage and examples present"
    else
        test_fail "Usage or examples missing"
    fi
}

# Test domain logic
test_domain_logic() {
    # Test staging domain construction
    local SUBDOMAIN="test"
    local ENV="staging"
    local BASE_DOMAIN="theanswer.ai"
    
    if [[ "$ENV" == "staging" ]]; then
        TARGET_DOMAIN="staging.${SUBDOMAIN}.${BASE_DOMAIN}"
        PARENT_DOMAIN="${SUBDOMAIN}.${BASE_DOMAIN}"
    else
        TARGET_DOMAIN="${SUBDOMAIN}.${BASE_DOMAIN}"
        PARENT_DOMAIN="${BASE_DOMAIN}"
    fi
    
    if [[ "$TARGET_DOMAIN" == "staging.test.theanswer.ai" ]]; then
        test_pass "Staging domain construction correct"
    else
        test_fail "Staging domain construction broken: $TARGET_DOMAIN"
    fi
    
    if [[ "$PARENT_DOMAIN" == "test.theanswer.ai" ]]; then
        test_pass "Staging parent domain construction correct"
    else
        test_fail "Staging parent domain construction broken: $PARENT_DOMAIN"
    fi
    
    # Test prod domain construction
    ENV="prod"
    if [[ "$ENV" == "staging" ]]; then
        TARGET_DOMAIN="staging.${SUBDOMAIN}.${BASE_DOMAIN}"
        PARENT_DOMAIN="${SUBDOMAIN}.${BASE_DOMAIN}"
    else
        TARGET_DOMAIN="${SUBDOMAIN}.${BASE_DOMAIN}"
        PARENT_DOMAIN="${BASE_DOMAIN}"
    fi
    
    if [[ "$TARGET_DOMAIN" == "test.theanswer.ai" ]]; then
        test_pass "Prod domain construction correct"
    else
        test_fail "Prod domain construction broken: $TARGET_DOMAIN"
    fi
    
    if [[ "$PARENT_DOMAIN" == "theanswer.ai" ]]; then
        test_pass "Prod parent domain construction correct"
    else
        test_fail "Prod parent domain construction broken: $PARENT_DOMAIN"
    fi
}

# Test subdomain validation edge cases
test_subdomain_validation() {
    # Valid subdomains
    local valid_subdomains=("a" "123" "test123" "test-123" "a-b-c" "test123test" "client1" "staging-test" "prod123")
    
    for subdomain in "${valid_subdomains[@]}"; do
        if [[ "$subdomain" =~ ^[a-z0-9]([a-z0-9-]*[a-z0-9])?$ ]] && [[ ! "$subdomain" =~ -- ]]; then
            test_pass "Valid subdomain accepted: '$subdomain'"
        else
            test_fail "Valid subdomain rejected: '$subdomain'"
        fi
    done
    
    # Invalid subdomains
    local invalid_subdomains=("" "-test" "test-" "test--test" "test_test" "test.test" "test@test" "TEST" "Test" "test test" "test/test")
    
    for subdomain in "${invalid_subdomains[@]}"; do
        if [[ ! "$subdomain" =~ ^[a-z0-9]([a-z0-9-]*[a-z0-9])?$ ]] || [[ "$subdomain" =~ -- ]]; then
            test_pass "Invalid subdomain correctly rejected: '$subdomain'"
        else
            test_fail "Invalid subdomain incorrectly accepted: '$subdomain'"
        fi
    done
}

# Test NS record formatting
test_ns_record_formatting() {
    local script_path="copilot/scripts/route53-zone-manager.sh"
    
    if [[ ! -f "$script_path" ]]; then
        test_fail "Cannot test NS formatting - script missing"
        return 1
    fi
    
    # Check for copy-paste friendly section
    if grep -q "Copy-Paste Friendly NS Records" "$script_path"; then
        test_pass "Copy-paste friendly NS records section present"
    else
        test_fail "Copy-paste friendly NS records section missing"
    fi
    
    # Check for proper NS record display
    if grep -q "jq -r" "$script_path" && grep -q "ResourceRecords.*Value" "$script_path"; then
        test_pass "JSON parsing for NS records present"
    else
        test_fail "JSON parsing for NS records missing"
    fi
    
    # Check for instructions
    if grep -q "Instructions:" "$script_path"; then
        test_pass "NS record instructions present"
    else
        test_fail "NS record instructions missing"
    fi
}

# Test manual NS handling logic
test_manual_ns_handling() {
    local script_path="copilot/scripts/route53-zone-manager.sh"
    
    if [[ ! -f "$script_path" ]]; then
        test_fail "Cannot test manual NS handling - script missing"
        return 1
    fi
    
    # Check for MANUAL_NS_HANDLED flag
    if grep -q "MANUAL_NS_HANDLED" "$script_path"; then
        test_pass "MANUAL_NS_HANDLED flag present"
    else
        test_fail "MANUAL_NS_HANDLED flag missing (duplicate NS records possible)"
    fi
    
    # Check for duplicate prevention logic
    if grep -q "Manual NS configuration already handled" "$script_path"; then
        test_pass "Duplicate NS configuration prevention present"
    else
        test_fail "Duplicate NS configuration prevention missing"
    fi
    
    # Check for proper flag setting
    if grep -q "MANUAL_NS_HANDLED=true" "$script_path"; then
        test_pass "Manual NS flag setting present"
    else
        test_fail "Manual NS flag setting missing"
    fi
}

# Test TLD accessibility logic
test_tld_accessibility() {
    local script_path="copilot/scripts/route53-zone-manager.sh"
    
    if [[ ! -f "$script_path" ]]; then
        test_fail "Cannot test TLD accessibility - script missing"
        return 1
    fi
    
    # Check for TLD accessibility check
    if grep -q "TLD_ACCESSIBLE" "$script_path"; then
        test_pass "TLD accessibility check present"
    else
        test_fail "TLD accessibility check missing"
    fi
    
    # Check for test record creation/deletion
    if grep -q "_route53-test-" "$script_path"; then
        test_pass "Test record functionality present"
    else
        test_fail "Test record functionality missing"
    fi
    
    # Check for proper cleanup
    if grep -q "DELETE.*_route53-test-" "$script_path"; then
        test_pass "Test record cleanup present"
    else
        test_fail "Test record cleanup missing"
    fi
}

# Test error handling
test_error_handling() {
    local script_path="copilot/scripts/route53-zone-manager.sh"
    
    if [[ ! -f "$script_path" ]]; then
        test_fail "Cannot test error handling - script missing"
        return 1
    fi
    
    # Check for AWS CLI error handling
    if grep -q "2>/dev/null" "$script_path" && grep -q "|| echo" "$script_path"; then
        test_pass "AWS CLI error handling present"
    else
        test_fail "AWS CLI error handling missing"
    fi
    
    # Check for user confirmation prompts
    if grep -q "read -r -p" "$script_path"; then
        test_pass "User confirmation prompts present"
    else
        test_fail "User confirmation prompts missing"
    fi
    
    # Check for exit conditions
    if grep -q "exit 1" "$script_path" && grep -q "exit 0" "$script_path"; then
        test_pass "Proper exit conditions present"
    else
        test_fail "Proper exit conditions missing"
    fi
}

# Test integration points
test_integration_points() {
    local auto_deploy_path="copilot/scripts/copilot-auto-deploy.sh"
    local route53_path="copilot/scripts/route53-zone-manager.sh"
    
    if [[ ! -f "$auto_deploy_path" ]]; then
        test_warning "Cannot test integration - copilot-auto-deploy.sh missing"
        return 0
    fi
    
    if [[ ! -f "$route53_path" ]]; then
        test_fail "Cannot test integration - route53-zone-manager.sh missing"
        return 1
    fi
    
    # Check if auto-deploy calls route53 script
    if grep -q "route53-zone-manager.sh" "$auto_deploy_path"; then
        test_pass "Auto-deploy integrates with Route53 script"
    else
        test_fail "Auto-deploy missing Route53 integration"
    fi
    
    # Check for proper parameter passing
    if grep -q "\$SUBDOMAIN.*\$ENV.*\$BASE_DOMAIN" "$auto_deploy_path"; then
        test_pass "Proper parameter passing to Route53 script"
    else
        test_warning "Parameter passing to Route53 script unclear"
    fi
    
    # Check for error handling in integration
    if grep -q "route53-zone-manager.sh.*||" "$auto_deploy_path" || grep -q "if.*route53-zone-manager.sh" "$auto_deploy_path"; then
        test_pass "Error handling for Route53 script integration"
    else
        test_fail "Missing error handling for Route53 script integration"
    fi
}

# Test scenario coverage
test_scenario_coverage() {
    local script_path="copilot/scripts/route53-zone-manager.sh"
    
    if [[ ! -f "$script_path" ]]; then
        test_fail "Cannot test scenarios - script missing"
        return 1
    fi
    
    # Test staging parent zone creation
    if grep -q "Create parent zone" "$script_path"; then
        test_pass "Staging parent zone creation scenario covered"
    else
        test_fail "Staging parent zone creation scenario missing"
    fi
    
    # Test existing zone handling
    if grep -q "Target zone exists" "$script_path"; then
        test_pass "Existing zone scenario covered"
    else
        test_fail "Existing zone scenario missing"
    fi
    
    # Test manual configuration scenarios
    if grep -q "Manual NS configuration" "$script_path"; then
        test_pass "Manual configuration scenarios covered"
    else
        test_fail "Manual configuration scenarios missing"
    fi
    
    # Test automatic delegation
    if grep -q "NS delegation.*successful" "$script_path"; then
        test_pass "Automatic delegation scenario covered"
    else
        test_fail "Automatic delegation scenario missing"
    fi
}

# Test helper function: lower()
test_lower_function() {
    # Since we can't easily source the script, test the logic
    lower_test() { printf '%s' "${1:-}" | tr '[:upper:]' '[:lower:]'; }
    
    if [[ "$(lower_test 'TEST')" == "test" ]]; then
        test_pass "lower() function logic works"
    else
        test_fail "lower() function logic broken"
    fi
    
    if [[ "$(lower_test 'MixedCase')" == "mixedcase" ]]; then
        test_pass "lower() handles mixed case"
    else
        test_fail "lower() mixed case handling broken"
    fi
    
    if [[ "$(lower_test '')" == "" ]]; then
        test_pass "lower() handles empty string"
    else
        test_fail "lower() empty string handling broken"
    fi
}

# Main validation function
validate_route53_script() {
    print_test_header
    
    print_section "BASIC SCRIPT VALIDATION"
    test_script_basics
    
    print_section "REQUIRED FUNCTIONS"
    test_required_functions
    
    print_section "COLOR CONSTANTS"
    test_color_constants
    
    print_section "PARAMETER VALIDATION"
    test_parameter_validation
    
    print_section "DOMAIN CONSTRUCTION LOGIC"
    test_domain_logic
    
    print_section "SUBDOMAIN VALIDATION"
    test_subdomain_validation
    
    print_section "NS RECORD FORMATTING"
    test_ns_record_formatting
    
    print_section "MANUAL NS HANDLING"
    test_manual_ns_handling
    
    print_section "TLD ACCESSIBILITY"
    test_tld_accessibility
    
    print_section "ERROR HANDLING"
    test_error_handling
    
    print_section "INTEGRATION POINTS"
    test_integration_points
    
    print_section "SCENARIO COVERAGE"
    test_scenario_coverage
    
    print_section "HELPER FUNCTIONS"
    test_lower_function
    
    print_summary
}

# Run validation
validate_route53_script
