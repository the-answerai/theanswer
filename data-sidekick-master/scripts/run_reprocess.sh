#!/bin/bash

# Get the environment from command line argument
ENV=$1

if [ -z "$ENV" ] || [[ "$ENV" != "wow" && "$ENV" != "prime" ]]; then
    echo "Please specify environment: ./run_reprocess.sh [wow|prime]"
    exit 1
fi

# Create logs directory if it doesn't exist
mkdir -p logs

# Run the script in the background and log output to a file
nohup node scripts/reprocess_tags_csv.js $ENV > logs/reprocess_$ENV.log 2>&1 &

# Get the process ID
PID=$!

echo "Started reprocessing for $ENV environment with process ID: $PID"
echo "Logs are being written to logs/reprocess_$ENV.log"
echo "To check progress, use: tail -f logs/reprocess_$ENV.log"
echo "To stop the process, use: kill $PID" 