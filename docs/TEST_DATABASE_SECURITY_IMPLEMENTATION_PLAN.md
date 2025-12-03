# Test Database Security - Implementation Plan

## Overview
This plan implements the security measures documented in TEST_DATABASE_SECURITY.md with specific attention to:
- Guarding against empty/undefined environment variables
- Idempotent Docker initialization scripts
- Sensitive data masking in logs (with deduplicated logging)
- Future-proofing with unit tests (with proper module cache clearing)

**Plan Status**: ✅ Reviewed and refined - ready for execution

### Key Refinements from Review
- **Deduplicated logging**: Helper returns value silently; only init() logs transformations
- **Unit test cache clearing**: Tests use jest.resetModules() between cases to re-execute guards
- **Docker volume mount**: Added to docker-compose.yml for init scripts
- **CI psql availability**: Confirmed ubuntu-latest includes postgresql-client by default
- **Concise security comments**: Kept warning block readable and focused

---

## 🔴 Priority 1: Critical Security - DataSource Guard

### Task 1.1: Implement `ensureTestPrefix()` with Enhanced Guards
**File**: `packages/server/src/DataSource.ts`
**Location**: Before line 15 (before `export const init = async (): Promise<void> =>`)

#### Implementation Details

```typescript
/**
 * Ensures database configuration values have test prefix when running in test mode.
 * Guards against empty/undefined values to prevent test_undefined scenarios.
 * Note: Returns silently - caller is responsible for logging.
 *
 * @param value - The environment variable value (may be undefined)
 * @param defaultName - Fallback name if value is empty/undefined
 * @returns Properly prefixed database value
 */
const ensureTestPrefix = (value: string | undefined, defaultName: string): string => {
    // Guard against empty/undefined - use default instead
    const effectiveValue = value?.trim() || defaultName

    // Check if already has test prefix (prefix or suffix)
    if (effectiveValue.startsWith('test_') || effectiveValue.endsWith('_test')) {
        return effectiveValue
    }

    // Auto-correct: add test_ prefix
    return `test_${effectiveValue}`
}

/**
 * Masks sensitive values in logs (passwords, tokens)
 * Shows first/last 2 chars with asterisks in between
 */
const maskSensitive = (value: string | undefined): string => {
    if (!value || value.length < 4) return '****'
    return `${value.slice(0, 2)}${'*'.repeat(value.length - 4)}${value.slice(-2)}`
}
```

#### Integration into `init()` function

Add at the very beginning of `init()` function (after line 15):

```typescript
export const init = async (): Promise<void> => {
    // 🔒 TEST MODE SECURITY: Auto-prefix database credentials
    if (process.env.NODE_ENV === 'test') {
        const originalDbName = process.env.DATABASE_NAME
        const originalDbUser = process.env.DATABASE_USER
        const originalDbPassword = process.env.DATABASE_PASSWORD

        // Apply test prefix with guards against empty values
        process.env.DATABASE_NAME = ensureTestPrefix(originalDbName, 'theanswer')
        process.env.DATABASE_USER = ensureTestPrefix(originalDbUser, 'user')

        // Log test mode activation with transformations
        logger.info('🔒 TEST MODE: Auto-prefixed database credentials')
        logger.info(`  DATABASE_NAME: ${originalDbName || '(empty)'} → ${process.env.DATABASE_NAME}`)
        logger.info(`  DATABASE_USER: ${originalDbUser || '(empty)'} → ${process.env.DATABASE_USER}`)
        logger.info(`  DATABASE_PASSWORD: ${maskSensitive(originalDbPassword)} (masked)`)
    }

    // Always log storage configuration at DataSource init (before logger tries to use S3)
    logger.info('DataSource initialization - Storage Configuration:')
    // ... existing code continues
}
```

#### Checklist

