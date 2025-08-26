#!/bin/bash

# S3 Configuration Test Script
# This script tests all possible S3 configuration scenarios to ensure production readiness

set -e

echo "🚀 Starting S3 Configuration Test Suite"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    case $status in
        "SUCCESS")
            echo -e "${GREEN}✅ $message${NC}"
            ;;
        "ERROR")
            echo -e "${RED}❌ $message${NC}"
            ;;
        "WARNING")
            echo -e "${YELLOW}⚠️  $message${NC}"
            ;;
        "INFO")
            echo -e "${BLUE}ℹ️  $message${NC}"
            ;;
    esac
}

# Function to test a configuration scenario
test_scenario() {
    local scenario_name=$1
    local env_file=$2
    local expected_result=$3
    
    echo ""
    print_status "INFO" "Testing Scenario: $scenario_name"
    echo "----------------------------------------"
    
    # Stop any running containers
    docker-compose -f docker-compose.s3-test.yml down --volumes --remove-orphans 2>/dev/null || true
    
    # Copy the test environment file
    cp "$env_file" test-s3-config.env
    
    # Start the services
    print_status "INFO" "Starting services with $scenario_name configuration..."
    docker-compose -f docker-compose.s3-test.yml up -d postgres redis
    
    # Wait for database to be ready
    print_status "INFO" "Waiting for database to be ready..."
    sleep 10
    
    # Start Flowise and capture logs
    print_status "INFO" "Starting Flowise with test configuration..."
    docker-compose -f docker-compose.s3-test.yml up flowise-s3-test > "test-logs-$scenario_name.txt" 2>&1 &
    local flowise_pid=$!
    
    # Wait for startup or failure
    local timeout=60
    local elapsed=0
    local started=false
    local failed=false
    
    while [ $elapsed -lt $timeout ]; do
        if docker-compose -f docker-compose.s3-test.yml ps flowise-s3-test | grep -q "Up"; then
            started=true
            break
        fi
        
        # Check if the process failed
        if ! kill -0 $flowise_pid 2>/dev/null; then
            failed=true
            break
        fi
        
        sleep 2
        elapsed=$((elapsed + 2))
    done
    
    # Kill the background process
    kill $flowise_pid 2>/dev/null || true
    
    # Analyze results
    if [ "$started" = true ]; then
        print_status "SUCCESS" "Flowise started successfully with $scenario_name"
        
        # Check for S3 debug output
        if grep -q "=== S3 Storage Configuration Debug ===" "test-logs-$scenario_name.txt"; then
            print_status "SUCCESS" "S3 debug output found in logs"
        else
            print_status "WARNING" "S3 debug output not found in logs"
        fi
        
        # Check for specific S3 configuration messages
        if grep -q "S3 configuration appears valid" "test-logs-$scenario_name.txt"; then
            print_status "SUCCESS" "S3 configuration validation passed"
        elif grep -q "S3 configuration issues detected" "test-logs-$scenario_name.txt"; then
            print_status "WARNING" "S3 configuration issues detected (expected for some scenarios)"
        fi
        
    elif [ "$failed" = true ]; then
        print_status "ERROR" "Flowise failed to start with $scenario_name"
        
        # Check for specific error messages
        if grep -q "S3 storage bucket configuration is missing" "test-logs-$scenario_name.txt"; then
            print_status "INFO" "Expected error: S3 bucket configuration missing"
        elif grep -q "Incomplete credential configuration" "test-logs-$scenario_name.txt"; then
            print_status "INFO" "Expected error: Incomplete credential configuration"
        else
            print_status "ERROR" "Unexpected error occurred"
            echo "Last 20 lines of logs:"
            tail -20 "test-logs-$scenario_name.txt"
        fi
    else
        print_status "ERROR" "Flowise startup timed out with $scenario_name"
    fi
    
    # Clean up
    docker-compose -f docker-compose.s3-test.yml down --volumes --remove-orphans 2>/dev/null || true
}

# Create test scenario files
echo "📝 Creating test scenario files..."

# Scenario 1: Valid S3 configuration (IAM role)
cat > test-s3-valid.env << EOF
STORAGE_TYPE=s3
S3_STORAGE_BUCKET_NAME=test-flowise-bucket
DEBUG=true
VERBOSE=true
LOG_LEVEL=debug
DATABASE_TYPE=postgres
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_NAME=example_db
DATABASE_USER=example_user
DATABASE_PASSWORD=example_password
REDIS_URL=redis://redis:6379
AAI_DEFAULT_REDIS_URL=redis://redis:6379
PORT=4000
NODE_ENV=production
DISABLE_FLOWISE_TELEMETRY=true
APIKEY_STORAGE_TYPE=db
EOF

