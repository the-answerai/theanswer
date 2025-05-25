#!/bin/bash

# reanalyze-empty-tags-direct.sh - Helper script to directly reanalyze call_log entries with empty TAGS_ARRAY
# Usage: ./reanalyze-empty-tags-direct.sh [local|prime|wow|rds] [limit] [example_json_path]

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Check if at least 1 argument is provided
if [ $# -lt 1 ]; then
  echo "Usage: ./reanalyze-empty-tags-direct.sh [local|prime|wow|rds] [limit] [example_json_path]"
  exit 1
fi

# Get the environment, limit, and example JSON path
ENV=$1
LIMIT=$2
EXAMPLE_JSON_PATH=$3

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
echo "Loading environment from .env.$ENV"
export $(grep -v '^#' .env.$ENV | xargs)

# Run the reanalysis script
node -e "
const { createClient } = require('@supabase/supabase-js');

// Create Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Function to reanalyze entries with empty tags
async function reanalyzeEmptyTags() {
  try {
    // Get entries with empty TAGS text field
    const { data: emptyTagsEntries, error: fetchError } = await supabase
      .from('call_log')
      .select('id, RECORDING_URL')
      .or('TAGS.is.null,TAGS.eq.');

    if (fetchError) {
      console.error('Error fetching entries with empty tags:', fetchError);
      return;
    }

    console.log(\`Found \${emptyTagsEntries.length} entries with empty TAGS text field\`);

    // Check if API_URL is defined
    const apiUrl = process.env.API_URL || 'http://localhost:3000';
    console.log(\`Using API URL: \${apiUrl}\`);

    // Process entries in batches
    const batchSize = 50;
    let processedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < emptyTagsEntries.length; i += batchSize) {
      const batch = emptyTagsEntries.slice(i, i + batchSize);
      console.log(\`Processing batch \${i/batchSize + 1} of \${Math.ceil(emptyTagsEntries.length/batchSize)} (entries \${i+1}-\${Math.min(i+batchSize, emptyTagsEntries.length)})\`);
      
      for (const entry of batch) {
        try {
          // Call the reanalyze endpoint
          const response = await fetch(\`\${apiUrl}/api/call-log/reanalyze/\${entry.id}\`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': \`Bearer \${process.env.API_KEY || ''} \`
            }
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error(\`Error reanalyzing entry \${entry.id} (\${entry.RECORDING_URL}): \${response.status} \${errorText}\`);
            errorCount++;
            continue;
          }

          processedCount++;
        } catch (err) {
          console.error(\`Error processing entry \${entry.id} (\${entry.RECORDING_URL}): \${err.message}\`);
          errorCount++;
        }
      }
      
      // Wait a bit between batches to avoid rate limiting
      if (i + batchSize < emptyTagsEntries.length) {
        console.log('Waiting 2 seconds before next batch...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log(\`\nReanalysis complete. Processed \${processedCount} entries with \${errorCount} errors.\`);
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the function
reanalyzeEmptyTags();
" 