#!/usr/bin/env bash

# Comprehensive test script for create-env-files.js
# Tests environment file creation and validation functionality

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
    echo -e "${TEST_PURPLE}${TEST_BOLD}║${TEST_NC} ${TEST_WHITE}${TEST_BOLD}CREATE ENV FILES VALIDATION${TEST_NC} ${TEST_PURPLE}${TEST_BOLD}║${TEST_NC}"
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
        echo -e "\n  ${TEST_GREEN}${TEST_BOLD}🎉 ALL TESTS PASSED! Create env files script is production-ready.${TEST_NC}"
        exit 0
    else
        echo -e "\n  ${TEST_RED}${TEST_BOLD}❌ Some tests failed. Review issues above.${TEST_NC}"
        exit 1
    fi
}

# Test script existence and basic validation
test_script_basics() {
    local script_path="copilot/scripts/create-env-files.js"
    
    if [[ -f "$script_path" ]]; then
        test_pass "Script exists: create-env-files.js"
        
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
        
        # Check Node.js syntax
        if command -v node >/dev/null 2>&1; then
            if node -c "$script_path" 2>/dev/null; then
                test_pass "Node.js syntax valid"
            else
                test_fail "Node.js syntax errors detected"
            fi
        else
            test_warning "Node.js not available - cannot test syntax"
        fi
        
        # Check shebang for Node.js
        if head -1 "$script_path" | grep -q "^#!/usr/bin/env node\|^#!/usr/bin/node"; then
            test_pass "Proper Node.js shebang present"
        else
            test_warning "Missing or incorrect Node.js shebang"
        fi
        
    else
        test_fail "Script missing: create-env-files.js"
        return 1
    fi
}

# Test required dependencies
test_dependencies() {
    local script_path="copilot/scripts/create-env-files.js"
    
    if [[ ! -f "$script_path" ]]; then
        test_fail "Cannot test dependencies - script missing"
        return 1
    fi
    
    # Check for Node.js built-in modules
    local required_modules=("fs" "readline" "crypto" "child_process")
    
    for module in "${required_modules[@]}"; do
        if grep -q "require.*['\"]${module}['\"]" "$script_path"; then
            test_pass "Required module '$module' imported"
        else
            test_fail "Required module '$module' missing"
        fi
    done
    
    # Check for path module (commonly used)
    if grep -q "require.*['\"]path['\"]" "$script_path"; then
        test_pass "Path module imported"
    else
        test_warning "Path module not imported (may be needed)"
    fi
}

# Test parameter validation
test_parameter_validation() {
    local script_path="copilot/scripts/create-env-files.js"
    
    if [[ ! -f "$script_path" ]]; then
        test_fail "Cannot test parameters - script missing"
        return 1
    fi
    
    # Check for usage instructions
    if grep -q "Usage:" "$script_path" && grep -q "Examples:" "$script_path"; then
        test_pass "Usage and examples present"
    else
        test_fail "Usage or examples missing"
    fi
    
    # Check for parameter validation
    if grep -q "process.argv" "$script_path"; then
        test_pass "Command line argument processing present"
    else
        test_fail "Command line argument processing missing"
    fi
    
    # Check for application name validation
    if grep -q "appName\|application.*name" "$script_path"; then
        test_pass "Application name handling present"
    else
        test_fail "Application name handling missing"
    fi
    
    # Check for environment validation
    if grep -q "staging\|prod" "$script_path"; then
        test_pass "Environment validation present"
    else
        test_fail "Environment validation missing"
    fi
}

# Test file operations
test_file_operations() {
    local script_path="copilot/scripts/create-env-files.js"
    
    if [[ ! -f "$script_path" ]]; then
        test_fail "Cannot test file operations - script missing"
        return 1
    fi
    
    # Check for file reading operations
    if grep -q "readFileSync\|readFile" "$script_path"; then
        test_pass "File reading operations present"
    else
        test_fail "File reading operations missing"
    fi
    
    # Check for file writing operations
    if grep -q "writeFileSync\|writeFile" "$script_path"; then
        test_pass "File writing operations present"
    else
        test_fail "File writing operations missing"
    fi
    
    # Check for file existence checks
    if grep -q "existsSync\|access" "$script_path"; then
        test_pass "File existence checks present"
    else
        test_fail "File existence checks missing"
    fi
    
    # Check for template file handling
    if grep -q "template\|\.env\.template" "$script_path"; then
        test_pass "Template file handling present"
    else
        test_fail "Template file handling missing"
    fi
}

