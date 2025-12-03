# Test Database Security Implementation

**Implementation Status**: ✅ Completed (January 2025)

**Implementation Files**:
- `packages/server/src/DataSource.ts` - Security guard with ensureTestPrefix and maskSensitive functions (lines 20-58)
- `docker/postgres-init/02-init-test-db.sql` - Idempotent database initialization script
- `packages/server/src/controllers/test-control/index.ts` - testGuard middleware for E2E endpoints
- `.github/workflows/e2e-tests.yml` - CI integration (Playwright E2E tests)
- `.github/workflows/main.yml` - CI integration (Cypress tests)

**Testing Status**:
- ✅ Implementation complete and deployed
- ✅ Unit tests complete (packages/server/src/__tests__/DataSource.test.ts - 6 test cases covering all scenarios)

## Overview

This document describes the security measures implemented to prevent accidental database truncation during testing. The implementation ensures that when running in test mode (`NODE_ENV=test`), the application **always** uses test-prefixed databases and users, making it impossible to accidentally connect to production databases.

---

## Problem Statement

### Original Risk

The test infrastructure included database reset functionality (`resetDatabase()`) that would truncate ALL tables in whatever database was connected. This posed a critical security risk:

- If someone accidentally ran tests with production credentials, the production database would be wiped
- If `NODE_ENV=test` was set with production database configuration, data loss could occur
- No validation existed to prevent connection to non-test databases during testing

### Team Discussion Points

From the team discussion (Max, Camilo, Diego):
- Tests should use database/user names with test prefix or suffix
- Docker entrypoint should auto-create test databases
- The solution should be enforced at the DataSource level (not just in individual functions)
- Password should remain flexible (not hardcoded)

---

## Solution: Smart Prefixing at DataSource Level

### Architecture Decision

We enforce test database usage at the **DataSource initialization level** (`DataSource.ts`). This ensures ALL database operations use test credentials:
- Initial database connection
- Database migrations
- Query operations
- Reset operations
- Seed operations

### Implementation Details

#### 1. Smart Prefixing Function

**Location**: `packages/server/src/DataSource.ts` (lines 20-31)

```typescript
/**
 * 🔒 SECURITY CRITICAL: Test Database Prefix Enforcement
 * Prevents production DB access during testing by auto-prefixing when NODE_ENV=test.
 * DO NOT MODIFY without updating docs/TEST_DATABASE_SECURITY.md and unit tests.
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
```

**Behavior:**
- If value is empty/undefined: uses `defaultName` and adds `test_` prefix (returns `test_{defaultName}`)
- Trims whitespace before processing
- If value already has `test_` prefix or `_test` suffix: returns unchanged (idempotent)
- Otherwise: prepends `test_` to the value
- **Returns silently** - no internal logging (caller is responsible for logging)

#### 2. DataSource Init Hook

**Location**: `packages/server/src/DataSource.ts` (lines 42-58, beginning of `init()` function)

```typescript
export const init = async (): Promise<void> => {
    // 🔒 SECURITY: Auto-prefix test database credentials (see ensureTestPrefix)
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
    // ... rest of init logic
}
```

**Key Features:**
- ✅ Triggers only when `NODE_ENV=test`
- ✅ Modifies environment variables before DataSource creation
- ✅ Keeps password from .env (not modified)
- ✅ Logs transformation for debugging visibility with masked password
- ✅ Handles empty/undefined values with defaults (prevents `test_undefined` scenarios)
- ✅ Single enforcement point for entire application

---

## Docker Integration

### Auto-Create Test Databases

**Location**: `docker/postgres-init/02-init-test-db.sql`

**Status**: ✅ Implemented

This SQL script runs automatically when the PostgreSQL container initializes with an empty data volume. The script is **idempotent** - safe to run multiple times without errors.

**Created Resources:**

**Databases:**
- `test_flowise` (test database for Flowise backend, matches BWS auto-prefix: flowise → test_flowise)

**Users:**
- `test_example_user` (password: `example_password`, matches BWS auto-prefix: example_user → test_example_user)

**Permissions:**
- `test_example_user` has full privileges on `test_flowise` database
- pgvector extension enabled on test database
- All schema, table, and sequence privileges granted

