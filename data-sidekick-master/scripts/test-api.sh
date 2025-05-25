#!/bin/bash

# Test script for the text processor API
# This script sends a POST request to create a document with text content

# Default values
SOURCE_ID=${1:-""}
SERVER_URL=${2:-"http://localhost:3001"}
SKIP_ANALYSIS=${3:-"true"}

if [ -z "$SOURCE_ID" ]; then
    echo "Error: Source ID is required"
    echo "Usage: $0 <source_id> [server_url] [skip_analysis]"
    exit 1
fi

# Sample transcript text
TEXT="This is a test transcript for document creation.
It simulates a conversation that would normally be processed through AnswerAI.
We're testing the document creation functionality with the text processor API.
The document should be stored properly with this content."

# Create JSON payload
JSON_PAYLOAD=$(cat << EOF
{
    "sourceId": "$SOURCE_ID",
    "text": "$TEXT",
    "title": "API Test Transcript",
    "format": "plain",
    "fileType": "transcript",
    "skipAnalysis": $SKIP_ANALYSIS
}
EOF
)

# Make the API request
echo "Sending request to $SERVER_URL/api/text-processor/store-document"
curl -X POST \
    -H "Content-Type: application/json" \
    -d "$JSON_PAYLOAD" \
    "$SERVER_URL/api/text-processor/store-document" | json_pp

echo -e "\nTest completed." 