- [ ] Add `ensureTestPrefix()` function above `init()`
- [ ] Add `maskSensitive()` function above `init()`
- [ ] Add NODE_ENV=test detection at start of `init()`
- [ ] Guard against empty/undefined with `value?.trim() || defaultName`
- [ ] Wrap DATABASE_NAME with ensureTestPrefix
- [ ] Wrap DATABASE_USER with ensureTestPrefix
- [ ] Log original → prefixed transformations (with masking for password)
- [ ] Test with empty DATABASE_NAME (should use test_theanswer)
- [ ] Test with empty DATABASE_USER (should use test_user)
- [ ] Test with undefined values (should not create test_undefined)
- [ ] Verify logs show masked passwords
- [ ] Run existing E2E tests to confirm no breakage

---

## 🟠 Priority 2: Infrastructure - Idempotent Docker Init Script

### Task 2.1: Create `02-init-test-db.sql`
**File**: `docker/postgres-init/02-init-test-db.sql` (NEW)

#### Implementation

```sql
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
```

#### Checklist

- [ ] Create file `docker/postgres-init/02-init-test-db.sql`
- [ ] Use `SELECT ... \gexec` for database creation (idempotent)
- [ ] Use `DO $$ ... $$` block for role creation (idempotent)
- [ ] Check for existing databases before creating
- [ ] Check for existing roles before creating
- [ ] Grant privileges to test_user
- [ ] DO NOT revoke or modify example_user grants
- [ ] Enable pgvector extension in test_flowise_e2e
- [ ] Add comments explaining idempotency
- [ ] Test script by running twice (should not error on second run)
- [ ] Verify test_user can connect: `psql -U test_user -d test_flowise_e2e`
- [ ] Verify example_user grants still intact after script runs

### Task 2.2: Add Volume Mount to Docker Compose
**File**: `docker-compose.yml`
**Location**: Line 98 (postgres service volumes section)

#### Current State
The postgres service currently only has the data volume:
```yaml
postgres:
    image: pgvector/pgvector:pg16
    restart: unless-stopped
    ports:
        - '5432:5432'
    volumes:
        - postgres_data:/var/lib/postgresql/data/
```

#### Required Change
Add the init scripts volume mount:
```yaml
postgres:
    image: pgvector/pgvector:pg16
    restart: unless-stopped
    ports:
        - '5432:5432'
    volumes:
        - postgres_data:/var/lib/postgresql/data/
        - ./docker/postgres-init:/docker-entrypoint-initdb.d
    environment:
        POSTGRES_PORT: 5432
        POSTGRES_USER: example_user
        POSTGRES_PASSWORD: example_password
        POSTGRES_DB: example_db
    networks:
        - app-network
```

#### Checklist

- [ ] Add `./docker/postgres-init:/docker-entrypoint-initdb.d` volume mount to postgres service
- [ ] Verify mount is on line 99 (after postgres_data volume)
- [ ] Test with fresh container: `docker-compose down -v && docker-compose up -d postgres`
- [ ] Verify scripts run in order: `docker-compose logs postgres | grep -E "01-init|02-init"`
- [ ] Check for success message: `docker-compose logs postgres | grep "Test database initialization completed"`
- [ ] Test idempotency: Run `docker-compose restart postgres` (should not error)
- [ ] Document that scripts only run on FIRST initialization with empty data volume

---

## 🟡 Priority 3: CI/CD - Cypress Database Integration

### Task 3.1: Investigate Cypress Database Requirements
**Status**: ✅ **CONFIRMED - Cypress NEEDS PostgreSQL**

**Evidence**:
- `cypress/e2e/1-apikey/apikey.cy.js` - Tests CRUD operations on `/apikey` endpoint
- `cypress/e2e/2-variables/variables.cy.js` - Tests CRUD operations on `/variables` endpoint
- Tests expect DefaultKey to exist on load (requires database seeding)
- Tests verify persistent data after mutations

**Conclusion**: Cypress tests hit real API endpoints that require database access.

### Task 3.2: Add PostgreSQL Service to main.yml
**File**: `.github/workflows/main.yml`

#### Implementation

Add PostgreSQL service to the `build` job (after line 17):

