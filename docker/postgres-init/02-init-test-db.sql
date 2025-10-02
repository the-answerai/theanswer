-- PostgreSQL initialization script for test databases
-- This script runs automatically when the PostgreSQL container is initialized for the first time
-- It creates test databases and users to support E2E testing with safety prefixes

-- Create test databases (common naming patterns)
SELECT 'CREATE DATABASE test_flowise_e2e'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'test_flowise_e2e')\gexec

SELECT 'CREATE DATABASE test_theanswer'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'test_theanswer')\gexec

SELECT 'CREATE DATABASE test_example_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'test_example_db')\gexec

-- Create test users if they don't exist
DO
$do$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'test_user') THEN
      CREATE USER test_user WITH PASSWORD 'test_password';
   END IF;
   IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'test_example_user') THEN
      CREATE USER test_example_user WITH PASSWORD 'example_password';
   END IF;
END
$do$;

-- Grant all privileges on test databases to test users
GRANT ALL PRIVILEGES ON DATABASE test_flowise_e2e TO test_user;
GRANT ALL PRIVILEGES ON DATABASE test_flowise_e2e TO test_example_user;
GRANT ALL PRIVILEGES ON DATABASE test_flowise_e2e TO example_user;

GRANT ALL PRIVILEGES ON DATABASE test_theanswer TO test_user;
GRANT ALL PRIVILEGES ON DATABASE test_theanswer TO test_example_user;
GRANT ALL PRIVILEGES ON DATABASE test_theanswer TO example_user;

GRANT ALL PRIVILEGES ON DATABASE test_example_db TO test_user;
GRANT ALL PRIVILEGES ON DATABASE test_example_db TO test_example_user;
GRANT ALL PRIVILEGES ON DATABASE test_example_db TO example_user;

-- Enable pgvector extension on test databases
\c test_flowise_e2e
CREATE EXTENSION IF NOT EXISTS vector;

\c test_theanswer
CREATE EXTENSION IF NOT EXISTS vector;

\c test_example_db
CREATE EXTENSION IF NOT EXISTS vector;
