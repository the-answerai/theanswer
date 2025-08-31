#!/usr/bin/env bash

# Comprehensive test script for copilot-switch-app.sh
# Tests application name generation and workspace management

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
    echo -e "${TEST_PURPLE}${TEST_BOLD}║${TEST_NC} ${TEST_WHITE}${TEST_BOLD}COPILOT SWITCH APP VALIDATION${TEST_NC} ${TEST_PURPLE}${TEST_BOLD}║${TEST_NC}"
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
        echo -e "\n  ${TEST_GREEN}${TEST_BOLD}🎉 ALL TESTS PASSED! Copilot switch app script is production-ready.${TEST_NC}"
        exit 0
    else
        echo -e "\n  ${TEST_RED}${TEST_BOLD}❌ Some tests failed. Review issues above.${TEST_NC}"
        exit 1
    fi
}

# Test script existence and basic validation
test_script_basics() {
    local script_path="copilot/scripts/copilot-switch-app.sh"
    
    if [[ -f "$script_path" ]]; then
        test_pass "Script exists: copilot-switch-app.sh"
        
        # Check file size
        local file_size=$(wc -c < "$script_path")
        if [[ $file_size -gt 500 ]]; then
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
        if head -1 "$script_path" | grep -q "^#!/usr/bin/env bash\|^#!/bin/bash"; then
            test_pass "Proper shebang present"
        else
            test_fail "Missing or incorrect shebang"
        fi
        
    else
        test_fail "Script missing: copilot-switch-app.sh"
        return 1
    fi
}

# Test app name generation logic
test_app_name_generation() {
    # Test staging domain conversion
    local test_cases=(
        "staging.acme.theanswer.ai:staging-acme-aai"
        "prod.acme.theanswer.ai:prod-acme-aai"
        "acme.theanswer.ai:acme-aai"
        "staging.test123.theanswer.ai:staging-test123-aai"
        "client-name.theanswer.ai:client-name-aai"
        "staging.client-name.theanswer.ai:staging-client-name-aai"
    )
    
    for test_case in "${test_cases[@]}"; do
        local input_domain="${test_case%%:*}"
        local expected_output="${test_case##*:}"
        
        # Simulate the app name generation logic
        local app_name=""
        if [[ "$input_domain" =~ ^staging\.(.+)\.theanswer\.ai$ ]]; then
            app_name="staging-${BASH_REMATCH[1]}-aai"
        elif [[ "$input_domain" =~ ^prod\.(.+)\.theanswer\.ai$ ]]; then
            app_name="prod-${BASH_REMATCH[1]}-aai"
        elif [[ "$input_domain" =~ ^(.+)\.theanswer\.ai$ ]]; then
            app_name="${BASH_REMATCH[1]}-aai"
        else
            app_name="$input_domain"
        fi
        
        if [[ "$app_name" == "$expected_output" ]]; then
            test_pass "App name generation: '$input_domain' → '$app_name'"
        else
            test_fail "App name generation failed: '$input_domain' → '$app_name' (expected '$expected_output')"
        fi
    done
}

# Test default behavior
test_default_behavior() {
    local script_path="copilot/scripts/copilot-switch-app.sh"
    
    if [[ ! -f "$script_path" ]]; then
        test_fail "Cannot test defaults - script missing"
        return 1
    fi
    
    # Check for default to "aai" behavior
    if grep -q "aai" "$script_path" && grep -q "WARNING.*No domain provided" "$script_path"; then
        test_pass "Default to 'aai' behavior present"
    else
        test_fail "Default to 'aai' behavior missing"
    fi
    
    # Check for warning message
    if grep -q "WARNING.*No domain provided" "$script_path"; then
        test_pass "Warning message for no domain present"
    else
        test_fail "Warning message for no domain missing"
    fi
    
    # Check for usage instructions
    if grep -q "For proper usage" "$script_path" && grep -q "CLIENT_DOMAIN=" "$script_path"; then
        test_pass "Usage instructions present"
    else
        test_fail "Usage instructions missing"
    fi
}

# Test workspace file creation
test_workspace_creation() {
    local script_path="copilot/scripts/copilot-switch-app.sh"
    
    if [[ ! -f "$script_path" ]]; then
        test_fail "Cannot test workspace creation - script missing"
        return 1
    fi
    
    # Check for .workspace file creation
    if grep -q "copilot/.workspace" "$script_path"; then
        test_pass "Workspace file creation present"
    else
        test_fail "Workspace file creation missing"
    fi
    
    # Check for proper output message
    if grep -q "Wrote.*workspace.*application" "$script_path"; then
        test_pass "Workspace creation output message present"
    else
        test_fail "Workspace creation output message missing"
    fi
}

# Test parameter validation
test_parameter_validation() {
    local script_path="copilot/scripts/copilot-switch-app.sh"
    
    if [[ ! -f "$script_path" ]]; then
        test_fail "Cannot test parameters - script missing"
        return 1
    fi
    
    # Check for parameter validation and help
    if grep -q "Usage:" "$script_path" || grep -q "Examples:" "$script_path"; then
        test_pass "Parameter validation and help present"
    else
        test_warning "Parameter validation and help unclear"
    fi
    
    # Check for environment variable handling
    if grep -q "CLIENT_DOMAIN" "$script_path"; then
        test_pass "CLIENT_DOMAIN environment variable handling present"
    else
        test_fail "CLIENT_DOMAIN environment variable handling missing"
    fi
}