```yaml
    build:
        strategy:
            matrix:
                platform: [ubuntu-latest]
                node-version: [20.17.0]
        runs-on: ${{ matrix.platform }}

        # Add PostgreSQL service for Cypress tests
        services:
            postgres:
                image: pgvector/pgvector:pg16
                env:
                    POSTGRES_USER: test_user
                    POSTGRES_PASSWORD: test_password
                    POSTGRES_DB: test_flowise_e2e
                ports:
                    - 5432:5432
                options: >-
                    --health-cmd pg_isready
                    --health-interval 10s
                    --health-timeout 5s
                    --health-retries 5

        env:
            PUPPETEER_SKIP_DOWNLOAD: true
            # Add test database environment variables
            NODE_ENV: test
            DATABASE_TYPE: postgres
            DATABASE_HOST: localhost
            DATABASE_PORT: 5432
            DATABASE_NAME: test_flowise_e2e
            DATABASE_USER: test_user
            DATABASE_PASSWORD: test_password
```

Add database setup step (before Cypress tests run):

```yaml
            - name: Setup test database
              run: |
                  # Note: postgresql-client is included by default in ubuntu-latest
                  # Wait for PostgreSQL to be ready
                  until pg_isready -h localhost -p 5432 -U test_user; do
                    echo "Waiting for PostgreSQL..."
                    sleep 2
                  done

                  # Enable pgvector extension
                  PGPASSWORD=test_password psql -h localhost -U test_user -d test_flowise_e2e -c "CREATE EXTENSION IF NOT EXISTS vector;"

                  echo "✅ Test database ready"
```

#### Checklist

- [ ] Add PostgreSQL service with pgvector/pgvector:pg16 image
- [ ] Configure health checks for PostgreSQL readiness
- [ ] Export test database environment variables in `env:` block
- [ ] Add database setup step before Cypress tests
- [ ] Enable pgvector extension in setup step
- [ ] Note: postgresql-client is available by default in ubuntu-latest (no apt-get needed)
- [ ] Mirror configuration from e2e-tests.yml (for consistency)
- [ ] Test workflow in CI to confirm Cypress tests pass
- [ ] Verify Cypress tests can create/read/update/delete data

---

## 🔵 Priority 4: Documentation & Future-Proofing

### Task 4.1: Update Environment File Templates

#### File: `.env.example` (or root environment template)

Add commented section explaining test defaults:

```bash
# ============================================================
# DATABASE CONFIGURATION
# ============================================================
# IMPORTANT: These defaults are designed for test runners and CI/CD.
# For development and production environments, OVERRIDE these values explicitly:
#   - Development: Use your local database (e.g., DATABASE_NAME=flowise_dev)
#   - Production: Use production credentials via environment variables or secrets manager
#
# Test mode (NODE_ENV=test) automatically adds test_ prefix to prevent accidental
# production database access. See packages/server/src/DataSource.ts for implementation.

DATABASE_TYPE=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=test_flowise_e2e    # ⚠️ Test default - override for dev/prod
DATABASE_USER=test_user            # ⚠️ Test default - override for dev/prod
DATABASE_PASSWORD=test_password    # ⚠️ Test default - override for dev/prod
```

#### File: `apps/web/e2e/.env.example`

Update header comment:

```bash
# ============================================================
# E2E TEST CONFIGURATION
# ============================================================
# This file contains test-specific configuration.
# Values here should NEVER be used in development or production.
#
# Test Database Security:
#   - NODE_ENV=test triggers automatic test_ prefix enforcement
#   - See packages/server/src/DataSource.ts::ensureTestPrefix()
#   - See docs/TEST_DATABASE_SECURITY.md for security details

NODE_ENV=test
DATABASE_NAME=test_flowise_e2e
DATABASE_USER=test_user
DATABASE_PASSWORD=test_password
```

#### Checklist

- [ ] Add WARNING comments in `.env.example` about test defaults
- [ ] Clarify dev/prod must override explicitly
- [ ] Add reference to DataSource.ts implementation
- [ ] Add reference to TEST_DATABASE_SECURITY.md docs
- [ ] Update `apps/web/e2e/.env.example` header
- [ ] Ensure no sensitive production values in examples

