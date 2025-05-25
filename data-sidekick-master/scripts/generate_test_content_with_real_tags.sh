#!/bin/bash

# This script generates test content using real tags from the database.
# It first ensures that tags exist in the database, then runs the test content generation script.

# Parse command line arguments
ENVIRONMENT=${1:-local}  # Default to 'local' if no environment specified
CLEAR_DATA=false

# Parse options
while [[ $# -gt 0 ]]; do
  case $1 in
    --clear|-c)
      CLEAR_DATA=true
      shift
      ;;
    --env|-e)
      ENVIRONMENT="$2"
      shift 2
      ;;
    *)
      # If not a recognized option, assume it's the environment
      if [[ $1 != -* && -z $ENVIRONMENT_SET ]]; then
        ENVIRONMENT="$1"
        ENVIRONMENT_SET=true
      fi
      shift
      ;;
  esac
done

echo "=== Test Content Generator with Real Tags ==="
echo "Environment: $ENVIRONMENT"
echo "Clear existing data: $CLEAR_DATA"
echo ""

# Check if the .env file exists for the specified environment
if [ ! -f ".env.$ENVIRONMENT" ]; then
  echo "Error: .env.$ENVIRONMENT file not found."
  echo "Please create this file with the required environment variables."
  exit 1
fi

# Check if tags exist in the database
echo "Checking if tags exist in the database..."
TAG_COUNT=$(node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.$ENVIRONMENT' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function checkTags() {
  try {
    const { count, error } = await supabase
      .from('tags')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
    
    console.log(count || 0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkTags();
")

if [ "$TAG_COUNT" -eq "0" ]; then
  echo "No tags found in the database. Creating tags first..."
  node scripts/create_tags.js $ENVIRONMENT
  
  if [ $? -ne 0 ]; then
    echo "Error creating tags. Please check the error messages and try again."
    exit 1
  fi
  
  echo "Tags created successfully!"
else
  echo "Found $TAG_COUNT tags in the database."
fi

# Run the test content generation script
echo ""
echo "Starting test content generation with real tags..."

# Build the command with or without the --clear flag
COMMAND="node scripts/imports/test-content/fetch_and_use_real_tags.js $ENVIRONMENT"
if [ "$CLEAR_DATA" = true ]; then
  COMMAND="$COMMAND --clear"
fi

# Execute the command
eval $COMMAND

# Check if the command was successful
if [ $? -ne 0 ]; then
  echo "Error generating test content. Please check the error messages above."
  exit 1
fi

echo ""
echo "=== Test content generation completed successfully! ===" 