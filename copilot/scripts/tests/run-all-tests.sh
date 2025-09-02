#!/usr/bin/env bash

# Master test runner for all copilot scripts
# Runs all individual test scripts and provides comprehensive reporting

set -euo pipefail

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
TOTAL_TEST_SUITES=0
PASSED_TEST_SUITES=0
FAILED_TEST_SUITES=0
OVERALL_TESTS_PASSED=0
OVERALL_TESTS_FAILED=0
OVERALL_TESTS_TOTAL=0

# Helper functions
print_master_header() {
    echo -e "\n${TEST_PURPLE}${TEST_BOLD}╔═══════════════════════════════════════════════════════════════╗${TEST_NC}"
    echo -e "${TEST_PURPLE}${TEST_BOLD}║${TEST_NC} ${TEST_WHITE}${TEST_BOLD}COPILOT SCRIPTS MASTER TEST SUITE${TEST_NC} ${TEST_PURPLE}${TEST_BOLD}║${TEST_NC}"
    echo -e "${TEST_PURPLE}${TEST_BOLD}╚═══════════════════════════════════════════════════════════════╝${TEST_NC}\n"
    echo -e "${TEST_CYAN}Running comprehensive validation of all copilot deployment scripts${TEST_NC}\n"
}

print_suite_header() {
    local suite_name="$1"
    echo -e "\n${TEST_CYAN}${TEST_BOLD}▶ RUNNING TEST SUITE: $suite_name${TEST_NC}"
    echo -e "${TEST_CYAN}${TEST_BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${TEST_NC}"
}

print_suite_result() {
    local suite_name="$1"
    local result="$2"
    local details="$3"
    
    if [[ "$result" == "PASS" ]]; then
        echo -e "${TEST_GREEN}${TEST_BOLD}✅ $suite_name: PASSED${TEST_NC} $details"
        ((PASSED_TEST_SUITES++))
    else
        echo -e "${TEST_RED}${TEST_BOLD}❌ $suite_name: FAILED${TEST_NC} $details"
        ((FAILED_TEST_SUITES++))
    fi
    ((TOTAL_TEST_SUITES++))
}

print_master_summary() {
    echo -e "\n${TEST_PURPLE}${TEST_BOLD}╔═══════════════════════════════════════════════════════════════╗${TEST_NC}"
    echo -e "${TEST_PURPLE}${TEST_BOLD}║${TEST_NC} ${TEST_WHITE}${TEST_BOLD}MASTER TEST SUITE SUMMARY${TEST_NC} ${TEST_PURPLE}${TEST_BOLD}║${TEST_NC}"
    echo -e "${TEST_PURPLE}${TEST_BOLD}╚═══════════════════════════════════════════════════════════════╝${TEST_NC}"
    
    echo -e "\n${TEST_WHITE}${TEST_BOLD}Test Suite Results:${TEST_NC}"
    echo -e "  ${TEST_WHITE}Total Test Suites:${TEST_NC} $TOTAL_TEST_SUITES"
    echo -e "  ${TEST_GREEN}Passed Suites:${TEST_NC} $PASSED_TEST_SUITES"
    echo -e "  ${TEST_RED}Failed Suites:${TEST_NC} $FAILED_TEST_SUITES"
    
    echo -e "\n${TEST_WHITE}${TEST_BOLD}Overall Test Results:${TEST_NC}"
    echo -e "  ${TEST_WHITE}Total Tests:${TEST_NC} $OVERALL_TESTS_TOTAL"
    echo -e "  ${TEST_GREEN}Passed Tests:${TEST_NC} $OVERALL_TESTS_PASSED"
    echo -e "  ${TEST_RED}Failed Tests:${TEST_NC} $OVERALL_TESTS_FAILED"
    
    # Calculate percentages
    if [[ $TOTAL_TEST_SUITES -gt 0 ]]; then
        local suite_pass_rate=$((PASSED_TEST_SUITES * 100 / TOTAL_TEST_SUITES))
        echo -e "  ${TEST_CYAN}Suite Pass Rate:${TEST_NC} ${suite_pass_rate}%"
    fi
    
    if [[ $OVERALL_TESTS_TOTAL -gt 0 ]]; then
        local test_pass_rate=$((OVERALL_TESTS_PASSED * 100 / OVERALL_TESTS_TOTAL))
        echo -e "  ${TEST_CYAN}Test Pass Rate:${TEST_NC} ${test_pass_rate}%"
    fi
    
    echo ""
    
    if [[ $FAILED_TEST_SUITES -eq 0 ]]; then
        echo -e "${TEST_GREEN}${TEST_BOLD}🎉 ALL TEST SUITES PASSED! 🎉${TEST_NC}"
        echo -e "${TEST_GREEN}All copilot scripts are production-ready and fully validated.${TEST_NC}"
        echo ""
        exit 0
    else
        echo -e "${TEST_RED}${TEST_BOLD}❌ SOME TEST SUITES FAILED ❌${TEST_NC}"
        echo -e "${TEST_RED}Review the failed test suites above and fix issues before deployment.${TEST_NC}"
        echo ""
        exit 1
    fi
}

