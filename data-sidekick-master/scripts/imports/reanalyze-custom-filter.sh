#!/bin/bash

# reanalyze-custom-filter.sh - Helper script to reanalyze call_log entries with a custom filter
# Usage: ./reanalyze-custom-filter.sh [local|prime|wow|rds] <research_view_id> <data_source_id> <custom_filter> [limit]
# Example: ./reanalyze-custom-filter.sh local 123 456 "sentiment_score.lt.5" 100

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Check if at least 4 arguments are provided
if [ $# -lt 4 ]; then
  echo "Usage: ./reanalyze-custom-filter.sh [local|prime|wow|rds] <research_view_id> <data_source_id> <custom_filter> [limit]"
  echo "Example: ./reanalyze-custom-filter.sh local 123 456 \"sentiment_score.lt.5\" 100"
  echo "Custom filter format: field.operator.value (e.g., sentiment_score.lt.5, resolution_status.eq.unresolved)"
  exit 1
fi

# Get the environment, research view ID, data source ID, and custom filter
ENV=$1
RESEARCH_VIEW_ID=$2
DATA_SOURCE_ID=$3
CUSTOM_FILTER=$4
LIMIT=$5

# Run the analyze-transcriptions.sh script with the custom_filter reanalysis mode
"$SCRIPT_DIR/analyze-transcriptions.sh" $ENV $RESEARCH_VIEW_ID $DATA_SOURCE_ID "" $LIMIT "custom_filter" "$CUSTOM_FILTER" 