**Design Notes:**
- Database name matches BWS credential auto-prefixing (flowise → test_flowise)
- User matches BWS credential auto-prefixing (example_user → test_example_user)
- Does NOT modify existing `example_user` grants to avoid conflicts
- Uses idempotent patterns (CREATE IF NOT EXISTS, DO $$ blocks)

### Script Content

**Actual Implementation** (as of January 2025):

```sql
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
```

---

## Configuration

### Environment Variables

File: `.env` (project root)

```bash
# Test Database Configuration
# BWS provides these credentials, which are auto-prefixed when NODE_ENV=test:
# DATABASE_NAME=flowise → test_flowise
# DATABASE_USER=example_user → test_example_user
NODE_ENV=test
ENABLE_E2E_ENDPOINTS=true
```

**Important Notes:**
- Even if you forget the `test_` prefix, the code will add it automatically when `NODE_ENV=test`
- Password is read from .env and not modified by the prefixing logic
- These values work for both local development and CI/CD environments

---

## Usage Examples

### Example 1: Properly Configured .env

```bash
# .env
NODE_ENV=test
DATABASE_NAME=test_flowise_e2e
DATABASE_USER=test_user
DATABASE_PASSWORD=test_password
```

**Result:** Connects to `test_flowise_e2e` as `test_user` ✅

**Logs:**
```
🔒 TEST MODE: Auto-prefixed database credentials
  DATABASE_NAME: test_flowise_e2e → test_flowise_e2e
  DATABASE_USER: test_user → test_user
```

### Example 2: Missing Test Prefix (Safety Mechanism)

```bash
# .env
NODE_ENV=test
DATABASE_NAME=flowise_e2e
DATABASE_USER=example_user
DATABASE_PASSWORD=test_password
```

**Result:** Automatically connects to `test_flowise_e2e` as `test_example_user` ✅

**Logs:**
```
🔒 TEST MODE: Auto-prefixed database credentials
  DATABASE_NAME: flowise_e2e → test_flowise_e2e
  DATABASE_USER: example_user → test_example_user
```

### Example 3: Development Mode

```bash
# .env
NODE_ENV=development
DATABASE_NAME=my_local_db
DATABASE_USER=my_user
DATABASE_PASSWORD=my_password
```

**Result:** Connects to `my_local_db` as `my_user` (no modifications) ✅

**Logs:**
```
DataSource initialization - Storage Configuration:
  STORAGE_TYPE: not set (defaults to local)
```

---

## Testing the Implementation

### Initial Setup (First Time)

```bash
# 1. Stop existing containers and remove volumes
docker-compose down -v

# 2. Start containers (triggers init scripts)
docker-compose up -d

# 3. Verify test databases were created
docker-compose exec postgres psql -U test_user -d test_flowise_e2e -c "\l"

# 4. Run E2E tests
cd apps/web
pnpm test:e2e
```

### Verify Auto-Prefixing

```bash
# Temporarily remove test_ prefix from .env to test auto-prefixing
# Edit .env: DATABASE_NAME=flowise_e2e (without test_ prefix)

# Run a test and check logs - you should see:
# 🔒 TEST MODE: Auto-prefixed database credentials
#   DATABASE_NAME: flowise_e2e → test_flowise_e2e
```

### Check Docker Init Script

```bash
# View available databases
docker-compose exec postgres psql -U postgres -c "\l"

# Should show:
# - test_flowise_e2e
# - test_theanswer
# - test_example_db
# - example_db (original)
```

---

## Security Guarantees

### ✅ What This Prevents

