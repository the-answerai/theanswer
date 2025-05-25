#!/bin/bash

# reanalyze-empty-tags.sh - Helper script to reanalyze call_log entries with empty TAGS_ARRAY
# Usage: ./reanalyze-empty-tags.sh [local|prime|wow|rds] <research_view_id> <data_source_id> [limit]

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Check if at least 3 arguments are provided
if [ $# -lt 3 ]; then
  echo "Usage: ./reanalyze-empty-tags.sh [local|prime|wow|rds] <research_view_id> <data_source_id> [limit]"
  exit 1
fi

# Get the environment, research view ID, and data source ID
ENV=$1
RESEARCH_VIEW_ID=$2
DATA_SOURCE_ID=$3
LIMIT=$4

# Run the analyze-transcriptions.sh script with the empty_tags reanalysis mode
"$SCRIPT_DIR/analyze-transcriptions.sh" $ENV $RESEARCH_VIEW_ID $DATA_SOURCE_ID "" $LIMIT "empty_tags" 