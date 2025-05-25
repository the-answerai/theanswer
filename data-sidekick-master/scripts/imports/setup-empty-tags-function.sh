#!/bin/bash

# setup-empty-tags-function.sh - Helper script to create the get_empty_tags_array_entries function in Supabase
# Usage: ./setup-empty-tags-function.sh [local|prime|wow|rds]

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Check if at least 1 argument is provided
if [ $# -lt 1 ]; then
  echo "Usage: ./setup-empty-tags-function.sh [local|prime|wow|rds]"
  exit 1
fi

# Get the environment
ENV=$1

# Set the environment file based on the environment argument
case $ENV in
  local)
    ENV_FILE=".env.local"
    ;;
  prime)
    ENV_FILE=".env.prime"
    ;;
  wow)
    ENV_FILE=".env.wow"
    ;;
  rds)
    ENV_FILE=".env.rds"
    ;;
  *)
    echo "Invalid environment: $ENV. Must be one of: local, prime, wow, rds"
    exit 1
    ;;
esac

# Load environment variables
source "$SCRIPT_DIR/../../$ENV_FILE"

# Check if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in $ENV_FILE"
  exit 1
fi

# Create a temporary file with the SQL function
TMP_SQL_FILE=$(mktemp)
cat "$SCRIPT_DIR/create_empty_tags_function.sql" > "$TMP_SQL_FILE"

# Run the SQL function using curl to the Supabase REST API
echo "Creating get_empty_tags_array_entries function in $ENV environment..."
curl -X POST \
  "$SUPABASE_URL/rest/v1/rpc/get_empty_tags_array_entries" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"limit_count": 1}' \
  -s | grep -q "error" && {
    # If the function doesn't exist, create it
    echo "Function doesn't exist, creating it..."
    curl -X POST \
      "$SUPABASE_URL/rest/v1/sql" \
      -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
      -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
      -H "Content-Type: application/json" \
      -d "{\"query\": $(cat "$TMP_SQL_FILE" | jq -Rs .)}"
    echo "Function created successfully!"
  } || {
    echo "Function already exists!"
  }

# Clean up
rm "$TMP_SQL_FILE" 