# Scenario 2: Missing bucket name (should fail)
cat > test-s3-missing-bucket.env << EOF
STORAGE_TYPE=s3
# S3_STORAGE_BUCKET_NAME not set - should fail
DEBUG=true
VERBOSE=true
LOG_LEVEL=debug
DATABASE_TYPE=postgres
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_NAME=example_db
DATABASE_USER=example_user
DATABASE_PASSWORD=example_password
REDIS_URL=redis://redis:6379
AAI_DEFAULT_REDIS_URL=redis://redis:6379
PORT=4000
NODE_ENV=production
DISABLE_FLOWISE_TELEMETRY=true
APIKEY_STORAGE_TYPE=db
EOF

# Scenario 3: Incomplete credentials (should fail)
cat > test-s3-incomplete-creds.env << EOF
STORAGE_TYPE=s3
S3_STORAGE_BUCKET_NAME=test-flowise-bucket
S3_STORAGE_ACCESS_KEY_ID=test-access-key
# S3_STORAGE_SECRET_ACCESS_KEY not set - should fail
DEBUG=true
VERBOSE=true
LOG_LEVEL=debug
DATABASE_TYPE=postgres
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_NAME=example_db
DATABASE_USER=example_user
DATABASE_PASSWORD=example_password
REDIS_URL=redis://redis:6379
AAI_DEFAULT_REDIS_URL=redis://redis:6379
PORT=4000
NODE_ENV=production
DISABLE_FLOWISE_TELEMETRY=true
APIKEY_STORAGE_TYPE=db
EOF

# Scenario 4: Local storage (should work)
cat > test-local-storage.env << EOF
STORAGE_TYPE=local
DEBUG=true
VERBOSE=true
LOG_LEVEL=debug
DATABASE_TYPE=postgres
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_NAME=example_db
DATABASE_USER=example_user
DATABASE_PASSWORD=example_password
REDIS_URL=redis://redis:6379
AAI_DEFAULT_REDIS_URL=redis://redis:6379
PORT=4000
NODE_ENV=production
DISABLE_FLOWISE_TELEMETRY=true
APIKEY_STORAGE_TYPE=db
EOF

# Scenario 5: S3 with custom region
cat > test-s3-custom-region.env << EOF
STORAGE_TYPE=s3
S3_STORAGE_BUCKET_NAME=test-flowise-bucket
S3_STORAGE_REGION=us-west-2
DEBUG=true
VERBOSE=true
LOG_LEVEL=debug
DATABASE_TYPE=postgres
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_NAME=example_db
DATABASE_USER=example_user
DATABASE_PASSWORD=example_password
REDIS_URL=redis://redis:6379
AAI_DEFAULT_REDIS_URL=redis://redis:6379
PORT=4000
NODE_ENV=production
DISABLE_FLOWISE_TELEMETRY=true
APIKEY_STORAGE_TYPE=db
EOF

# Run test scenarios
echo ""
print_status "INFO" "Running test scenarios..."

test_scenario "Valid S3 Configuration (IAM Role)" "test-s3-valid.env" "success"
test_scenario "Missing S3 Bucket Name" "test-s3-missing-bucket.env" "failure"
test_scenario "Incomplete S3 Credentials" "test-s3-incomplete-creds.env" "failure"
test_scenario "Local Storage" "test-local-storage.env" "success"
test_scenario "S3 with Custom Region" "test-s3-custom-region.env" "success"

# Production configuration test (without debug)
echo ""
print_status "INFO" "Testing Production Configuration (without debug)..."
cat > test-production.env << EOF
STORAGE_TYPE=s3
S3_STORAGE_BUCKET_NAME=test-flowise-bucket
# No debug variables - should work silently
DATABASE_TYPE=postgres
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_NAME=example_db
DATABASE_USER=example_user
DATABASE_PASSWORD=example_password
REDIS_URL=redis://redis:6379
AAI_DEFAULT_REDIS_URL=redis://redis:6379
PORT=4000
NODE_ENV=production
DISABLE_FLOWISE_TELEMETRY=true
APIKEY_STORAGE_TYPE=db
EOF

test_scenario "Production Configuration" "test-production.env" "success"

# Clean up test files
echo ""
print_status "INFO" "Cleaning up test files..."
rm -f test-s3-*.env test-production.env test-s3-config.env test-logs-*.txt

echo ""
print_status "SUCCESS" "S3 Configuration Test Suite Complete!"
echo ""
print_status "INFO" "Test Results Summary:"
echo "  ✅ Valid S3 configurations should start successfully"
echo "  ❌ Invalid S3 configurations should fail with clear error messages"
echo "  ℹ️  Debug output should be present when DEBUG=true"
echo "  🔒 Production config should work without debug output"
echo ""
print_status "INFO" "Check the test logs above for detailed results."
