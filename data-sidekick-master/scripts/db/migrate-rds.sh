#!/bin/bash

# Load RDS environment variables
source .env.rds

# Set Supabase project URL and key for the CLI
export SUPABASE_URL=$SUPABASE_URL
export SUPABASE_KEY=$SUPABASE_SERVICE_ROLE_KEY

echo "🚀 Running migrations against RDS Supabase instance..."
echo "URL: $SUPABASE_URL"

# Run the migrations
supabase db push

# Check if the migration was successful
if [ $? -eq 0 ]; then
  echo "✅ Migrations applied successfully to RDS!"
else
  echo "❌ Failed to apply migrations to RDS."
  exit 1
fi 