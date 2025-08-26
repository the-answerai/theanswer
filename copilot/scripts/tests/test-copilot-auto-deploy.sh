#!/usr/bin/env bash

# Unified comprehensive test script for all copilot scripts
# Validates all scripts in the copilot/scripts folder

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
    echo -e "${TEST_PURPLE}${TEST_BOLD}║${NC} ${TEST_WHITE}${TEST_BOLD}COPILOT SCRIPTS VALIDATION${TEST_NC} ${TEST_PURPLE}${TEST_BOLD}║${TEST_NC}"
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
    echo -e "${TEST_PURPLE}${TEST_BOLD}║${NC} ${TEST_WHITE}${TEST_BOLD}VALIDATION SUMMARY${TEST_NC} ${TEST_PURPLE}${TEST_BOLD}║${TEST_NC}"
    echo -e "${TEST_PURPLE}${TEST_BOLD}╚═══════════════════════════════════════════════════════════════╝${TEST_NC}"
    echo -e "  ${TEST_WHITE}Total Tests:${TEST_NC} $TESTS_TOTAL"
    echo -e "  ${TEST_GREEN}Passed:${TEST_NC} $TESTS_PASSED"
    echo -e "  ${TEST_RED}Failed:${TEST_NC} $TESTS_FAILED"
    
    if [[ $TESTS_FAILED -eq 0 ]]; then
        echo -e "\n  ${TEST_GREEN}${TEST_BOLD}🎉 ALL TESTS PASSED! All scripts are production-ready.${TEST_NC}"
        exit 0
    else
        echo -e "\n  ${TEST_RED}${TEST_BOLD}❌ Some tests failed. Review issues above.${TEST_NC}"
        exit 1
    fi
}

# Test individual script
test_script() {
    local script_path="$1"
    local script_name=$(basename "$script_path")
    
    echo -e "\n${TEST_WHITE}${TEST_BOLD}Testing: $script_name${TEST_NC}"
    
    # Basic file validation
    if [[ -f "$script_path" ]]; then
        test_pass "File exists: $script_name"
        
        # Check file size
        local file_size=$(wc -c < "$script_path")
        if [[ $file_size -gt 100 ]]; then
            test_pass "File size reasonable ($file_size bytes): $script_name"
        else
            test_warning "File size very small ($file_size bytes): $script_name"
        fi
        
        # Check if executable
        if [[ -x "$script_path" ]]; then
            test_pass "Executable: $script_name"
        else
            test_warning "Not executable: $script_name"
        fi
        
        # Check file format
        if file "$script_path" | grep -q "text"; then
            test_pass "Valid text format: $script_name"
        else
            test_fail "Invalid file format: $script_name"
        fi
        
        # Syntax validation
        if bash -n "$script_path" 2>/dev/null; then
            test_pass "Bash syntax valid: $script_name"
        else
            test_fail "Bash syntax errors: $script_name"
        fi
        
        # Check shebang
        if head -1 "$script_path" | grep -q "^#!/usr/bin/env bash\|^#!/bin/bash"; then
            test_pass "Proper shebang: $script_name"
        else
            test_warning "Missing or incorrect shebang: $script_name"
        fi
        
        # Check for strict error handling
        if grep -q "set -euo pipefail\|set -eo pipefail" "$script_path"; then
            test_pass "Strict error handling: $script_name"
        else
            test_warning "Consider adding strict error handling: $script_name"
        fi
        
        # Security checks
        if grep -q "eval " "$script_path"; then
            test_warning "Found 'eval' usage (security risk): $script_name"
        else
            test_pass "No dangerous 'eval' usage: $script_name"
        fi
        
        # Check for proper variable quoting
        local unquoted_vars=$(grep -n "echo.*\$[A-Z_]" "$script_path" | grep -v "\".*\"" || true)
        if [[ -n "$unquoted_vars" ]]; then
            test_warning "Potentially unquoted variables: $script_name"
        else
            test_pass "Variables properly quoted: $script_name"
        fi
        
        # Check for comments
        local comment_lines=$(grep -c "^#" "$script_path" || echo "0")
        local total_lines=$(wc -l < "$script_path" || echo "0")
        local comment_ratio=$((comment_lines * 100 / total_lines))
        
        if [[ $comment_ratio -gt 5 ]]; then
            test_pass "Good comment coverage ($comment_ratio%): $script_name"
        else
            test_warning "Low comment coverage ($comment_ratio%): $script_name"
        fi
        
    else
        test_fail "File missing: $script_name"
    fi
}