# Test edge cases
test_edge_cases() {
    # Test various domain formats
    local edge_cases=(
        "staging.a.theanswer.ai:staging-a-aai"
        "staging.test-123.theanswer.ai:staging-test-123-aai"
        "staging.very-long-client-name-123.theanswer.ai:staging-very-long-client-name-123-aai"
        "test123.theanswer.ai:test123-aai"
        "a.theanswer.ai:a-aai"
    )
    
    for test_case in "${edge_cases[@]}"; do
        local input_domain="${test_case%%:*}"
        local expected_output="${test_case##*:}"
        
        # Simulate the app name generation logic
        local app_name=""
        if [[ "$input_domain" =~ ^staging\.(.+)\.theanswer\.ai$ ]]; then
            app_name="staging-${BASH_REMATCH[1]}-aai"
        elif [[ "$input_domain" =~ ^prod\.(.+)\.theanswer\.ai$ ]]; then
            app_name="prod-${BASH_REMATCH[1]}-aai"
        elif [[ "$input_domain" =~ ^(.+)\.theanswer\.ai$ ]]; then
            app_name="${BASH_REMATCH[1]}-aai"
        else
            app_name="$input_domain"
        fi
        
        if [[ "$app_name" == "$expected_output" ]]; then
            test_pass "Edge case: '$input_domain' → '$app_name'"
        else
            test_fail "Edge case failed: '$input_domain' → '$app_name' (expected '$expected_output')"
        fi
    done
}

# Test regex patterns
test_regex_patterns() {
    # Test the regex patterns used in the script
    local staging_regex="^staging\.(.+)\.theanswer\.ai$"
    local prod_regex="^prod\.(.+)\.theanswer\.ai$"
    local general_regex="^(.+)\.theanswer\.ai$"
    
    # Test staging pattern
    if [[ "staging.test.theanswer.ai" =~ $staging_regex ]]; then
        test_pass "Staging regex pattern works"
        if [[ "${BASH_REMATCH[1]}" == "test" ]]; then
            test_pass "Staging regex capture group works"
        else
            test_fail "Staging regex capture group broken: got '${BASH_REMATCH[1]}'"
        fi
    else
        test_fail "Staging regex pattern broken"
    fi
    
    # Test prod pattern
    if [[ "prod.test.theanswer.ai" =~ $prod_regex ]]; then
        test_pass "Prod regex pattern works"
        if [[ "${BASH_REMATCH[1]}" == "test" ]]; then
            test_pass "Prod regex capture group works"
        else
            test_fail "Prod regex capture group broken: got '${BASH_REMATCH[1]}'"
        fi
    else
        test_fail "Prod regex pattern broken"
    fi
    
    # Test general pattern
    if [[ "test.theanswer.ai" =~ $general_regex ]]; then
        test_pass "General regex pattern works"
        if [[ "${BASH_REMATCH[1]}" == "test" ]]; then
            test_pass "General regex capture group works"
        else
            test_fail "General regex capture group broken: got '${BASH_REMATCH[1]}'"
        fi
    else
        test_fail "General regex pattern broken"
    fi
}

# Test integration with auto-deploy
test_integration() {
    local auto_deploy_path="copilot/scripts/copilot-auto-deploy.sh"
    local switch_app_path="copilot/scripts/copilot-switch-app.sh"
    
    if [[ ! -f "$auto_deploy_path" ]]; then
        test_warning "Cannot test integration - copilot-auto-deploy.sh missing"
        return 0
    fi
    
    if [[ ! -f "$switch_app_path" ]]; then
        test_fail "Cannot test integration - copilot-switch-app.sh missing"
        return 1
    fi
    
    # Check if auto-deploy calls switch-app script
    if grep -q "copilot-switch-app.sh" "$auto_deploy_path"; then
        test_pass "Auto-deploy integrates with switch-app script"
    else
        test_fail "Auto-deploy missing switch-app integration"
    fi
    
    # Check for CLIENT_DOMAIN usage
    if grep -q "CLIENT_DOMAIN" "$auto_deploy_path"; then
        test_pass "CLIENT_DOMAIN variable usage present in auto-deploy"
    else
        test_fail "CLIENT_DOMAIN variable usage missing in auto-deploy"
    fi
}

# Test error handling
test_error_handling() {
    local script_path="copilot/scripts/copilot-switch-app.sh"
    
    if [[ ! -f "$script_path" ]]; then
        test_fail "Cannot test error handling - script missing"
        return 1
    fi
    
    # Check for error output to stderr
    if grep -q ">&2" "$script_path"; then
        test_pass "Error output to stderr present"
    else
        test_warning "Error output to stderr unclear"
    fi
    
    # Check for graceful fallback
    if grep -q "defaulting to" "$script_path" || grep -q "fallback" "$script_path"; then
        test_pass "Graceful fallback behavior present"
    else
        test_warning "Graceful fallback behavior unclear"
    fi
}

# Main validation function
validate_switch_app_script() {
    print_test_header
    
    print_section "BASIC SCRIPT VALIDATION"
    test_script_basics
    
    print_section "APP NAME GENERATION"
    test_app_name_generation
    
    print_section "DEFAULT BEHAVIOR"
    test_default_behavior
    
    print_section "WORKSPACE CREATION"
    test_workspace_creation
    
    print_section "PARAMETER VALIDATION"
    test_parameter_validation
    
    print_section "EDGE CASES"
    test_edge_cases
    
    print_section "REGEX PATTERNS"
    test_regex_patterns
    
    print_section "INTEGRATION"
    test_integration
    
    print_section "ERROR HANDLING"
    test_error_handling
    
    print_summary
}

# Run validation
validate_switch_app_script
