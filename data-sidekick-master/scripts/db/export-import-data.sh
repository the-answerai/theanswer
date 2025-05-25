#!/bin/bash

# Set variables
LOCAL_DB_URL="postgresql://postgres:postgres@localhost:54332/postgres"
RDS_DB_URL="postgresql://postgres:A4dH#7t#V&wBIW7u@qwmxgsznahkjsddgdrwt.supabase.co:5432/postgres"
DUMP_FILE="local_data_dump.sql"

echo "🚀 Starting data export from LOCAL to RDS..."

# Export data from local database (data only, no schema)
echo "📤 Exporting data from local database..."
PGPASSWORD=postgres pg_dump -h localhost -p 54332 -U postgres -d postgres \
  --data-only \
  --column-inserts \
  --exclude-table=_prisma_migrations \
  --exclude-table=schema_migrations \
  --exclude-table=schema_migrations_history \
  --exclude-table=supabase_migrations \
  --exclude-table=supabase_migrations_history \
  --exclude-table=storage.buckets \
  --exclude-table=storage.objects \
  --exclude-table=auth.users \
  --exclude-table=auth.sessions \
  --exclude-table=auth.refresh_tokens \
  --exclude-table=auth.audit_log_entries \
  --exclude-table=auth.instances \
  --exclude-table=auth.schema_migrations \
  --exclude-table=_prisma_migrations \
  --exclude-table=extensions \
  --exclude-table=pg_stat_statements \
  --exclude-table=pg_stat_statements_info \
  --exclude-table=pgsodium_key_status \
  --exclude-table=pgsodium_key \
  --exclude-table=vault.secrets \
  --exclude-table=vault.decrypted_secrets \
  > $DUMP_FILE

if [ $? -ne 0 ]; then
  echo "❌ Error exporting data from local database"
  exit 1
fi

echo "✅ Data exported to $DUMP_FILE"

# Import data into RDS database
echo "📥 Importing data into RDS database..."
PGPASSWORD="A4dH#7t#V&wBIW7u" psql -h qwmxgsznahkjsddgdrwt.supabase.co -p 5432 -U postgres -d postgres -f $DUMP_FILE

if [ $? -ne 0 ]; then
  echo "❌ Error importing data into RDS database"
  exit 1
fi

echo "✅ Data imported into RDS database"
echo "🎉 Data export/import completed successfully!"

# Clean up
rm $DUMP_FILE
echo "🧹 Cleaned up temporary files" 