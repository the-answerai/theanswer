#!/bin/bash

# Help Center Article FAQ Extraction Script
# This script extracts FAQs from IAS help center articles and stores them in the database

# Default environment file
ENV_FILE='.env.local'

# Parse command line arguments
BATCH_SIZE=10
OFFSET=0
LIMIT=""
TEST_MODE=""
ID=""
OUTPUT="./ias_faqs.json"

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --env=*) ENV_FILE="${1#*=}" ;;
        --env) ENV_FILE="$2"; shift ;;
        --batch-size=*) BATCH_SIZE="${1#*=}" ;;
        --batch-size) BATCH_SIZE="$2"; shift ;;
        --offset=*) OFFSET="${1#*=}" ;;
        --offset) OFFSET="$2"; shift ;;
        --limit=*) LIMIT="--limit=${1#*=}" ;;
        --limit) LIMIT="--limit=$2"; shift ;;
        --test-mode) TEST_MODE="--test-mode" ;;
        --id=*) ID="--id=${1#*=}" ;;
        --id) ID="--id=$2"; shift ;;
        --output=*) OUTPUT="${1#*=}" ;;
        --output) OUTPUT="$2"; shift ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
    shift
done

# Display script header
echo "Starting IAS help center article FAQ extraction..."
echo "Using environment file: $ENV_FILE"

# Run the script with the specified parameters
ENV_FILE=$ENV_FILE node scripts/imports/ias/analyze_help_center.js \
    --batch-size="$BATCH_SIZE" \
    --offset="$OFFSET" \
    --output="$OUTPUT" \
    $LIMIT $TEST_MODE $ID 