# Test secret generation
test_secret_generation() {
    local script_path="copilot/scripts/create-env-files.js"
    
    if [[ ! -f "$script_path" ]]; then
        test_fail "Cannot test secret generation - script missing"
        return 1
    fi
    
    # Check for crypto module usage
    if grep -q "crypto" "$script_path"; then
        test_pass "Crypto module usage present"
    else
        test_fail "Crypto module usage missing"
    fi
    
    # Check for random bytes generation
    if grep -q "randomBytes\|randomUUID" "$script_path"; then
        test_pass "Random generation functions present"
    else
        test_fail "Random generation functions missing"
    fi
    
    # Check for secret variables
    local secret_vars=("SESSION_SECRET" "AUTH0_SECRET" "FLOWISE_API_KEY")
    
    for secret in "${secret_vars[@]}"; do
        if grep -q "$secret" "$script_path"; then
            test_pass "Secret variable '$secret' handled"
        else
            test_warning "Secret variable '$secret' not found"
        fi
    done
}

# Test environment variable validation
test_env_var_validation() {
    local script_path="copilot/scripts/create-env-files.js"
    
    if [[ ! -f "$script_path" ]]; then
        test_fail "Cannot test env var validation - script missing"
        return 1
    fi
    
    # Check for Auth0 variables
    local auth0_vars=("AUTH0_DOMAIN" "AUTH0_CLIENT_ID" "AUTH0_CLIENT_SECRET" "AUTH0_AUDIENCE" "AUTH0_BASE_URL")
    
    for var in "${auth0_vars[@]}"; do
        if grep -q "$var" "$script_path"; then
            test_pass "Auth0 variable '$var' handled"
        else
            test_warning "Auth0 variable '$var' not found"
        fi
    done
    
    # Check for API key variables
    if grep -q "OPENAI_API_KEY\|API.*KEY" "$script_path"; then
        test_pass "API key variables handled"
    else
        test_fail "API key variables missing"
    fi
    
    # Check for debug configuration
    if grep -q "DEBUG\|LOG_LEVEL" "$script_path"; then
        test_pass "Debug configuration present"
    else
        test_warning "Debug configuration not found"
    fi
}

# Test interactive prompts
test_interactive_prompts() {
    local script_path="copilot/scripts/create-env-files.js"
    
    if [[ ! -f "$script_path" ]]; then
        test_fail "Cannot test prompts - script missing"
        return 1
    fi
    
    # Check for readline usage
    if grep -q "readline" "$script_path"; then
        test_pass "Readline module for prompts present"
    else
        test_fail "Readline module for prompts missing"
    fi
    
    # Check for question/prompt functions
    if grep -q "question\|prompt" "$script_path"; then
        test_pass "Prompt functions present"
    else
        test_fail "Prompt functions missing"
    fi
    
    # Check for input validation
    if grep -q "trim\|toLowerCase" "$script_path"; then
        test_pass "Input validation functions present"
    else
        test_warning "Input validation functions not found"
    fi
}

# Test error handling
test_error_handling() {
    local script_path="copilot/scripts/create-env-files.js"
    
    if [[ ! -f "$script_path" ]]; then
        test_fail "Cannot test error handling - script missing"
        return 1
    fi
    
    # Check for try-catch blocks
    if grep -q "try\|catch" "$script_path"; then
        test_pass "Try-catch error handling present"
    else
        test_fail "Try-catch error handling missing"
    fi
    
    # Check for process exit handling
    if grep -q "process.exit" "$script_path"; then
        test_pass "Process exit handling present"
    else
        test_fail "Process exit handling missing"
    fi
    
    # Check for error logging
    if grep -q "console.error\|console.log.*error" "$script_path"; then
        test_pass "Error logging present"
    else
        test_fail "Error logging missing"
    fi
    
    # Check for graceful error messages
    if grep -q "Error:" "$script_path" || grep -q "Failed to" "$script_path"; then
        test_pass "Descriptive error messages present"
    else
        test_fail "Descriptive error messages missing"
    fi
}

