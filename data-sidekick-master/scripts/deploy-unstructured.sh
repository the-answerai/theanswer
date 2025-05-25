#!/bin/bash

# Deployment script for Unstructured in production
# This script helps set up and run the Unstructured Docker container in a production environment

set -e  # Exit immediately if a command exits with a non-zero status

# Display header
echo "=========================================="
echo "  Unstructured Deployment Script"
echo "=========================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed"
    echo "Please install Docker before running this script"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "Error: Docker Compose is not installed"
    echo "Please install Docker Compose before running this script"
    exit 1
fi

# Go to project root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

# Ensure the uploads directory exists
mkdir -p uploads

# Check if env var UNSTRUCTURED_API_KEY exists and is not empty
if [ -z "${UNSTRUCTURED_API_KEY}" ]; then
    echo "Warning: UNSTRUCTURED_API_KEY environment variable is not set"
    echo "Consider setting this for production environments"
fi

# Pull the latest Unstructured Docker image
echo "Pulling latest Unstructured Docker image..."
docker pull downloads.unstructured.io/unstructured-io/unstructured:latest

# Start the Unstructured container
echo "Starting Unstructured container..."
docker-compose -f docker-compose.unstructured.yml up -d

# Wait for container to be fully up
echo "Waiting for Unstructured container to be ready..."
max_retries=10
retry_count=0
while [ $retry_count -lt $max_retries ]; do
    if docker ps | grep -q "unstructured-api"; then
        echo "Unstructured container is ready!"
        exit 0
    fi
    
    retry_count=$((retry_count+1))
    echo "Waiting for Unstructured container to be ready... (Attempt $retry_count/$max_retries)"
    sleep 5
done

echo "Error: Unstructured container failed to start within the expected time"
echo "Check the logs with: docker logs unstructured-api"
exit 1 