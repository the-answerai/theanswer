#!/bin/bash

# analyze-transcriptions.sh - Helper script to run analyze_transcriptions.js with different environments
# Usage: ./analyze-transcriptions.sh [local|prime|wow|rds] <research_view_id> <data_source_id> [example_json_path] [limit] [reanalysis_mode] [custom_filter]

# Check if at least 3 arguments are provided
if [ $# -lt 3 ]; then
  echo "Usage: ./analyze-transcriptions.sh [local|prime|wow|rds] <research_view_id> <data_source_id> [example_json_path] [limit] [reanalysis_mode] [custom_filter]"
  echo "Reanalysis modes: empty_tags, custom_filter"
  exit 1
fi

# Get the environment, research view ID, and data source ID
ENV=$1
RESEARCH_VIEW_ID=$2
DATA_SOURCE_ID=$3
EXAMPLE_JSON_PATH=$4
LIMIT=$5
REANALYSIS_MODE=$6
CUSTOM_FILTER=$7

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

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

# Run the analyze_transcriptions.js script with the specified environment file
if [ -n "$REANALYSIS_MODE" ] && [ -n "$CUSTOM_FILTER" ]; then
  echo "Running in reanalysis mode: $REANALYSIS_MODE with custom filter: $CUSTOM_FILTER"
  ENV_FILE=$ENV_FILE node "$SCRIPT_DIR/analyze_transcriptions.js" $RESEARCH_VIEW_ID $DATA_SOURCE_ID $EXAMPLE_JSON_PATH $LIMIT $REANALYSIS_MODE $CUSTOM_FILTER
elif [ -n "$REANALYSIS_MODE" ]; then
  echo "Running in reanalysis mode: $REANALYSIS_MODE"
  ENV_FILE=$ENV_FILE node "$SCRIPT_DIR/analyze_transcriptions.js" $RESEARCH_VIEW_ID $DATA_SOURCE_ID $EXAMPLE_JSON_PATH $LIMIT $REANALYSIS_MODE
elif [ -n "$EXAMPLE_JSON_PATH" ] && [ -n "$LIMIT" ]; then
  echo "Running with example JSON: $EXAMPLE_JSON_PATH and limit: $LIMIT"
  ENV_FILE=$ENV_FILE node "$SCRIPT_DIR/analyze_transcriptions.js" $RESEARCH_VIEW_ID $DATA_SOURCE_ID $EXAMPLE_JSON_PATH $LIMIT
elif [ -n "$EXAMPLE_JSON_PATH" ]; then
  echo "Running with example JSON: $EXAMPLE_JSON_PATH"
  ENV_FILE=$ENV_FILE node "$SCRIPT_DIR/analyze_transcriptions.js" $RESEARCH_VIEW_ID $DATA_SOURCE_ID $EXAMPLE_JSON_PATH
elif [ -n "$LIMIT" ]; then
  echo "Running with limit: $LIMIT"
  ENV_FILE=$ENV_FILE node "$SCRIPT_DIR/analyze_transcriptions.js" $RESEARCH_VIEW_ID $DATA_SOURCE_ID "" $LIMIT
else
  echo "Running without example JSON or limit"
  ENV_FILE=$ENV_FILE node "$SCRIPT_DIR/analyze_transcriptions.js" $RESEARCH_VIEW_ID $DATA_SOURCE_ID
fi 