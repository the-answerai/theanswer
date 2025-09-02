# Copilot Scripts Test Suite

Comprehensive validation tests for all copilot deployment scripts to ensure production readiness.

## Quick Start

Run all tests at once:

```bash
bash copilot/scripts/tests/run-all-tests.sh
```

## Individual Test Scripts

### 🛡️ Manifest Validation

```bash
bash copilot/scripts/tests/test-manifest-validation.sh
```

**Tests:** Bulletproof validation of Copilot service manifests, auto-scaling configuration, environment variables, CloudFormation generation, and addon validation. Ensures deployment configurations are production-ready.

### 🔧 Core Auto-Deploy Script

```bash
bash copilot/scripts/tests/test-copilot-auto-deploy.sh
```

**Tests:** Main deployment script functionality, phases, validation, domain logic, service selection, and edge cases.

### 🌐 Route53 Zone Manager

```bash
bash copilot/scripts/tests/test-route53-zone-manager.sh
```

**Tests:** DNS zone management, TLD accessibility, NS record formatting, manual configuration handling, and all deployment scenarios.

### 🔄 Copilot Switch App

```bash
bash copilot/scripts/tests/test-copilot-switch-app.sh
```

**Tests:** Application name generation, workspace management, default behavior, and domain parsing logic.

### ⚙️ Environment File Creator

```bash
bash copilot/scripts/tests/test-create-env-files.sh
```

**Tests:** Environment file creation, secret generation, template handling, interactive prompts, and validation.

## Test Coverage

Each test script validates:

-   ✅ **Script Existence & Syntax** - File validation, executable permissions, bash syntax
-   ✅ **Required Functions** - All necessary helper functions present
-   ✅ **Parameter Validation** - Input validation and error handling
-   ✅ **Core Logic** - Business logic correctness and edge cases
-   ✅ **Integration Points** - Script interactions and dependencies
-   ✅ **Error Handling** - Graceful error recovery and user messaging
-   ✅ **Security Checks** - Safe coding practices and input sanitization

## Test Results

Each test provides detailed output including:

-   ✅ Passed tests with descriptions
-   ❌ Failed tests with specific issues
-   ⚠️ Warnings for potential improvements
-   📊 Summary with pass/fail counts and percentages

## Prerequisites

-   **Bash 4.0+** - Required for all test scripts
-   **Node.js** - Required for JavaScript script testing
-   **jq** - Optional but recommended for enhanced JSON testing

## Test Architecture

### Master Test Runner (`run-all-tests.sh`)

-   Orchestrates all individual test scripts
-   Provides comprehensive reporting
-   Calculates overall pass rates
-   Handles prerequisites checking

### Individual Test Scripts

-   Focus on specific script functionality
-   Provide detailed validation results
-   Include edge case testing
-   Validate integration points

## Adding New Tests

When adding new copilot scripts:

1. **Create test script** following the naming pattern: `test-{script-name}.sh`
2. **Use the template structure** from existing test scripts
3. **Add to master runner** in the `test_suites` array
4. **Update this README** with the new test description

### Test Script Template Structure

```bash
#!/usr/bin/env bash

# Test script for new-script.sh
# Color constants and helper functions
# Test tracking variables
# Individual test functions
# Main validation function
# Run validation
```

## Continuous Integration

These tests are designed to be run in CI/CD pipelines to ensure:

-   All scripts are syntactically correct
-   Core functionality works as expected
-   Integration points are properly tested
-   Security best practices are followed

## Troubleshooting

### Common Issues

**Permission Errors:**

```bash
chmod +x copilot/scripts/*.sh
chmod +x copilot/scripts/tests/*.sh
```

**Missing Dependencies:**

```bash
# Install jq (optional but recommended)
brew install jq  # macOS
apt-get install jq  # Ubuntu/Debian
```

**Test Failures:**

-   Review the specific test output for detailed error messages
-   Check that all prerequisite tools are installed
-   Ensure you're running from the project root directory

### Debug Mode

Run individual tests to see detailed output:

```bash
bash -x copilot/scripts/tests/test-route53-zone-manager.sh
```

## Contributing

When modifying copilot scripts:

1. **Run tests before committing** to ensure no regressions
2. **Update tests** if you change script behavior
3. **Add new tests** for new functionality
4. **Maintain test quality** - tests should be comprehensive and clear

## Test Philosophy

These tests follow the principle of **comprehensive validation**:

-   **Syntax validation** ensures scripts can execute
-   **Logic validation** ensures scripts work correctly
-   **Integration validation** ensures scripts work together
-   **Edge case validation** ensures robust error handling
-   **Security validation** ensures safe deployment practices

The goal is to catch issues before deployment and ensure all copilot scripts are production-ready.