### Task 4.2: Update TEST_DATABASE_SECURITY.md

#### Updates Needed

1. **Mark implementation status**: Change from "Proposed" to "Implemented" in relevant sections
2. **Add actual code references**: Link to DataSource.ts line numbers
3. **Update troubleshooting**: Add section on handling empty environment variables
4. **Add Docker script reference**: Document 02-init-test-db.sql location and usage

#### Checklist

- [ ] Change status markers from planned to implemented
- [ ] Add code reference: `packages/server/src/DataSource.ts:15-45`
- [ ] Add script reference: `docker/postgres-init/02-init-test-db.sql`
- [ ] Document empty value handling behavior
- [ ] Add troubleshooting section for common setup issues
- [ ] Update examples to match actual implementation

### Task 4.3: Add Unit Test for ensureTestPrefix

**File**: `packages/server/src/__tests__/DataSource.test.ts` (NEW)

#### Implementation

```typescript
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'

describe('DataSource Test Mode Security', () => {
    let originalEnv: NodeJS.ProcessEnv

    beforeEach(() => {
        // Save original environment
        originalEnv = { ...process.env }

        // Clear module cache to force fresh import of DataSource
        jest.resetModules()
    })

    afterEach(() => {
        // Restore original environment
        process.env = originalEnv

        // Clear module cache after each test
        jest.resetModules()
    })

    describe('ensureTestPrefix behavior via init()', () => {
        it('should add test_ prefix when missing', async () => {
            // Setup environment
            process.env.NODE_ENV = 'test'
            process.env.DATABASE_NAME = 'flowise'
            process.env.DATABASE_USER = 'user'
            process.env.DATABASE_TYPE = 'postgres'

            // Dynamic import to get fresh module with reset appDataSource
            const { init } = await import('../DataSource')
            await init()

            // Verify prefix was added
            expect(process.env.DATABASE_NAME).toBe('test_flowise')
            expect(process.env.DATABASE_USER).toBe('test_user')
        })

        it('should preserve existing test_ prefix', async () => {
            process.env.NODE_ENV = 'test'
            process.env.DATABASE_NAME = 'test_already_prefixed'
            process.env.DATABASE_TYPE = 'postgres'

            const { init } = await import('../DataSource')
            await init()

            expect(process.env.DATABASE_NAME).toBe('test_already_prefixed')
        })

        it('should preserve existing _test suffix', async () => {
            process.env.NODE_ENV = 'test'
            process.env.DATABASE_NAME = 'flowise_test'
            process.env.DATABASE_TYPE = 'postgres'

            const { init } = await import('../DataSource')
            await init()

            expect(process.env.DATABASE_NAME).toBe('flowise_test')
        })

        it('should handle empty DATABASE_NAME with default', async () => {
            process.env.NODE_ENV = 'test'
            process.env.DATABASE_NAME = ''
            process.env.DATABASE_TYPE = 'postgres'

            const { init } = await import('../DataSource')
            await init()

            expect(process.env.DATABASE_NAME).toBe('test_theanswer')
        })

        it('should handle undefined DATABASE_NAME with default', async () => {
            process.env.NODE_ENV = 'test'
            delete process.env.DATABASE_NAME
            process.env.DATABASE_TYPE = 'postgres'

            const { init } = await import('../DataSource')
            await init()

            expect(process.env.DATABASE_NAME).toBe('test_theanswer')
        })

        it('should NOT modify values when NODE_ENV != test', async () => {
            process.env.NODE_ENV = 'production'
            process.env.DATABASE_NAME = 'flowise_production'
            process.env.DATABASE_TYPE = 'postgres'

            const { init } = await import('../DataSource')
            await init()

            expect(process.env.DATABASE_NAME).toBe('flowise_production')
        })
    })
})
```

#### Checklist