# Run individual test suite
run_test_suite() {
    local test_script="$1"
    local suite_name="$2"
    
    print_suite_header "$suite_name"
    
    if [[ ! -f "$test_script" ]]; then
        print_suite_result "$suite_name" "FAIL" "(test script missing: $test_script)"
        return 1
    fi
    
    if [[ ! -x "$test_script" ]]; then
        chmod +x "$test_script" 2>/dev/null || {
            print_suite_result "$suite_name" "FAIL" "(test script not executable: $test_script)"
            return 1
        }
    fi
    
    # Capture test output and parse results
    local output
    local exit_code
    
    set +e
    output=$(bash "$test_script" 2>&1)
    exit_code=$?
    set -e
    
    # Parse test results from output
    local tests_passed=0
    local tests_failed=0
    local tests_total=0
    
    if echo "$output" | grep -q "Passed:"; then
        tests_passed=$(echo "$output" | grep "Passed:" | tail -1 | awk '{print $NF}')
        tests_passed=${tests_passed:-0}
    fi
    
    if echo "$output" | grep -q "Failed:"; then
        tests_failed=$(echo "$output" | grep "Failed:" | tail -1 | awk '{print $NF}')
        tests_failed=${tests_failed:-0}
    fi
    
    if echo "$output" | grep -q "Total Tests:"; then
        tests_total=$(echo "$output" | grep "Total Tests:" | tail -1 | awk '{print $NF}')
        tests_total=${tests_total:-0}
    fi
    
    # Ensure we have valid numbers
    tests_passed=${tests_passed:-0}
    tests_failed=${tests_failed:-0}
    tests_total=${tests_total:-0}
    
    # Update overall counters
    OVERALL_TESTS_PASSED=$((OVERALL_TESTS_PASSED + tests_passed))
    OVERALL_TESTS_FAILED=$((OVERALL_TESTS_FAILED + tests_failed))
    OVERALL_TESTS_TOTAL=$((OVERALL_TESTS_TOTAL + tests_total))
    
    # Determine result
    if [[ $exit_code -eq 0 ]]; then
        print_suite_result "$suite_name" "PASS" "($tests_passed/$tests_total tests passed)"
    else
        print_suite_result "$suite_name" "FAIL" "($tests_failed/$tests_total tests failed)"
        
        # Show last few lines of output for debugging
        echo -e "${TEST_YELLOW}Last few lines of output:${TEST_NC}"
        echo "$output" | tail -10 | sed 's/^/  /'
        echo ""
    fi
}

# Check prerequisites
check_prerequisites() {
    echo -e "${TEST_CYAN}Checking prerequisites...${TEST_NC}"
    
    # Check if we're in the right directory
    if [[ ! -d "copilot/scripts" ]]; then
        echo -e "${TEST_RED}❌ Must be run from project root (copilot/scripts directory not found)${TEST_NC}"
        exit 1
    fi
    
    # Check if test directory exists
    if [[ ! -d "copilot/scripts/tests" ]]; then
        echo -e "${TEST_RED}❌ Test directory not found: copilot/scripts/tests${TEST_NC}"
        exit 1
    fi
    
    # Check for required tools
    local missing_tools=()
    
    if ! command -v bash >/dev/null 2>&1; then
        missing_tools+=("bash")
    fi
    
    if ! command -v node >/dev/null 2>&1; then
        echo -e "${TEST_YELLOW}⚠️  Node.js not found - some tests may be skipped${TEST_NC}"
    fi
    
    if ! command -v jq >/dev/null 2>&1; then
        echo -e "${TEST_YELLOW}⚠️  jq not found - some tests may be limited${TEST_NC}"
    fi
    
    if [[ ${#missing_tools[@]} -gt 0 ]]; then
        echo -e "${TEST_RED}❌ Missing required tools: ${missing_tools[*]}${TEST_NC}"
        exit 1
    fi
    
    echo -e "${TEST_GREEN}✅ Prerequisites check passed${TEST_NC}\n"
}

# Main test execution
main() {
    print_master_header
    
    check_prerequisites
    
    # Define test suites to run
    local test_suites=(
        "copilot/scripts/tests/test-manifest-validation.sh:Manifest Validation"
        "copilot/scripts/tests/test-copilot-auto-deploy.sh:Copilot Auto Deploy"
        "copilot/scripts/tests/test-route53-zone-manager.sh:Route53 Zone Manager"
        "copilot/scripts/tests/test-copilot-switch-app.sh:Copilot Switch App"
        "copilot/scripts/tests/test-create-env-files.sh:Create Env Files"
    )
    
    echo -e "${TEST_WHITE}${TEST_BOLD}Running ${#test_suites[@]} test suites...${TEST_NC}\n"
    
    # Run each test suite
    for suite_info in "${test_suites[@]}"; do
        local test_script="${suite_info%%:*}"
        local suite_name="${suite_info##*:}"
        
        run_test_suite "$test_script" "$suite_name"
    done
    
    print_master_summary
}

# Handle script interruption
cleanup() {
    echo -e "\n${TEST_YELLOW}Test execution interrupted${TEST_NC}"
    exit 130
}

trap cleanup INT TERM

# Run main function
main "$@"
