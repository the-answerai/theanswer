#!/bin/bash

# Script to import IAS tags
# Simply runs the import_tags.js script

# Set the default environment to local if not provided
ENV=${1:-local}

echo "Starting IAS tag import for $ENV environment..."

# Run the import script
node scripts/imports/ias/import_tags.js $ENV

echo "IAS tag import complete!" 