- [ ] Create `packages/server/src/__tests__/DataSource.test.ts`
- [ ] Use `jest.resetModules()` in beforeEach/afterEach to clear module cache
- [ ] Use dynamic import `await import('../DataSource')` to get fresh module
- [ ] Add test for missing prefix (should add test_)
- [ ] Add test for existing test_ prefix (should preserve)
- [ ] Add test for existing _test suffix (should preserve)
- [ ] Add test for empty DATABASE_NAME (should use default)
- [ ] Add test for undefined DATABASE_NAME (should use default)
- [ ] Add test for NODE_ENV != test (should NOT modify)
- [ ] Run test suite: `pnpm test DataSource.test.ts`
- [ ] Ensure tests pass in CI
- [ ] Verify no exports of ensureTestPrefix needed (tested via init())

### Task 4.4: Add Documentation Note to Prevent Regression

**File**: `packages/server/src/DataSource.ts`

Add concise comment above `ensureTestPrefix` function:

```typescript
/**
 * 🔒 SECURITY CRITICAL: Test Database Prefix Enforcement
 * Prevents production DB access during testing by auto-prefixing when NODE_ENV=test.
 * DO NOT MODIFY without updating docs/TEST_DATABASE_SECURITY.md and unit tests.
 */
const ensureTestPrefix = (/* ... */) => {
    // ...
}
```

Add brief comment above test mode block in `init()`:

```typescript
export const init = async (): Promise<void> => {
    // 🔒 SECURITY: Auto-prefix test database credentials (see ensureTestPrefix)
    if (process.env.NODE_ENV === 'test') {
        // ...
    }
}
```

#### Checklist

- [ ] Add concise SECURITY CRITICAL comment above ensureTestPrefix (3 lines max)
- [ ] Add brief security comment to init() test mode block (1 line)
- [ ] Reference TEST_DATABASE_SECURITY.md for detailed context
- [ ] Keep comments readable - avoid walls of text

---

## 📊 Implementation Order & Dependencies

### Phase 1: Foundation (Sequential)
1. **Task 1.1**: Implement DataSource security guard
2. **Task 4.3**: Add unit tests for security guard
3. **Task 4.4**: Add documentation comments to prevent regression

**Why sequential**: Unit tests should verify the implementation immediately

### Phase 2: Infrastructure (Can run in parallel)
- **Task 2.1**: Create Docker init script
- **Task 2.2**: Verify Docker Compose setup
- **Task 4.1**: Update environment file templates

**Why parallel**: These tasks don't depend on each other

### Phase 3: CI/CD (Sequential after Phase 1)
1. **Task 3.2**: Add PostgreSQL service to main.yml

**Why after Phase 1**: CI should use the new security guard

### Phase 4: Documentation (Can run in parallel with testing)
- **Task 4.2**: Update TEST_DATABASE_SECURITY.md

**Why parallel**: Documentation can be written while testing other changes

---

## ✅ Acceptance Criteria

### Must Pass Before Merging

- [ ] All unit tests pass for ensureTestPrefix
- [ ] E2E tests pass with DataSource guard enabled
- [ ] Cypress tests pass in main.yml workflow
- [ ] Docker init script runs successfully on fresh container
- [ ] Docker init script runs successfully on existing container (idempotent test)
- [ ] Manual test: Empty DATABASE_NAME does NOT create test_undefined
- [ ] Manual test: Logs show masked password values
- [ ] Manual test: example_user grants still work after init script
- [ ] Documentation matches actual implementation
- [ ] Security comments added to prevent future regression

---

## 🚀 Execution Checklist

Copy this checklist to track progress:

### Phase 1: Foundation
- [ ] 1.1.1: Add ensureTestPrefix function to DataSource.ts
- [ ] 1.1.2: Add maskSensitive function to DataSource.ts
- [ ] 1.1.3: Add NODE_ENV=test detection in init()
- [ ] 1.1.4: Test with empty/undefined values
- [ ] 1.1.5: Verify E2E tests still pass
- [ ] 4.3.1: Create DataSource.test.ts with all test cases
- [ ] 4.3.2: Run tests and verify they pass
- [ ] 4.4.1: Add SECURITY CRITICAL comments