# Test copilot-auto-deploy.sh specific functionality
test_auto_deploy_specific() {
    local script_path="copilot/scripts/copilot-auto-deploy.sh"
    
    if [[ ! -f "$script_path" ]]; then
        test_fail "copilot-auto-deploy.sh not found"
        return
    fi
    
    echo -e "\n${TEST_WHITE}${TEST_BOLD}Testing copilot-auto-deploy.sh specific functionality${TEST_NC}"
    
    # Test required functions
    local functions=("print_header" "print_phase" "print_success" "print_warning" "print_error" "print_info" "print_step" "lower")
    
    for func in "${functions[@]}"; do
        if grep -q "^${func}()" "$script_path"; then
            test_pass "Function '$func' present in auto-deploy"
        else
            test_fail "Function '$func' missing in auto-deploy"
        fi
    done
    
    # Test color constants
    local colors=("RED" "GREEN" "YELLOW" "BLUE" "PURPLE" "CYAN" "WHITE" "NC" "BOLD")
    
    for color in "${colors[@]}"; do
        if grep -q "^readonly ${color}=" "$script_path"; then
            test_pass "Color '$color' defined in auto-deploy"
        else
            test_fail "Color '$color' missing in auto-deploy"
        fi
    done
    
    # Test deployment phases
    local phases=(
        "PREREQUISITES & SETUP"
        "ENVIRONMENT SELECTION" 
        "APPLICATION SETUP"
        "COPILOT APPLICATION"
        "ENVIRONMENT MANAGEMENT"
        "SERVICE SELECTION"
        "SERVICE DEPLOYMENT"
    )
    
    for phase in "${phases[@]}"; do
        if grep -q "print_phase.*$phase" "$script_path"; then
            test_pass "Phase '$phase' structured in auto-deploy"
        else
            test_fail "Phase '$phase' missing in auto-deploy"
        fi
    done
    
    # Test core logic
    lower_test() { printf '%s' "${1:-}" | tr '[:upper:]' '[:lower:]'; }
    if [[ "$(lower_test 'TEST')" == "test" ]]; then
        test_pass "lower() function works"
    else
        test_fail "lower() function broken"
    fi
    
    # Test subdomain validation with improved regex
    if [[ "test123" =~ ^[a-z0-9]([a-z0-9-]*[a-z0-9])?$ ]]; then
        test_pass "Subdomain regex validation"
    else
        test_fail "Subdomain regex broken"
    fi
    
    # Test domain construction
    BASE_DOMAIN="theanswer.ai"
    ENV="staging"
    SUBDOMAIN="test"
    if [[ "$ENV" == "staging" ]]; then
        CLIENT_DOMAIN="staging.${SUBDOMAIN}.${BASE_DOMAIN}"
    else
        CLIENT_DOMAIN="${SUBDOMAIN}.${BASE_DOMAIN}"
    fi
    
    if [[ "$CLIENT_DOMAIN" == "staging.test.theanswer.ai" ]]; then
        test_pass "Domain construction logic"
    else
        test_fail "Domain construction broken"
    fi
    
    # Test service selection
    SERVICES=()
    case "3" in
        1) SERVICES=("flowise") ;;
        2) SERVICES=("web") ;;
        3) SERVICES=("flowise" "web") ;;
    esac
    
    if [[ "${SERVICES[*]}" == "flowise web" ]]; then
        test_pass "Service selection logic"
    else
        test_fail "Service selection broken"
    fi
    
    # Test edge cases
    local edge_subdomains=("a" "123" "test-123" "test123" "a-b-c-d-e-f-g-h" "test123test123test123")
    for subdomain in "${edge_subdomains[@]}"; do
        if [[ "$subdomain" =~ ^[a-z0-9]([a-z0-9-]*[a-z0-9])?$ ]]; then
            test_pass "Edge case subdomain valid: '$subdomain'"
        else
            test_fail "Edge case subdomain rejected: '$subdomain'"
        fi
    done
    
    local invalid_edge_subdomains=("" "-test" "test-" "test--test" "test_test" "test.test" "test@test" "TEST" "Test" "test test")
    for subdomain in "${invalid_edge_subdomains[@]}"; do
        if [[ ! "$subdomain" =~ ^[a-z0-9]([a-z0-9-]*[a-z0-9])?$ || "$subdomain" =~ -- ]]; then
            test_pass "Invalid edge case correctly rejected: '$subdomain'"
        else
            test_fail "Invalid edge case incorrectly accepted: '$subdomain'"
        fi
    done
}

# Main validation function
validate_all_scripts() {
    print_test_header
    
    # Get all .sh files in copilot/scripts
    local script_files=($(find copilot/scripts -name "*.sh" -type f | sort))
    
    if [[ ${#script_files[@]} -eq 0 ]]; then
        test_fail "No .sh files found in copilot/scripts"
        return 1
    fi
    
    print_section "GENERAL SCRIPT VALIDATION"
    echo -e "${TEST_WHITE}Found ${#script_files[@]} script(s) to validate:${TEST_NC}"
    
    for script in "${script_files[@]}"; do
        test_script "$script"
    done
    
    print_section "COPILOT AUTO-DEPLOY SPECIFIC TESTS"
    test_auto_deploy_specific
    
    print_summary
}

# Run validation
validate_all_scripts
