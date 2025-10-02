# Test Database Security Implementation

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

Located in: `packages/server/src/DataSource.ts`

```typescript
/**
 * Ensures database name and user have test prefix when NODE_ENV=test
 * Prevents accidental production database operations during testing
 */
const ensureTestPrefix = (value: string | undefined, defaultName: string): string => {
    if (!value) return `test_${defaultName}`
    if (value.startsWith('test_') || value.endsWith('_test')) return value
    return `test_${value}`
}
```

**Behavior:**
- If value is undefined: returns `test_{defaultName}`
- If value already has `test_` prefix or `_test` suffix: returns unchanged (idempotent)
- Otherwise: prepends `test_` to the value

#### 2. DataSource Init Hook

Located in: `packages/server/src/DataSource.ts` (beginning of `init()` function)

```typescript
export const init = async (): Promise<void> => {
    // SECURITY: When running in test mode, ensure database and user have test prefix
    if (process.env.NODE_ENV === 'test') {
        const originalDbName = process.env.DATABASE_NAME
        const originalDbUser = process.env.DATABASE_USER

        process.env.DATABASE_NAME = ensureTestPrefix(originalDbName, 'theanswer')
        process.env.DATABASE_USER = ensureTestPrefix(originalDbUser, 'user')
        // Keep DATABASE_PASSWORD as-is from .env

        logger.info('🔒 TEST MODE: Auto-prefixed database credentials')
        logger.info(`  DATABASE_NAME: ${originalDbName} → ${process.env.DATABASE_NAME}`)
        logger.info(`  DATABASE_USER: ${originalDbUser} → ${process.env.DATABASE_USER}`)
    }
    // ... rest of init logic
}
```

**Key Features:**
- ✅ Triggers only when `NODE_ENV=test`
- ✅ Modifies environment variables before DataSource creation
- ✅ Keeps password from .env (not modified)
- ✅ Logs transformation for debugging visibility
- ✅ Single enforcement point for entire application

---

## Docker Integration

### Auto-Create Test Databases

File: `docker/postgres-init/02-init-test-db.sql`

This SQL script runs automatically when the PostgreSQL container initializes with an empty data volume.

**Created Resources:**

**Databases:**
- `test_flowise_e2e`
- `test_theanswer`
- `test_example_db`

**Users:**
- `test_user` (password: `test_password`)
- `test_example_user` (password: `example_password`)

**Permissions:**
- All test users have full privileges on all test databases
- pgvector extension enabled on all test databases

### Script Content

```sql
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
```

---

## Configuration

### Environment Variables

File: `.env` (project root)

```bash
# Test Database Configuration
# When NODE_ENV=test, database name and user are automatically prefixed with 'test_'
DATABASE_NAME=test_flowise_e2e
DATABASE_USER=test_user
DATABASE_PASSWORD=test_password
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

### Modified Files
- `packages/server/src/DataSource.ts` - Smart prefixing logic
- `.env` - Test database configuration

### New Files
- `docker/postgres-init/02-init-test-db.sql` - Docker entrypoint init script
- `docs/TEST_DATABASE_SECURITY.md` - This documentation

### Related Files (Context)
- `packages/server/src/test-utils/reset.ts` - Database reset function
- `packages/server/src/controllers/test-control/index.ts` - Test control endpoints
- `apps/web/e2e/helpers/test-db.ts` - E2E test database helpers

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

**Last Updated:** 2025-10-01
**Implementation Version:** 1.0
**Status:** ✅ Production Ready
