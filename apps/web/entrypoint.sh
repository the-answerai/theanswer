#!/bin/bash

# Exit on any error
set -e

echo "Starting web application entrypoint..."

# Parse DATABASE_SECRET if it exists
if [ -n "$DATABASE_SECRET" ]; then
    echo "Parsing DATABASE_SECRET..."
    
    # Use Node.js to parse the JSON and extract values
    eval "$(node -e "
        try {
            const secret = JSON.parse(process.env.DATABASE_SECRET);
            console.log('export DATABASE_HOST=\"' + secret.host + '\"');
            console.log('export DATABASE_PORT=\"' + secret.port + '\"');
            console.log('export DATABASE_NAME=\"' + secret.dbname + '\"');
            console.log('export DATABASE_USER=\"' + secret.username + '\"');
            console.log('export DATABASE_PASSWORD=\"' + secret.password + '\"');
            console.log('export DATABASE_TYPE=\"' + secret.engine + '\"');
            console.log('export DATABASE_URL=\"postgresql://' + secret.username + ':' + secret.password + '@' + secret.host + ':' + secret.port + '/' + secret.dbname + '?schema=public&connection_limit=1\"');
        } catch (error) {
            console.error('Error parsing DATABASE_SECRET:', error.message);
            process.exit(1);
        }
    ")"
    
    echo "Database environment variables set successfully"
else
    echo "No DATABASE_SECRET found, skipping database configuration"
fi

# Run database migration (deploy existing migrations for production)
echo "Running database migration..."
# ROBUST MIGRATION STRATEGY: Try proper migrations first, fallback to schema sync
# This handles all deployment scenarios:
# - Fresh DB: migrate deploy works (creates tables + tracking)
# - Flowise-only DB: migrate deploy fails P3005 → db push creates Prisma tables
# - Existing deployment: migrate deploy applies new migrations
# - Corrupted state: migrate deploy fails → db push fixes schema
echo "Attempting Prisma migration deployment..."
(cd packages-answers/db && npx --yes prisma@^5.22.0 migrate deploy) || {
  echo "Migration deploy failed, falling back to schema push..."
  (cd packages-answers/db && npx --yes prisma@^5.22.0 db push --accept-data-loss)
}

# Start the Next.js application
echo "Starting Next.js application..."
exec node apps/web/server.js