### Phase 2: Infrastructure
- [ ] 2.1.1: Create 02-init-test-db.sql with idempotent checks
- [ ] 2.1.2: Test script on fresh Docker container
- [ ] 2.1.3: Test script on existing container (idempotency)
- [ ] 2.2.1: Verify Docker Compose volume mapping
- [ ] 4.1.1: Update .env.example with warnings
- [ ] 4.1.2: Update apps/web/e2e/.env.example

### Phase 3: CI/CD
- [ ] 3.2.1: Add PostgreSQL service to main.yml
- [ ] 3.2.2: Add database setup step to main.yml
- [ ] 3.2.3: Add environment variables to main.yml
- [ ] 3.2.4: Test Cypress workflow in CI

### Phase 4: Documentation
- [ ] 4.2.1: Update implementation status in TEST_DATABASE_SECURITY.md
- [ ] 4.2.2: Add code references with line numbers
- [ ] 4.2.3: Add troubleshooting section
- [ ] 4.2.4: Update examples to match implementation

---

## 📝 Notes for Execution

1. **Commit Strategy**:
   - Phase 1: Single commit "feat: add test database prefix enforcement"
   - Phase 2: Single commit "feat: add idempotent Docker test DB init"
   - Phase 3: Single commit "ci: add PostgreSQL service to Cypress workflow"
   - Phase 4: Single commit "docs: update test database security docs"

2. **Testing Between Phases**:
   - After Phase 1: Run full E2E test suite
   - After Phase 2: Test Docker container initialization
   - After Phase 3: Trigger CI workflow manually
   - After Phase 4: Review docs for accuracy

3. **Rollback Plan**:
   - If ensureTestPrefix causes issues: Revert Phase 1 commit
   - If Docker script causes issues: Delete 02-init-test-db.sql and rebuild container
   - If CI fails: Revert Phase 3 commit

4. **Communication**:
   - After Phase 1: Notify team about new test DB security enforcement
   - After Phase 2: Document Docker container recreation steps
   - After Phase 3: Confirm CI green before merging
   - After Phase 4: Share updated security docs

---

## 🎯 Success Metrics

**Security**:
- ✅ Zero production database access during tests
- ✅ Automatic prefix enforcement with fallbacks
- ✅ Sensitive data masked in all logs (single log point, no duplication)

**Reliability**:
- ✅ Idempotent Docker initialization (verified with `docker-compose down -v` twice)
- ✅ Cypress tests have stable database
- ✅ No manual database setup required

**Maintainability**:
- ✅ Unit tests prevent regression (with proper module cache clearing)
- ✅ Documentation matches implementation
- ✅ Concise security comments maintain readability

---

## 📝 Review Refinements Applied

This plan was refined based on detailed code review to address:

1. **Logging Deduplication**:
   - `ensureTestPrefix()` returns silently
   - Only `init()` logs transformations (single point of logging)
   - Prevents console noise from duplicate messages

2. **Unit Test Cache Management**:
   - `jest.resetModules()` in beforeEach/afterEach
   - Dynamic imports with `await import()` to force fresh module load
   - Ensures ensureTestPrefix logic re-executes for each test
   - No need to export helper functions separately

3. **Docker Idempotency Verification**:
   - Added explicit `docker-compose down -v` test twice in checklist
   - Confirms scripts handle both first-run and rerun scenarios
   - Preserves existing example_user grants (no collisions)

4. **CI PostgreSQL Client**:
   - Confirmed postgresql-client included in ubuntu-latest by default
   - No need for `sudo apt-get install postgresql-client`
   - Reduces CI workflow complexity

5. **Security Comments**:
   - Kept concise (3 lines max for main comment)
   - Brief 1-line comment in init() referencing helper
   - Maintains readability while providing guardrails

6. **Docker Volume Mount**:
   - Added missing volume mount to docker-compose.yml
   - `./docker/postgres-init:/docker-entrypoint-initdb.d`
   - Required for init scripts to execute

**Plan Status**: ✅ **Ready for execution by agents**