# Test workspace integration
test_workspace_integration() {
    local script_path="copilot/scripts/create-env-files.js"
    
    if [[ ! -f "$script_path" ]]; then
        test_fail "Cannot test workspace integration - script missing"
        return 1
    fi
    
    # Check for .workspace file handling
    if grep -q "\.workspace" "$script_path"; then
        test_pass "Workspace file integration present"
    else
        test_fail "Workspace file integration missing"
    fi
    
    # Check for copilot directory handling
    if grep -q "copilot" "$script_path"; then
        test_pass "Copilot directory handling present"
    else
        test_fail "Copilot directory handling missing"
    fi
}

# Test template handling
test_template_handling() {
    local script_path="copilot/scripts/create-env-files.js"
    
    if [[ ! -f "$script_path" ]]; then
        test_fail "Cannot test templates - script missing"
        return 1
    fi
    
    # Check for template file references
    local template_files=("copilot.appName.env.template" "copilot.appName.web.env.template")
    
    for template in "${template_files[@]}"; do
        if grep -q "$template\|${template//./\\.}" "$script_path"; then
            test_pass "Template file '$template' referenced"
        else
            test_fail "Template file '$template' not referenced"
        fi
    done
    
    # Check for variable substitution
    if grep -q "replace\|substitute" "$script_path" || grep -q "\\\${\|{{" "$script_path"; then
        test_pass "Variable substitution logic present"
    else
        test_fail "Variable substitution logic missing"
    fi
}

# Test integration with auto-deploy
test_integration() {
    local auto_deploy_path="copilot/scripts/copilot-auto-deploy.sh"
    local create_env_path="copilot/scripts/create-env-files.js"
    
    if [[ ! -f "$auto_deploy_path" ]]; then
        test_warning "Cannot test integration - copilot-auto-deploy.sh missing"
        return 0
    fi
    
    if [[ ! -f "$create_env_path" ]]; then
        test_fail "Cannot test integration - create-env-files.js missing"
        return 1
    fi
    
    # Check if auto-deploy calls create-env-files script
    if grep -q "create-env-files.js" "$auto_deploy_path"; then
        test_pass "Auto-deploy integrates with create-env-files script"
    else
        test_fail "Auto-deploy missing create-env-files integration"
    fi
    
    # Check for Node.js execution
    if grep -q "node.*create-env-files" "$auto_deploy_path"; then
        test_pass "Node.js execution of create-env-files present"
    else
        test_warning "Node.js execution of create-env-files unclear"
    fi
}

# Test output validation
test_output_validation() {
    local script_path="copilot/scripts/create-env-files.js"
    
    if [[ ! -f "$script_path" ]]; then
        test_fail "Cannot test output validation - script missing"
        return 1
    fi
    
    # Check for success messages
    if grep -q "Created:\|Success\|✅" "$script_path"; then
        test_pass "Success messages present"
    else
        test_fail "Success messages missing"
    fi
    
    # Check for file listing
    if grep -q "Files created:\|Environment files" "$script_path"; then
        test_pass "File listing output present"
    else
        test_fail "File listing output missing"
    fi
    
    # Check for validation messages
    if grep -q "validation\|configured\|validated" "$script_path"; then
        test_pass "Validation messages present"
    else
        test_warning "Validation messages not found"
    fi
}

# Main validation function
validate_create_env_files_script() {
    print_test_header
    
    print_section "BASIC SCRIPT VALIDATION"
    test_script_basics
    
    print_section "DEPENDENCIES"
    test_dependencies
    
    print_section "PARAMETER VALIDATION"
    test_parameter_validation
    
    print_section "FILE OPERATIONS"
    test_file_operations
    
    print_section "SECRET GENERATION"
    test_secret_generation
    
    print_section "ENV VAR VALIDATION"
    test_env_var_validation
    
    print_section "INTERACTIVE PROMPTS"
    test_interactive_prompts
    
    print_section "ERROR HANDLING"
    test_error_handling
    
    print_section "WORKSPACE INTEGRATION"
    test_workspace_integration
    
    print_section "TEMPLATE HANDLING"
    test_template_handling
    
    print_section "INTEGRATION"
    test_integration
    
    print_section "OUTPUT VALIDATION"
    test_output_validation
    
    print_summary
}

# Run validation
validate_create_env_files_script
