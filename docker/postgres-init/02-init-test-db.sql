-- PostgreSQL initialization script for test databases
-- This script is idempotent: safe to run multiple times (first-time and rerun)
-- Runs after 01-init-flowise.sql when PostgreSQL container is initialized

-- ============================================================
-- CREATE TEST DATABASES (idempotent)
-- ============================================================

-- Create test_flowise (for Flowise backend tests)
-- When NODE_ENV=test, BWS provides DATABASE_NAME=flowise which auto-prefixes to test_flowise
SELECT 'CREATE DATABASE test_flowise'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'test_flowise')\gexec

-- ============================================================
-- CREATE TEST USERS (idempotent)
-- ============================================================

-- Create test_example_user (matches BWS auto-prefix: example_user → test_example_user)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'test_example_user') THEN
        CREATE USER test_example_user WITH PASSWORD 'example_password';
        RAISE NOTICE 'Created user: test_example_user';
    ELSE
        RAISE NOTICE 'User test_example_user already exists, skipping';
    END IF;
END
$$;

-- ============================================================
-- GRANT PRIVILEGES
-- ============================================================

-- Grant privileges on test database
GRANT ALL PRIVILEGES ON DATABASE test_flowise TO test_example_user;

-- Note: We do NOT revoke or modify existing grants to example_user
-- from 01-init-flowise.sql to avoid collisions

-- ============================================================
-- ENABLE EXTENSIONS & PERMISSIONS
-- ============================================================

-- Switch to test_flowise and setup permissions
\c test_flowise

-- Create pgvector extension if not exists (idempotent)
CREATE EXTENSION IF NOT EXISTS vector;

-- Grant usage on schema to test_example_user
GRANT ALL ON SCHEMA public TO test_example_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO test_example_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO test_example_user;

\echo 'Test database initialization completed successfully'
