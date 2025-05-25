#!/bin/bash

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Default to local environment if not specified
ENV_FILE=${1:-".env.local"}

# Set the environment file
export ENV_FILE=$ENV_FILE

# Get the data source ID (optional)
DATA_SOURCE_ID=$2

# Run the reset script
echo "Running with environment file: $ENV_FILE"
node "$SCRIPT_DIR/reset_analysis_status.js" $DATA_SOURCE_ID 