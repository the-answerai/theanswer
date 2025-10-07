-- PostgreSQL initialization script for test databases
-- This script is idempotent: safe to run multiple times (first-time and rerun)
-- Runs after 01-init-flowise.sql when PostgreSQL container is initialized

-- ============================================================
-- CREATE TEST DATABASES (idempotent)
-- ============================================================

-- Create test_flowise_e2e (used by Playwright E2E tests)
SELECT 'CREATE DATABASE test_flowise_e2e'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'test_flowise_e2e')\gexec

-- ============================================================
-- CREATE TEST USERS (idempotent)
-- ============================================================

-- Create test_user if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'test_user') THEN
        CREATE USER test_user WITH PASSWORD 'test_password';
        RAISE NOTICE 'Created user: test_user';
    ELSE
        RAISE NOTICE 'User test_user already exists, skipping';
    END IF;
END
$$;

-- ============================================================
-- GRANT PRIVILEGES
-- ============================================================

-- Grant privileges on test databases to test_user
GRANT ALL PRIVILEGES ON DATABASE test_flowise_e2e TO test_user;

-- Note: We do NOT revoke or modify existing grants to example_user
-- from 01-init-flowise.sql to avoid collisions

-- ============================================================
-- ENABLE EXTENSIONS
-- ============================================================

-- Switch to test_flowise_e2e and enable pgvector
\c test_flowise_e2e

-- Create pgvector extension if not exists (idempotent)
CREATE EXTENSION IF NOT EXISTS vector;

-- Grant usage on schema to test_user
GRANT ALL ON SCHEMA public TO test_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO test_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO test_user;

\echo 'Test database initialization completed successfully'