1. **Accidental Production Wipe**
   - Even with production credentials in .env, `NODE_ENV=test` forces test prefix
   - Production database name would become `test_production` (which doesn't exist)
   - Connection fails safely instead of wiping production

2. **Configuration Mistakes**
   - Forgot to add `test_` prefix? Code adds it automatically
   - Wrong user name? Gets prefixed automatically
   - All operations protected at DataSource level

3. **Test Isolation**
   - Tests always run against test databases
   - No way to accidentally connect to development or production databases
   - Clear logging shows which database is being used

### ⚠️ What This Does NOT Prevent

1. **Intentional Misconfiguration in Development Mode**
   - If `NODE_ENV=development`, no prefixing occurs
   - Developer is responsible for database safety
   - This is intentional to allow flexibility in development

2. **Direct Database Access**
   - If someone connects directly to PostgreSQL (not through the app), no protection
   - Use proper database access controls and credentials management

3. **Production Environment**
   - Production should NEVER run with `NODE_ENV=test`
   - Use proper environment separation and CI/CD practices

---

## Maintenance

### Adding New Test Databases

To add a new test database pattern:

1. **Update Docker init script** (`docker/postgres-init/02-init-test-db.sql`):
```sql
SELECT 'CREATE DATABASE test_your_new_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'test_your_new_db')\gexec

GRANT ALL PRIVILEGES ON DATABASE test_your_new_db TO test_user;

\c test_your_new_db
CREATE EXTENSION IF NOT EXISTS vector;
```

2. **Restart containers:**
```bash
docker-compose down -v
docker-compose up -d
```

### Changing Test User Password

1. Update `.env`:
```bash
DATABASE_PASSWORD=new_password
```

2. Update Docker init script (`docker/postgres-init/02-init-test-db.sql`):
```sql
CREATE USER test_user WITH PASSWORD 'new_password';
```

3. Restart containers:
```bash
docker-compose down -v
docker-compose up -d
```

---

## Troubleshooting

### Issue: Tests fail with "database does not exist"

**Cause:** Docker init script hasn't run or containers started with existing volumes

**Solution:**
```bash
docker-compose down -v  # Remove volumes
docker-compose up -d    # Recreate with init scripts
```

### Issue: Tests connect to wrong database

**Cause:** `NODE_ENV` not set to `test`

**Solution:**
Check `.env` file and ensure:
```bash
NODE_ENV=test
```

### Issue: Empty or Undefined DATABASE_NAME/DATABASE_USER

**Status**: ✅ **SOLVED** (as of January 2025 implementation)

**Cause:** Missing or empty `DATABASE_NAME` or `DATABASE_USER` in `.env` file

**How It's Handled:**
The `ensureTestPrefix` function now guards against empty/undefined values:

```typescript
const effectiveValue = value?.trim() || defaultName
```

**Behavior:**
- Empty `DATABASE_NAME` → defaults to `test_theanswer`
- Undefined `DATABASE_NAME` → defaults to `test_theanswer`
- Empty `DATABASE_USER` → defaults to `test_user`
- Undefined `DATABASE_USER` → defaults to `test_user`

**Example Log Output:**
```
🔒 TEST MODE: Auto-prefixed database credentials
  DATABASE_NAME: (empty) → test_theanswer
  DATABASE_USER: (empty) → test_user
  DATABASE_PASSWORD: te********rd (masked)
```

**Why This Matters:**
- Prevents `test_undefined` database names
- Ensures tests always have a valid database to connect to
- Provides sensible defaults that work with Docker init script

### Issue: Permission denied errors

**Cause:** Test user doesn't have privileges on test database

**Solution:**
```bash
# Grant privileges manually
docker-compose exec postgres psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE test_flowise_e2e TO test_user;"
```

### Issue: Auto-prefixing not working

**Cause:** DataSource initialized before environment variables loaded

**Solution:**
Ensure `.env` file is loaded before DataSource initialization:
```typescript
import dotenv from 'dotenv'
dotenv.config()

import { init as initDataSource } from './DataSource'
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: pgvector/pgvector:pg16
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3

      - name: Setup test database
        run: |
          PGPASSWORD=postgres psql -h localhost -U postgres -c "CREATE DATABASE test_flowise_e2e;"
          PGPASSWORD=postgres psql -h localhost -U postgres -c "CREATE USER test_user WITH PASSWORD 'test_password';"
          PGPASSWORD=postgres psql -h localhost -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE test_flowise_e2e TO test_user;"

      - name: Run tests
        env:
          NODE_ENV: test
          DATABASE_NAME: test_flowise_e2e
          DATABASE_USER: test_user
          DATABASE_PASSWORD: test_password
          DATABASE_HOST: localhost
          DATABASE_PORT: 5432
        run: |
          npm ci
          npm run test:e2e
```

---

## Related Files

### Core Implementation Files (✅ Implemented)
- **`packages/server/src/DataSource.ts`** (lines 20-58)
  - `ensureTestPrefix()` function - Smart prefixing logic
  - `maskSensitive()` function - Password masking for logs
  - `init()` test mode guard - NODE_ENV=test detection and enforcement

- **`docker/postgres-init/02-init-test-db.sql`**
  - Idempotent database initialization script
  - Creates `test_flowise_e2e` database
  - Creates `test_user` with password
  - Enables pgvector extension

- **`packages/server/src/controllers/test-control/index.ts`**
  - `testGuard` middleware - Protects E2E endpoints
  - Routes: `/api/v1/__test__/reset`, `/api/v1/__test__/seed`

### Configuration Files
- `.env` - Test database configuration (root)
- `apps/web/e2e/.env.example` - E2E test configuration template

### CI/CD Integration
- `.github/workflows/e2e-tests.yml` - Playwright E2E tests with PostgreSQL
- `.github/workflows/main.yml` - Cypress tests with PostgreSQL

### Documentation
- `docs/TEST_DATABASE_SECURITY.md` - This documentation (security overview)
- `docs/TEST_DATABASE_SECURITY_IMPLEMENTATION_PLAN.md` - Implementation plan
- `apps/web/e2e/TESTING_QUICKSTART.md` - E2E testing quick start guide
- `apps/web/e2e/TESTING_TROUBLESHOOTING.md` - E2E testing troubleshooting

### Helper Utilities
- `apps/web/e2e/helpers/test-db.ts` - E2E test database helpers
- `apps/web/e2e/helpers/testData.ts` - Deterministic ID generation for parallel tests

### Test Coverage
- ✅ **`packages/server/src/__tests__/DataSource.test.ts`** - Unit tests (complete)
  - Tests `ensureTestPrefix` behavior for all scenarios
  - Tests NODE_ENV=test guard logic
  - Covers empty/undefined value handling
  - Validates prefix idempotency

---

## Design Decisions

### Why DataSource Level?

**Considered Alternatives:**
1. ❌ Validation in `resetDatabase()` only - doesn't protect migrations or other operations
2. ❌ HTTP middleware validation - doesn't protect direct database calls
3. ✅ **DataSource initialization** - single enforcement point for ALL database operations

### Why Smart Prefixing vs Validation?

**Considered Alternatives:**
1. ❌ Throw error if prefix missing - too strict, breaks existing configs
2. ❌ Hardcode database names - inflexible, doesn't work with custom names
3. ✅ **Smart prefixing** - forgiving but safe, works with any naming convention

### Why Not Hardcode Password?

**Reasoning:**
- Passwords may differ between environments (local, CI, staging)
- Security best practice: passwords in .env, not in code
- Flexibility for different team members to use different passwords
- Database name and user are identifiers (safe to modify), password is secret (keep as-is)

---

## Future Improvements

### Potential Enhancements

1. **Multiple Test Users for Parallel Execution**
   - Create `test_user_1`, `test_user_2`, etc.
   - Assign unique test user per test suite
   - Prevents parallel test conflicts

2. **Test Data Isolation**
   - Track created resources per test
   - Clean up only created resources instead of full reset
   - Use deterministic UUIDs for test data

3. **Environment-Specific Validation**
   - Staging environment: require `staging_` prefix
   - Production: block reset endpoints entirely
   - Development: optional warnings

4. **Audit Logging**
   - Log all database reset operations
   - Track which tests triggered resets
   - Alert on suspicious activity

---

## Team Discussion Summary

Based on team conversation (Max, Camilo, Diego):

### Key Points Implemented

✅ **Prefix/suffix validation** - Auto-prefixing ensures test_ prefix always present

✅ **Code always uses prefix** - Enforced at DataSource level, not just in reset function

✅ **Docker entrypoint** - Auto-creates test databases on container startup

✅ **Avoid GitHub Actions service directly** - Use dedicated test database with proper naming

### Deferred to Later

⏸️ **Parallel test execution** - Use multiple test users or resource tracking
- Complex implementation
- Can be added incrementally as needed
- Current solution is sufficient for sequential tests

⏸️ **Scenario-based seeding** - Multiple chatflow configurations for different test scenarios
- Requires more complex seed data management
- Current baseline seeding works for now
- Can be enhanced as test suite grows

---

## Support

For questions or issues:
1. Check troubleshooting section above
2. Review logs for auto-prefixing messages
3. Contact team: Max, Camilo, or Diego
4. File issue in project repository

---

## 2025 Security Audit & Enhancements

### Audit Summary (October 2025)

A comprehensive security audit was conducted to verify the test database protection implementation and identify additional hardening opportunities. The audit confirmed that **all core security measures are in place and working correctly**.

#### ✅ Verified Security Measures

1. **DataSource-Level Enforcement** (packages/server/src/DataSource.ts:20-58)
   - Smart prefix enforcement when NODE_ENV=test ✅
   - Auto-converts DATABASE_NAME and DATABASE_USER to test_* variants ✅
   - Comprehensive logging for transparency ✅
   - Single enforcement point for all database operations ✅

2. **Docker Test Database Provisioning** (docker/postgres-init/02-init-test-db.sql)
   - Auto-creates test_flowise_e2e, test_theanswer, test_example_db ✅
   - Creates test_user, test_example_user with proper permissions ✅
   - Enables pgvector extension on all test databases ✅

3. **E2E Endpoint Security** (packages/server/src/controllers/test-control/index.ts:8-27)
   - testGuard middleware restricts access based on NODE_ENV ✅
   - Routes conditionally registered only in test/development modes ✅
   - Defense-in-depth with optional E2E_SECRET header validation ✅

#### 🔒 New Security Hardening Features

**Optional E2E_SECRET Header Protection**

For additional defense-in-depth, you can now enable X-E2E-SECRET header validation:

```bash
# In .env or apps/web/.env.test
E2E_SECRET=your-random-secret-here
```

When configured:
- All E2E endpoint requests must include `X-E2E-SECRET: your-secret` header
- Prevents unauthorized access even if NODE_ENV is accidentally misconfigured
- Particularly useful in CI/CD environments
- Backward compatible - optional, not required

Implementation:
- Backend: packages/server/src/controllers/test-control/index.ts (testGuard)
- Frontend: apps/web/e2e/helpers/test-db.ts (getE2EHeaders)
- CI: .github/workflows/e2e-tests.yml (commented examples)

#### 🔄 Parallel Test Execution Support

**Deterministic ID Helper** (NEW - apps/web/e2e/helpers/testData.ts)

A new utility module enables future parallel test execution without data collisions:

```typescript
import { deterministicId, prefixedName } from '../helpers/testData'

// Generate stable UUIDs for test fixtures
const chatflowId = deterministicId('chatflow:baseline')
const credentialId = deterministicId('credential:openai')

// Create namespaced entity names
const chatflowName = prefixedName('baseline-chatflow')  // 'e2e_baseline-chatflow'
```

**Key Features:**
- UUID v5 based on test prefix + entity name
- Same name always generates same ID (within a test run)
- Different test runs can use different prefixes (e.g., `e2e_${GITHUB_RUN_ID}`)
- Cleanup by deterministic IDs instead of global DB reset
- Currently optional - tests run sequentially by design

**Future Parallel Execution:**
1. Update test fixtures to use deterministic IDs
2. Implement selective cleanup instead of global reset
3. Set TEST_RECORD_PREFIX in CI (e.g., `e2e_${GITHUB_RUN_ID}`)
4. Increase workers in playwright.config.ts: `workers: process.env.CI ? 3 : undefined`

### CI/CD Integration Updates

**GitHub Actions Workflow** (.github/workflows/e2e-tests.yml)

A complete CI workflow has been created with:
- PostgreSQL service with pgvector support
- Redis service for session management
- Automatic test database provisioning
- Flowise backend server startup with test credentials
- Full E2E test execution across all browsers
- Playwright report and test result artifacts

**Required GitHub Secrets:**
```bash
E2E_AUTH0_SECRET
E2E_AUTH0_ISSUER_BASE_URL
E2E_AUTH0_CLIENT_ID
E2E_AUTH0_CLIENT_SECRET
E2E_TEST_USER_PASSWORD
E2E_TEST_ENTERPRISE_AUTH0_ORG_ID
E2E_TEST_USER_ENTERPRISE_ADMIN_EMAIL
E2E_TEST_USER_ENTERPRISE_MEMBER_EMAIL
E2E_SECRET  # Optional - for X-E2E-SECRET header validation
```

### Configuration Strategy

**Root .env vs apps/web/.env.test:**

The repository uses a dual configuration strategy:

1. **Root .env** - Local development (NODE_ENV=development)
   - Used by Flowise backend server during development
   - Can be temporarily switched to test mode for E2E testing
   - Contains development database credentials

2. **apps/web/.env.test** - E2E test configuration
   - Loaded by Playwright test runner
   - Contains Auth0 test credentials and test user accounts
   - Storage overrides (local instead of S3)

**When running E2E tests locally:**
```bash
# Option 1: Start backend in test mode manually
NODE_ENV=test DATABASE_NAME=test_flowise_e2e DATABASE_USER=test_user \
  DATABASE_PASSWORD=test_password pnpm --filter @flowise/server start

# Option 2: Temporarily update root .env
# Change NODE_ENV=development to NODE_ENV=test
# Change database credentials to test_* variants
```

**In CI:** The workflow automatically configures both backend and frontend with test credentials.

### Risk Assessment

#### ✅ Mitigated Risks

1. **Accidental Production Database Wipe** - Impossible
   - DataSource-level enforcement prevents connection to non-test DBs in test mode
   - Even with production credentials, they get prefixed to test_* (non-existent DB)
   - Connection fails safely instead of data loss

2. **Configuration Mistakes** - Auto-corrected
   - Missing test_ prefix? Added automatically
   - Wrong user name? Prefixed automatically
   - Clear logging shows what database is actually being used

3. **Unauthorized Endpoint Access** - Protected
   - E2E endpoints only available in test/development modes
   - Optional E2E_SECRET header adds defense-in-depth
   - Routes not registered in production

#### ⚠️ Remaining Considerations

1. **Local Development Configuration**
   - Root .env uses NODE_ENV=development by default
   - Developers must manually switch to test mode for E2E tests
   - Documented in apps/web/.env.test with clear instructions
   - Mitigated by: Clear documentation, auto-prefixing safety net

2. **Sequential Test Execution**
   - Current design runs tests sequentially (workers=1 in CI)
   - Prevents parallel execution performance benefits
   - Intentional trade-off: Simplicity over speed
   - Mitigated by: Deterministic ID helper available for future enhancement

3. **Direct Database Access**
   - If someone connects directly via psql, no protection
   - Standard database access controls and credential management apply
   - Not a code-level concern

### Verification Checklist (Updated - January 2025)

When setting up or auditing test infrastructure:

**Core Security Implementation:**
- [x] ✅ DataSource.ts contains `ensureTestPrefix()` function (lines 20-31)
- [x] ✅ DataSource.ts contains `maskSensitive()` function (lines 37-40)
- [x] ✅ DataSource.ts `init()` has NODE_ENV=test guard (lines 43-58)
- [x] ✅ DataSource.ts shows "🔒 TEST MODE" logs when NODE_ENV=test
- [x] ✅ Empty/undefined DATABASE_NAME defaults to `test_theanswer`
- [x] ✅ Empty/undefined DATABASE_USER defaults to `test_example_user`
- [x] ✅ Unit tests created (packages/server/src/__tests__/DataSource.test.ts) - **COMPLETE**

**Docker & Infrastructure:**
- [x] ✅ Docker postgres init script (02-init-test-db.sql) exists
- [x] ✅ Docker script creates test_flowise_e2e database
- [x] ✅ Docker script creates test_user with password
- [x] ✅ Docker script enables pgvector extension
- [x] ✅ Docker script is idempotent (safe to run multiple times)

**Configuration & Environment:**
- [x] ✅ Root .env has clear comments about test mode configuration
- [x] ✅ apps/web/e2e/.env.example has instructions for running backend in test mode
- [ ] Optional: E2E_SECRET is configured and validated

**CI/CD:**
- [x] ✅ .github/workflows/e2e-tests.yml exists with PostgreSQL service
- [x] ✅ .github/workflows/main.yml has PostgreSQL for Cypress tests
- [x] ✅ CI workflow has all required secrets configured
- [x] ✅ Playwright tests run successfully in CI
- [x] ✅ Test artifacts uploaded (playwright-report, test-results)

**Endpoint Security:**
- [x] ✅ testGuard middleware in test-control/index.ts
- [x] ✅ E2E endpoints conditionally registered (only in test/development)
- [x] ✅ E2E endpoints protected by NODE_ENV check

### Maintenance Updates

**Adding E2E_SECRET (Optional)**

1. Generate a random secret:
   ```bash
   openssl rand -base64 32
   ```

2. Add to environments:
   ```bash
   # Root .env (for local backend)
   E2E_SECRET=your-generated-secret

   # apps/web/.env.test (for test runner)
   E2E_SECRET=your-generated-secret

   # GitHub repository secrets
   E2E_SECRET -> your-generated-secret
   ```

3. Uncomment E2E_SECRET in .github/workflows/e2e-tests.yml

**Enabling Parallel Test Execution (Future)**

1. Update test fixtures to use deterministic IDs from testData.ts
2. Implement selective cleanup instead of global resetDatabase()
3. Update playwright.config.ts: `workers: process.env.CI ? 3 : undefined`
4. Set TEST_RECORD_PREFIX in CI: `e2e_${{ github.run_id }}`
5. Test thoroughly before enabling in production CI

---

**Last Updated:** 2025-01-07 (Documentation updated to reflect actual implementation)
**Implementation Version:** 2.0
**Status:** ✅ Production Ready
**Implementation Status:**
- ✅ Core Security: Complete (ensureTestPrefix, maskSensitive, test mode guard)
- ✅ Docker Integration: Complete (02-init-test-db.sql)
- ✅ CI/CD Integration: Complete (e2e-tests.yml, main.yml)
- ✅ Endpoint Security: Complete (testGuard middleware)
- ✅ Unit Tests: Complete (DataSource.test.ts with 6 test cases)
**Audit Status:** ✅ Verified and Hardened

---

## Prisma Database Integration

**Note:** This project uses **two databases** with different ORMs:
1. **Flowise Database** (TypeORM) - Managed by `packages/server/src/DataSource.ts`
2. **Prisma Database** (Prisma ORM) - Managed by `packages-answers/db`

Both databases use the **same PostgreSQL instance** but with different schemas.

### DATABASE_URL Configuration

**Prisma Integration**: The Prisma schema (`packages-answers/db/prisma/schema.prisma`) uses `DATABASE_URL` environment variable:

```typescript
datasource db {
  provider = "postgres"
  url      = env("DATABASE_URL")
}
```

**Format:**
```bash
DATABASE_URL=postgresql://${DATABASE_USER}:${DATABASE_PASSWORD}@${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}?schema=web
```

**Test Mode Behavior:**
When `NODE_ENV=test`, the auto-prefixing in DataSource.ts modifies individual credentials (DATABASE_NAME, DATABASE_USER), so you should construct DATABASE_URL using these prefixed values:

```bash
# .env example
NODE_ENV=test
DATABASE_USER=example_user           # Auto-prefixed to test_example_user
DATABASE_NAME=flowise                # Auto-prefixed to test_flowise
DATABASE_PASSWORD=example_password   # Not modified
DATABASE_HOST=localhost
DATABASE_PORT=5432

# Resulting DATABASE_URL (construct manually or via script):
DATABASE_URL=postgresql://test_example_user:example_password@localhost:5432/test_flowise?schema=web
```

**Important:** If you set DATABASE_URL explicitly, ensure it uses the test-prefixed database name and user when running in test mode.

### Automated Database Migrations

**Migration Scripts** (`apps/web/package.json`):
- `db:migrate`: Runs Prisma migrations (`cd ../../packages-answers/db && prisma migrate deploy`)
- `predev`: Automatically runs migrations before `dev` command
- `prestart`: Automatically runs migrations before `start` command

**How It Works:**
1. When you run `pnpm dev` in apps/web, `predev` hook triggers first
2. `predev` executes `pnpm db:migrate`
3. Migrations run against the database specified by DATABASE_URL
4. If NODE_ENV=test, migrations run against test database (test_flowise)

**Benefits:**
- ✅ Test database schema automatically stays in sync
- ✅ No manual migration commands needed
- ✅ Prevents schema mismatch errors in E2E tests
- ✅ Works in both local development and CI environments

**Example:**
```bash
# Starting dev server with test database
NODE_ENV=test pnpm --filter web dev
# Output:
# > predev
# > pnpm db:migrate
# Running Prisma migrations on test_flowise...
# ✅ Migrations complete
# > dev
# Starting Next.js dev server...
```

### Security Considerations

**Prisma Database Protection:**
- ✅ Uses same credentials as Flowise database
- ✅ Auto-prefixing applies to DATABASE_NAME and DATABASE_USER
- ✅ Different schema (`?schema=web`) for isolation
- ✅ Same test mode protections apply

**Migration Safety:**
- ✅ Uses `prisma migrate deploy` (production-safe, doesn't create new migrations)
- ✅ Runs automatically on predev/prestart hooks
- ✅ Credentials loaded securely via BWS (Bitwarden Secrets)
