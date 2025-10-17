# E2E Testing Troubleshooting Guide

**Quick navigation:**
- [Database Connection Issues](#database-connection-issues)
- [Auth0 Authentication Failures](#auth0-authentication-failures)
- [Test Timeout Issues](#test-timeout-issues)
- [Local vs CI Differences](#local-vs-ci-differences)
- [Backend Server Issues](#backend-server-issues)
- [Performance Problems](#performance-problems)
- [Debug Commands & Tools](#debug-commands--tools)
- [Getting Help](#getting-help)

---

## Database Connection Issues

### 1. "role test_user does not exist"

**Symptoms:**
```
FATAL: role "test_user" does not exist
Error: connect ECONNREFUSED 127.0.0.1:5432
TypeORM connection failed during test setup
```

**Root Cause:**
Your local PostgreSQL server is running on port 5432 and intercepting connections intended for Docker's test database. The local PostgreSQL instance doesn't have the `test_user` role that our E2E tests expect.

**Diagnosis:**
Check what's actually running on port 5432:

```bash
lsof -i:5432
```

If you see TWO postgres processes, you have a conflict:
```
COMMAND     PID     USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME
postgres   1234     you    6u  IPv6 0xabc123      0t0  TCP *:5432 (LISTEN)  # Local
com.docker 5678     you   20u  IPv4 0xdef456      0t0  TCP *:5432 (LISTEN)  # Docker
```

**Solution A: Create test_user in Local PostgreSQL (Recommended for Local Dev)**

If you prefer using your local PostgreSQL for testing:

```bash
# Connect to your local PostgreSQL as superuser
psql -U postgres

# Create the test user
CREATE USER test_user WITH PASSWORD 'test_password';
CREATE USER test_example_user WITH PASSWORD 'example_password';

# Create test databases
CREATE DATABASE test_flowise_e2e;
CREATE DATABASE test_theanswer;
CREATE DATABASE test_example_db;

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE test_flowise_e2e TO test_user;
GRANT ALL PRIVILEGES ON DATABASE test_flowise_e2e TO test_example_user;
GRANT ALL PRIVILEGES ON DATABASE test_theanswer TO test_user;
GRANT ALL PRIVILEGES ON DATABASE test_theanswer TO test_example_user;
GRANT ALL PRIVILEGES ON DATABASE test_example_db TO test_user;
GRANT ALL PRIVILEGES ON DATABASE test_example_db TO test_example_user;

# Install pgvector (see next section if you get errors)
\c test_flowise_e2e
CREATE EXTENSION IF NOT EXISTS vector;
\c test_theanswer
CREATE EXTENSION IF NOT EXISTS vector;
\c test_example_db
CREATE EXTENSION IF NOT EXISTS vector;

\q
```

**Solution B: Stop Local PostgreSQL (Recommended for CI-like Environment)**

If you want to use Docker postgres exclusively:

```bash
# macOS (Homebrew)
brew services stop postgresql@16
# or
brew services stop postgresql@14

# macOS (manually check what's running)
pg_ctl -D /usr/local/var/postgres stop

# Linux (systemd)
sudo systemctl stop postgresql

# Verify port 5432 is free
lsof -i:5432  # Should show nothing or only Docker postgres
```

**Verification:**
```bash
# Test connection to the correct database
psql -h localhost -U test_user -d test_flowise_e2e -c "SELECT current_database(), current_user;"

# Expected output:
 current_database  | current_user
-------------------+--------------
 test_flowise_e2e  | test_user
```

---

### 2. pgvector extension not found

**Symptoms:**
```
ERROR: could not open extension control file "/usr/local/share/postgresql/extension/vector.control": No such file or directory
Migration failed: pgvector extension required for vector operations
```

**Root Cause:**
Your local PostgreSQL installation (typically PostgreSQL 14 or earlier via Homebrew) doesn't have the pgvector extension installed.

**Why Docker Doesn't Have This Issue:**
The Docker image `pgvector/pgvector:pg16` comes with pgvector pre-installed. This is why CI tests work but local tests fail.

**Solution: Install pgvector on macOS**

```bash
# Install pgvector via Homebrew
brew install pgvector

# Verify installation
ls /usr/local/share/postgresql@*/extension/vector.control

# If using PostgreSQL 16
ls /opt/homebrew/share/postgresql@16/extension/vector.control

# Connect and enable the extension
psql -U postgres -d test_flowise_e2e
CREATE EXTENSION IF NOT EXISTS vector;
\dx  # List extensions - you should see 'vector' in the list
\q
```

**Alternative: Use Docker PostgreSQL Instead**

If you encounter issues installing pgvector locally, use Docker's postgres:

```bash
# Stop local postgres
brew services stop postgresql@16

# Start Docker postgres (from project root)
docker-compose up -d postgres

# Verify Docker postgres is running
docker ps | grep postgres

# Connect to Docker postgres
psql -h localhost -U test_user -d test_flowise_e2e
# Password: test_password

# Check pgvector is available
\dx
\q
```

**Verification:**
```bash
# Check pgvector version
psql -U postgres -d test_flowise_e2e -c "SELECT vector_extension_version();"

# Expected output (or similar):
 vector_extension_version
--------------------------
 0.5.1
```

---

### 3. Database already exists errors

**Symptoms:**
```
ERROR: database "test_flowise_e2e" already exists
Docker init script fails on restart
```

**When This Happens:**
- Re-running Docker initialization scripts
- Switching between local and Docker postgres
- After failed migration attempts

**Solution: Drop and Recreate Test Databases**

```bash
# Using Docker postgres
docker exec -it flowise-postgres-test psql -U postgres

# Or using local postgres
psql -U postgres

# Drop and recreate databases
DROP DATABASE IF EXISTS test_flowise_e2e;
DROP DATABASE IF EXISTS test_theanswer;
DROP DATABASE IF EXISTS test_example_db;

CREATE DATABASE test_flowise_e2e;
CREATE DATABASE test_theanswer;
CREATE DATABASE test_example_db;

# Re-grant privileges
GRANT ALL PRIVILEGES ON DATABASE test_flowise_e2e TO test_user;
GRANT ALL PRIVILEGES ON DATABASE test_theanswer TO test_user;
GRANT ALL PRIVILEGES ON DATABASE test_example_db TO test_user;

\q
```

**⚠️ WARNING: NEVER DROP PRODUCTION DATABASES**

Never run `DROP DATABASE` commands against production databases. The test databases are specifically prefixed with `test_` to prevent accidental deletion of production data. Our safety checks ensure that:

1. Production databases never start with `test_`
2. `NODE_ENV=test` must be set to access test databases
3. E2E endpoints are disabled in production (`ENABLE_E2E_ENDPOINTS=false`)

**For Docker Compose Full Reset:**

```bash
# Stop and remove containers with volumes
docker-compose down -v

# Remove test database volume specifically
docker volume rm theanswer_postgres_test_data

# Restart - init scripts will run fresh
docker-compose up -d postgres
```

**Verification:**
```bash
# List databases and verify test_ prefix
psql -h localhost -U postgres -c "\l" | grep test_

# Expected output:
 test_flowise_e2e  | postgres | UTF8     | ...
 test_theanswer    | postgres | UTF8     | ...
 test_example_db   | postgres | UTF8     | ...
```

---

### 4. Wrong database connected in test mode

**Symptoms:**
```
WARNING: Test endpoint called but database name doesn't start with 'test_'
Connected to 'flowise' instead of 'test_flowise_e2e'
Production data appears in test results
```

**Root Cause:**
The backend's DataSource configuration is not detecting test mode correctly, or `NODE_ENV` is not set to `test`.

**How Auto-Prefixing Works:**

Our TypeORM DataSource automatically prefixes database names with `test_` when:
```typescript
// packages/server/src/DataSource.ts
const databaseName = process.env.NODE_ENV === 'test'
  ? `test_${process.env.DATABASE_NAME}`
  : process.env.DATABASE_NAME
```

**Verification Commands:**

```bash
# Check environment variable
echo $NODE_ENV
# Should output: test

# Check backend startup logs for test mode indicator
tail -f /tmp/flowise-test-backend.log | grep "TEST MODE"

# Expected log output:
🔒 TEST MODE: Database prefixed to 'test_flowise_e2e'
🔒 TEST MODE: E2E endpoints enabled
```

**Solution: Ensure NODE_ENV=test**

```bash
# When starting backend for E2E tests
NODE_ENV=test pnpm --filter @flowise/server start

# Or set in your shell session
export NODE_ENV=test
pnpm --filter @flowise/server start

# Verify with database query
psql -h localhost -U test_user -d test_flowise_e2e -c "SELECT current_database();"
# Should return: test_flowise_e2e (not flowise)
```

**Emergency: If Production Database Was Accessed**

If you accidentally connected to production during testing:

1. **Stop all test processes immediately**
2. Check production data integrity:
   ```bash
   psql -h localhost -U postgres -d flowise
   # Review recent records, check for test data pollution
   ```
3. Restore from backup if test data was written
4. Review `.env` and `.env.test` to prevent future incidents
5. Consider enabling `E2E_SECRET` for additional protection

**Verification:**
```bash
# Query the test control endpoint to verify database
curl -X GET http://localhost:4000/api/v1/__test__/status

# Expected response:
{
  "status": "ok",
  "database": "test_flowise_e2e",
  "nodeEnv": "test"
}
```

---

## Auth0 Authentication Failures

### 1. Organization selector not appearing

**Symptoms:**
```
Test timeout waiting for organization selector
Error: Locator for organization input not found after 10s
Auth flow stuck at organization selection screen
```

**Common Causes:**

1. **Wrong `TEST_ENTERPRISE_AUTH0_ORG_ID` in `.env.test`**
   - The organization ID must match exactly (e.g., `org_abc123xyz`)
   - Case-sensitive - `Org_ABC` ≠ `org_abc`

2. **User not added to organization in Auth0**
   - Test user exists but isn't a member of the organization
   - User invitation pending/not accepted

3. **Organization picker HTML structure changed**
   - Auth0 updated their login UI
   - CSS classes or form structure changed

**Diagnosis Steps:**

```bash
# 1. Verify organization ID in Auth0 Dashboard
# Go to: Auth0 Dashboard > Organizations > [Your Org] > Settings
# Copy the Organization ID (starts with org_)

# 2. Check .env.test has correct value
grep TEST_ENTERPRISE_AUTH0_ORG_ID apps/web/.env.test

# 3. Verify user membership
# Auth0 Dashboard > Organizations > [Your Org] > Members
# Ensure test user email appears in the list

# 4. Run test in UI mode to see what's happening
cd apps/web
pnpm test:e2e:ui

# 5. Check browser console for Auth0 errors
# Look for: "User is not a member of organization"
```

**Solutions:**

**Solution A: Add User to Organization (Most Common)**

1. Go to Auth0 Dashboard > Organizations > Your Organization
2. Click "Members" tab
3. Click "Add Members"
4. Search for test user email
5. Add user with appropriate role
6. Save changes

**Solution B: Fix Organization ID**

```bash
# Get the exact organization ID from Auth0 Dashboard
# Update .env.test
cd apps/web
nano .env.test

# Change line:
TEST_ENTERPRISE_AUTH0_ORG_ID=org_correct_id_here
TEST_ENTERPRISE_ORG_NAME=YourOrgDisplayName

# Save and retry test
pnpm test:e2e:auth
```

**Solution C: Debug Selector (If Auth0 UI Changed)**

Run test in headed mode to see the actual HTML:

```bash
# Run with browser visible
pnpm test:e2e:headed tests/auth.spec.ts

# Take screenshot at organization selection step
# Update selectors in apps/web/e2e/helpers/auth.ts if needed
```

Current selector logic:
```typescript
// Looks for hidden input with organization value
const orgInput = page.locator(`input[value="${orgId}"]`)

// Fallback: Look for button with organization name
const orgButton = page.getByRole('button', { name: orgName })
```

**Verification:**
```bash
# Test authentication flow
cd apps/web
pnpm test:e2e:auth

# Should see:
✅ Login with admin user
✅ Organization selected: local
✅ Redirected to dashboard
```

---

### 2. Login credentials rejected

**Symptoms:**
```
Auth0 shows: "Wrong email or password"
Test fails with: Error: Could not complete login
Unable to authenticate test user
```

**Diagnosis Checklist:**

```bash
# 1. Verify TEST_USER_PASSWORD in .env.test
grep TEST_USER_PASSWORD apps/web/.env.test

# 2. Verify test user exists in Auth0
# Auth0 Dashboard > User Management > Users
# Search for: TEST_USER_ENTERPRISE_ADMIN_EMAIL value

# 3. Check for account lockout
# Auth0 Dashboard > Users > [Test User] > Devices
# Look for: "Account locked" or "Suspicious login attempts"

# 4. Verify password hasn't expired
# Auth0 Dashboard > Security > Password policies
# Check if forced password rotation is enabled

# 5. Test login manually
# Open browser to: http://localhost:3000
# Try logging in with test credentials manually
```

**Common Solutions:**

**Reset Test User Password:**

```bash
# Option 1: Via Auth0 Dashboard
# 1. Go to User Management > Users
# 2. Find test user
# 3. Click "..." menu > Reset Password
# 4. Set new password
# 5. Disable "Require password change"
# 6. Update .env.test with new password

# Option 2: Via Auth0 Management API (if automated)
curl -X PATCH https://YOUR_DOMAIN.auth0.com/api/v2/users/USER_ID \
  -H "Authorization: Bearer MGMT_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "password": "new_test_password",
    "connection": "Username-Password-Authentication"
  }'
```

**Unlock Locked Account:**

```bash
# Via Auth0 Dashboard
# 1. User Management > Users > [Test User]
# 2. Scroll to "Multifactor" section
# 3. Click "Unblock User" if account is locked
# 4. Clear failed login attempts
```

**Check Connection Type:**

```bash
# Ensure test user is in correct database connection
# Auth0 Dashboard > Authentication > Database
# Verify connection name matches what test expects
# Default: "Username-Password-Authentication"
```

**Verification:**
```bash
# Test login with curl
curl -X POST https://YOUR_DOMAIN.auth0.com/oauth/token \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "password",
    "username": "test@example.com",
    "password": "test_password",
    "client_id": "YOUR_CLIENT_ID",
    "client_secret": "YOUR_CLIENT_SECRET",
    "scope": "openid profile email"
  }'

# Should return access_token if credentials are valid
```

---

### 3. Session storage issues

**Symptoms:**
```
Test uses old/cached authentication session
User shown as different role than expected
Logout doesn't clear session properly
```

**Where Auth Sessions Are Cached:**

```
apps/web/e2e/.auth/
└── user.json          # Stored authentication state
```

This file contains:
- Cookies
- Local storage data
- Session tokens
- Organization context

**When to Delete Cached Sessions:**

1. **After changing test user credentials**
2. **After changing organization membership**
3. **When seeing stale permission data**
4. **After Auth0 configuration changes**
5. **When switching between test environments**

**Solution: Clear Auth Cache**

```bash
# Delete cached auth state
rm apps/web/e2e/.auth/user.json

# Run auth setup to regenerate
cd apps/web
pnpm test:e2e tests/auth.setup.ts

# Or run full test suite (setup runs first)
pnpm test:e2e
```

**Force Fresh Login in Tests:**

```typescript
// In your test file
import { loginWithTestUser } from '../helpers/auth'

test('test with fresh login', async ({ page }) => {
  // Pass true as third parameter to force fresh login
  await loginWithTestUser(page, 'admin', true)  // Clears cookies first

  // Test continues with fresh session
})
```

**Manual Session Clearing:**

```bash
# Clear all Playwright storage state
rm -rf apps/web/e2e/.auth/

# Clear browser cache (if using headed mode)
# In browser: DevTools > Application > Clear storage > Clear site data

# Restart tests from clean state
pnpm test:e2e:auth
```

**Verification:**
```bash
# Check auth state file contents
cat apps/web/e2e/.auth/user.json | jq '.cookies[] | select(.name | contains("auth0"))'

# Should show fresh cookies with recent expires timestamp
```

---

## Test Timeout Issues

### 1. Playwright timeout errors

**Symptoms:**
```
TimeoutError: locator.click: Timeout 30000ms exceeded
Test exceeded timeout of 60000ms
Navigation timeout of 30000ms exceeded
```

**Default Timeouts:**

```typescript
// playwright.config.ts default values:
{
  timeout: 30000,           // 30s per test action
  navigationTimeout: 30000, // 30s for page.goto()
  expect: {
    timeout: 5000           // 5s for assertions
  }
}
```

**Solution: Increase Timeouts for Slow CI**

**Option 1: Per-Test Timeout Override**

```typescript
import { test, expect } from '@playwright/test'

// Increase timeout for specific slow test
test('slow database operation', async ({ page }) => {
  test.setTimeout(120000)  // 2 minutes for this test only

  await resetAndSeed({ /* large dataset */ })
  // ... rest of test
})
```

**Option 2: Per-Action Timeout**

```typescript
// Wait longer for specific element
await expect(page.locator('[data-testid="loading"]'))
  .toBeVisible({ timeout: 60000 })  // 60s timeout

// Navigation with custom timeout
await page.goto('/dashboard', { timeout: 45000 })  // 45s timeout

// Click with retry timeout
await page.click('button', { timeout: 10000 })  // 10s timeout
```

**Option 3: Global Config (CI Only)**

```typescript
// playwright.config.ts
export default defineConfig({
  timeout: process.env.CI ? 90000 : 30000,  // 90s in CI, 30s locally

  use: {
    navigationTimeout: process.env.CI ? 60000 : 30000,
    actionTimeout: process.env.CI ? 45000 : 30000,
  }
})
```

**When to Use page.waitForTimeout() vs expect()**

```typescript
// ❌ BAD: Arbitrary wait (flaky, wastes time)
await page.waitForTimeout(5000)  // Always waits 5s even if ready sooner

// ✅ GOOD: Wait for specific condition
await expect(page.locator('.modal')).toBeVisible()  // Returns as soon as visible

// ❌ BAD: Waiting for loading to disappear with timeout
await page.waitForTimeout(3000)  // Hope loading is done by then

// ✅ GOOD: Wait for loading state to resolve
await page.waitForLoadState('networkidle')
await expect(page.locator('.loading-spinner')).toBeHidden()

// ⚠️ ACCEPTABLE: Waiting for animation to complete (last resort)
await page.click('button')
await page.waitForTimeout(300)  // Wait for CSS animation
// Better: Use page.waitForSelector with state: 'visible'
```

**Verification:**
```bash
# Run test with --timeout flag
pnpm exec playwright test --timeout=120000

# Check test execution time in report
pnpm test:e2e:report
# Look for: Duration column in test results
```

---

### 2. Backend startup timeout

**Symptoms:**
```
Error: Backend server not ready after 60s
Connection refused: http://localhost:4000/api/v1/ping
Tests start before backend migrations complete
```

**How Long Backend Should Take:**

- **Locally**: <10 seconds (SSD, M1/M2 Mac)
- **CI (GitHub Actions)**: 20-30 seconds
- **Slow CI (constrained resources)**: Up to 60 seconds

**Diagnosis: Check If Backend Is Ready**

```bash
# Manual health check
curl http://localhost:4000/api/v1/ping

# Expected response:
{"status":"ok","timestamp":"2025-01-15T10:30:00.000Z"}

# If connection refused:
curl: (7) Failed to connect to localhost port 4000: Connection refused

# Check if backend process is running
lsof -i:4000
# Should show: node process listening on port 4000

# Check backend logs
tail -f /tmp/flowise-test-backend.log
```

**Common Causes:**

1. **Database connection hanging** (see Database Connection Issues)
2. **Migrations not run** (backend waits for migrations to complete)
3. **Missing environment variables** (backend exits silently)
4. **Port 4000 already in use** (backend fails to bind)

**Solution: Increase Backend Startup Wait Time**

**In CI Workflow (`.github/workflows/e2e-tests.yml`):**

```yaml
- name: Start Flowise backend server
  run: |
    pnpm --filter @flowise/server start &
    echo "Waiting for backend to be ready..."
    timeout 120 bash -c 'until curl -f http://localhost:4000/api/v1/ping; do sleep 2; done'
    # Changed from 60s to 120s ──────┘
    echo "Backend server is ready"
```

**In Playwright Config (Local Development):**

```typescript
// playwright.config.ts
{
  webServer: [
    {
      command: 'NODE_ENV=test pnpm --filter @flowise/server start',
      url: 'http://localhost:4000/api/v1/ping',
      timeout: 120000,  // 2 minutes for backend startup
      reuseExistingServer: !process.env.CI
    },
    {
      command: 'pnpm --filter @flowise/web dev',
      url: 'http://localhost:3000',
      timeout: 120000,  // 2 minutes for frontend
      reuseExistingServer: !process.env.CI
    }
  ]
}
```

**Debug Backend Startup:**

```bash
# Start backend manually to see errors
cd packages/server
NODE_ENV=test DATABASE_NAME=flowise_e2e pnpm start

# Watch for:
# - "🔒 TEST MODE: Database prefixed..."
# - "✅ Database connected: test_flowise_e2e"
# - "🚀 Server listening on port 4000"

# Check migration status
pnpm typeorm migration:show

# Run migrations if needed
pnpm typeorm migration:run
```

**Verification:**
```bash
# Test full startup sequence
time curl --retry 30 --retry-delay 2 --retry-connrefused http://localhost:4000/api/v1/ping

# Should output:
# real    0m15.234s  (startup time)
# {"status":"ok"}
```

---

### 3. Database seed/reset timeouts

**Symptoms:**
```
Test timeout during resetAndSeed() call
POST /api/v1/__test__/reset takes >30s
Large scenario seeding never completes
```

**Typical Seed Times:**

- **Empty reset**: 1-2 seconds
- **Basic scenario** (1 chatflow, 2 credentials): 3-5 seconds
- **Complex scenario** (10 chatflows, 20 credentials): 10-15 seconds
- **Very large dataset** (100+ records): 20-30 seconds

**If Seed Takes >30 Seconds, Something Is Wrong**

**Diagnosis:**

```bash
# Test reset endpoint manually with timing
time curl -X POST http://localhost:4000/api/v1/__test__/reset \
  -H "Content-Type: application/json"

# Should complete in <5s:
# real    0m2.156s

# Test seed endpoint with basic payload
time curl -X POST http://localhost:4000/api/v1/__test__/seed \
  -H "Content-Type: application/json" \
  -d '{
    "user": {
      "email": "test@example.com",
      "organization": {"auth0Id": "org_123", "name": "Test Org"}
    }
  }'

# Should complete in <5s:
# real    0m3.421s
```

**Common Causes:**

1. **Database connection slow** (check network latency)
2. **Too many credentials being created** (reduce test data)
3. **Slow migrations** (optimize migration scripts)
4. **Foreign key constraint checks** (can slow down DELETE operations)

**Solution: Optimize Seed Data**

```typescript
// ❌ BAD: Creating unnecessary test data
await resetAndSeed({
  credentials: {
    openai: { assigned: true },
    jira: { create: true },    // Created but not used
    slack: { create: true },   // Created but not used
    notion: { create: true },  // Created but not used
    github: { create: true },  // Created but not used
    // ... 10 more unused credentials
  }
})

// ✅ GOOD: Create only what you need
await resetAndSeed({
  credentials: {
    openai: { assigned: true },  // Only create what the test needs
    jira: { create: false }      // Explicitly skip unused credentials
  }
})
```

**Solution: Use resetOnly() for Minimal Tests**

```typescript
// If test doesn't need any seed data:
test.beforeEach(async ({ page }) => {
  await resetOnly()  // Fast: only clears database

  // Test with empty database
  await loginWithTestUser(page, 'admin')
  // ...
})
```

**Solution: Use seedScenario() for Predefined Data**

```typescript
// Predefined scenarios are optimized for speed
test.beforeEach(async ({ page }) => {
  await resetOnly()
  await loginWithTestUser(page, 'admin')

  // Fast: server-side optimized seeding
  await seedScenario('user-with-openai')
})
```

**Increase Timeout for Large Seeds:**

```typescript
test.beforeEach(async ({ page }) => {
  test.setTimeout(120000)  // 2 minutes for slow seed

  await resetAndSeed({
    // Large dataset
    credentials: { /* many credentials */ }
  })
})
```

**Verification:**
```bash
# Profile seed operation
cd apps/web
node -e "
const { resetAndSeed } = require('./e2e/helpers/database');
console.time('seed');
resetAndSeed({
  credentials: { openai: { assigned: true }}
}).then(() => {
  console.timeEnd('seed');
  process.exit(0);
});
"

# Should output:
# seed: 3421ms  (acceptable)
# NOT: seed: 45000ms  (too slow)
```

---

## Local vs CI Differences

### 1. Local PostgreSQL vs GitHub Actions service containers

**Key Differences:**

| Aspect | Local Development | GitHub Actions CI |
|--------|------------------|-------------------|
| PostgreSQL | May have local postgres on port 5432 | Fresh postgres service container |
| Port Conflicts | Common (local postgres conflicts) | Never (clean VM each run) |
| pgvector | Must install manually | Pre-installed in pgvector/pgvector:pg16 |
| Database Isolation | Shared between runs unless cleared | Fresh database every workflow run |
| Network | localhost:5432 maps to local machine | localhost:5432 maps to service container |

**Why localhost:5432 Mapping Works Differently:**

**Local:**
```bash
# localhost:5432 could map to:
# 1. Your local Homebrew PostgreSQL (wrong)
# 2. Docker container mapped to 5432 (correct)
# 3. Depends on which started first!

lsof -i:5432
# COMMAND   PID   USER
# postgres  1234  you    # Local Homebrew
# com.dock  5678  you    # Docker
```

**CI (GitHub Actions):**
```yaml
services:
  postgres:
    image: pgvector/pgvector:pg16
    ports:
      - 5432:5432  # Always maps correctly, no conflicts
```

**Solution: Use Docker Exclusively for Tests**

```bash
# Stop local postgres before testing
brew services stop postgresql@16

# Verify only Docker postgres is running
lsof -i:5432 | grep postgres
# Should show only com.docker.backend

# Start Docker services
docker-compose up -d postgres redis

# Run tests
cd apps/web
pnpm test:e2e
```

**Verification:**
```bash
# Check which postgres you're connected to
psql -h localhost -U test_user -d test_flowise_e2e -c "SELECT version();"

# Docker postgres (correct):
# PostgreSQL 16.x on x86_64-pc-linux-gnu

# Local Homebrew postgres (wrong):
# PostgreSQL 14.x on arm64-apple-darwin
```

---

### 2. File paths and storage

**Key Differences:**

| Aspect | Local | CI |
|--------|-------|-----|
| Storage Path | `/tmp/.flowise-test/storage` | `/tmp/.flowise-test/storage` |
| Persistence | Survives between test runs | Fresh each workflow run |
| File Uploads | Real file system | Ephemeral filesystem |
| Cleanup | Manual cleanup needed | Automatic (VM destroyed) |

**Why `/tmp/.flowise-test/storage` Works in Both:**

- **Local**: Written to your machine's `/tmp` directory
- **CI**: Written to GitHub Actions VM's `/tmp` directory
- Both use absolute paths, so no path resolution issues

**Relative vs Absolute Paths:**

```typescript
// ❌ BAD: Relative path (can break depending on cwd)
BLOB_STORAGE_PATH: './storage'

// ✅ GOOD: Absolute path (works everywhere)
BLOB_STORAGE_PATH: '/tmp/.flowise-test/storage'

// ✅ ALSO GOOD: Environment-specific
BLOB_STORAGE_PATH: process.env.CI
  ? '/tmp/.flowise-test/storage'
  : path.join(process.cwd(), '.flowise-test/storage')
```

**Local Cleanup:**

```bash
# Clean up test storage between runs
rm -rf /tmp/.flowise-test/storage

# Or use test reset (automatic cleanup)
curl -X POST http://localhost:4000/api/v1/__test__/reset
```

**CI: Fresh Filesystem Each Run**

CI automatically gets a clean filesystem because:
1. Each workflow run uses a fresh VM
2. No files persist between runs
3. No manual cleanup needed

**Verification:**
```bash
# Check storage directory
ls -la /tmp/.flowise-test/storage/

# Check file permissions
stat /tmp/.flowise-test/storage/

# Verify test can write files
touch /tmp/.flowise-test/storage/test.txt
ls /tmp/.flowise-test/storage/test.txt
rm /tmp/.flowise-test/storage/test.txt
```

---

### 3. Parallel execution

**Current Configuration:**

```typescript
// playwright.config.ts
export default defineConfig({
  workers: process.env.CI ? 1 : undefined,
  // CI: Sequential (1 worker)
  // Local: Parallel (undefined = CPU cores)
})
```

**Why Sequential in CI:**

1. **Database State:** Tests modify shared test database
2. **Predictability:** Easier to debug failures
3. **Resource Constraints:** GitHub Actions free tier has limited CPU
4. **Race Conditions:** Parallel tests can interfere with each other

**Future: Parallel Execution with TEST_RECORD_PREFIX**

Our codebase is designed to support parallel execution in the future:

```typescript
// Each worker gets unique prefix
const TEST_RECORD_PREFIX = `test_worker_${process.env.TEST_WORKER_INDEX}_`

// Records are isolated by prefix
chatflow: {
  name: `${TEST_RECORD_PREFIX}My Test Chatflow`
  // Worker 1: "test_worker_1_My Test Chatflow"
  // Worker 2: "test_worker_2_My Test Chatflow"
}
```

**Why Deterministic IDs Matter:**

```typescript
// ❌ BAD: Random IDs cause parallel conflicts
const chatflowId = uuidv4()  // Different every run

// ✅ GOOD: Deterministic IDs enable parallel isolation
const chatflowId = TEST_RECORD_PREFIX + 'chatflow_001'
// Worker 1: "test_worker_1_chatflow_001"
// Worker 2: "test_worker_2_chatflow_001"
// No conflict!
```

**Enabling Parallel Execution (Future):**

```typescript
// playwright.config.ts
export default defineConfig({
  workers: process.env.CI ? 4 : undefined,  // 4 parallel workers in CI

  use: {
    // Each worker gets unique prefix
    TEST_WORKER_INDEX: process.env.TEST_PARALLEL_INDEX
  }
})
```

**Verification (Current Sequential):**
```bash
# Check test execution
pnpm test:e2e

# In output, should see:
Running 6 tests using 1 worker  # Sequential
# NOT: Running 6 tests using 4 workers  # Parallel (future)
```

---

## Backend Server Issues

### 1. Backend exits immediately after starting

**Symptoms:**
```
Backend server started but process exits immediately
No errors shown in console
Tests fail with "connection refused"
```

**How to Check Logs:**

```bash
# Backend logs are written to:
tail -f /tmp/flowise-test-backend.log

# Or if started in foreground:
NODE_ENV=test pnpm --filter @flowise/server start
# Watch console output
```

**Common Missing Environment Variables:**

```bash
# Required for backend startup:
export NODE_ENV=test
export DATABASE_TYPE=postgres
export DATABASE_HOST=localhost
export DATABASE_PORT=5432
export DATABASE_NAME=flowise_e2e  # Will be prefixed to test_flowise_e2e
export DATABASE_USER=test_user
export DATABASE_PASSWORD=test_password
export ENABLE_E2E_ENDPOINTS=true
export PORT=4000

# Optional but recommended:
export REDIS_HOST=localhost
export REDIS_PORT=6379
export STORAGE_TYPE=local
export BLOB_STORAGE_PATH=/tmp/.flowise-test/storage
```

**Solution: Check for Silent Failures**

```bash
# Start backend in foreground to see errors
cd packages/server
NODE_ENV=test \
  DATABASE_TYPE=postgres \
  DATABASE_HOST=localhost \
  DATABASE_PORT=5432 \
  DATABASE_NAME=flowise_e2e \
  DATABASE_USER=test_user \
  DATABASE_PASSWORD=test_password \
  ENABLE_E2E_ENDPOINTS=true \
  pnpm start

# Watch for error messages:
# - "Connection refused" → Database not running
# - "role test_user does not exist" → Database setup issue
# - "Extension vector not found" → pgvector not installed
# - Uncaught exception → Check stack trace
```

**Database Connection Failures Cause Silent Exit:**

```bash
# Test database connection separately
psql -h localhost -U test_user -d test_flowise_e2e -c "SELECT 1;"

# If this fails, backend will exit immediately
# Fix database issue first, then restart backend
```

**Verification:**
```bash
# Backend should stay running
pnpm --filter @flowise/server start &
BACKEND_PID=$!

sleep 10

# Check if still running
kill -0 $BACKEND_PID 2>/dev/null && echo "✅ Backend running" || echo "❌ Backend exited"

# Check port is listening
lsof -i:4000 | grep LISTEN
```

---

### 2. E2E endpoints return 404

**Symptoms:**
```
POST /api/v1/__test__/reset → 404 Not Found
Test setup fails: "E2E endpoints not available"
```

**Root Causes:**

1. **NODE_ENV not set to `test`**
2. **ENABLE_E2E_ENDPOINTS not set to `true`**
3. **E2E_SECRET header required but not provided**

**How E2E Endpoint Protection Works:**

```typescript
// packages/server/src/controllers/test-control/index.ts

// Endpoints only registered if:
if (process.env.NODE_ENV === 'test' || process.env.ENABLE_E2E_ENDPOINTS === 'true') {
  app.post('/api/v1/__test__/reset', testGuard, resetHandler)
  app.post('/api/v1/__test__/seed', testGuard, seedHandler)
}

// testGuard middleware checks:
function testGuard(req, res, next) {
  // 1. Check database name starts with test_
  if (!databaseName.startsWith('test_')) {
    return res.status(403).json({ error: 'Test endpoints only work with test databases' })
  }

  // 2. Check E2E_SECRET if configured
  if (process.env.E2E_SECRET) {
    if (req.headers['x-e2e-secret'] !== process.env.E2E_SECRET) {
      return res.status(403).json({ error: 'Invalid E2E secret' })
    }
  }

  next()
}
```

**Solution: Verify Environment Variables**

```bash
# Check if NODE_ENV is set
echo $NODE_ENV
# Should output: test

# Check if E2E endpoints are enabled
echo $ENABLE_E2E_ENDPOINTS
# Should output: true

# Restart backend with correct env
NODE_ENV=test ENABLE_E2E_ENDPOINTS=true pnpm --filter @flowise/server start
```

**Solution: Verify E2E Secret (If Configured)**

```bash
# If E2E_SECRET is set, you must provide it in requests
export E2E_SECRET=your-secret-here

# Test with curl
curl -X POST http://localhost:4000/api/v1/__test__/reset \
  -H "x-e2e-secret: your-secret-here"

# Update Playwright test helper
# apps/web/e2e/helpers/test-db.ts should have:
const E2E_SECRET = process.env.E2E_SECRET
const headers = E2E_SECRET ? { 'x-e2e-secret': E2E_SECRET } : {}
```

**Verification:**
```bash
# Test E2E endpoint availability
curl -X POST http://localhost:4000/api/v1/__test__/reset

# Should return:
# 200 OK: {"status":"ok","message":"Database reset complete"}

# Should NOT return:
# 404 Not Found: Endpoint not available
# 403 Forbidden: testGuard rejected request
```

---

### 3. Migration errors

**Symptoms:**
```
Error during migration run: Cannot find module 'migration/...'
QueryFailedError: relation "chatflow" does not exist
Tests fail with: "Unknown column in field list"
```

**When to Run Migrations:**

- **After pulling new code** with database schema changes
- **After checking out different branch** with different migrations
- **Before first test run** in a new environment
- **When seeing "relation does not exist" errors**

**Solution: Run Migrations**

```bash
# From packages/server directory
cd packages/server

# Check migration status
pnpm typeorm migration:show

# Expected output:
# [ ] src/migration/1234567890-InitialMigration.ts
# [X] src/migration/1234567891-AddVectorSupport.ts  ← Ran
# [ ] src/migration/1234567892-AddTestSupport.ts

# Run pending migrations
NODE_ENV=test \
  DATABASE_NAME=flowise_e2e \
  DATABASE_USER=test_user \
  DATABASE_PASSWORD=test_password \
  pnpm typeorm migration:run

# Expected output:
# Migration 1234567890-InitialMigration has been executed successfully
# Migration 1234567892-AddTestSupport has been executed successfully
```

**How to Verify Migrations Succeeded:**

```bash
# Check migration table
psql -h localhost -U test_user -d test_flowise_e2e

SELECT * FROM migrations ORDER BY timestamp DESC LIMIT 5;

# Should show:
#          timestamp | name
# -------------------+-------------------------
#  1234567892        | AddTestSupport
#  1234567891        | AddVectorSupport
#  1234567890        | InitialMigration

\q
```

**How to Rollback Migrations:**

```bash
# Rollback last migration
NODE_ENV=test \
  DATABASE_NAME=flowise_e2e \
  pnpm typeorm migration:revert

# Expected output:
# Migration AddTestSupport has been reverted successfully

# Rollback multiple migrations
pnpm typeorm migration:revert  # Run multiple times
```

**⚠️ WARNING: Only Rollback Test Databases**

Never run `migration:revert` against production databases. Always verify:
```bash
echo $DATABASE_NAME
# Should output: flowise_e2e (or other test_ prefixed name)
# NOT: flowise (production)
```

**Verification:**
```bash
# Test that schema exists
psql -h localhost -U test_user -d test_flowise_e2e -c "\dt"

# Should show tables:
#  public | chatflow     | table | test_user
#  public | credential   | table | test_user
#  public | migrations   | table | test_user
#  ...
```

---

## Performance Problems

### 1. Tests running slowly (>2min per test)

**Expected Test Durations:**

| Test Type | Expected Duration | Slow Threshold |
|-----------|------------------|----------------|
| Simple auth test | 5-10s | >30s |
| Credential selection | 10-15s | >45s |
| Database seed + test | 15-20s | >60s |
| Complex multi-step | 30-45s | >120s |

**If Tests Take >2min, Something Is Wrong**

**Diagnosis: Profile Each Step**

```typescript
test('profile slow test', async ({ page }) => {
  console.time('Database Reset')
  await resetAndSeed()
  console.timeEnd('Database Reset')
  // Expected: <5s

  console.time('Login')
  await loginWithTestUser(page, 'admin')
  console.timeEnd('Login')
  // Expected: <8s

  console.time('Navigation')
  await page.goto('/dashboard')
  console.timeEnd('Navigation')
  // Expected: <3s

  console.time('Modal Interaction')
  await page.click('[data-testid="open-modal"]')
  await expect(page.locator('.modal')).toBeVisible()
  console.timeEnd('Modal Interaction')
  // Expected: <2s
})
```

**Common Slow Operations:**

**1. Database Connection Latency**

```bash
# Test database connection speed
time psql -h localhost -U test_user -d test_flowise_e2e -c "SELECT 1;"

# Should be <100ms:
# real    0m0.087s

# If >1s, check:
# - Is postgres local or remote?
# - Network latency?
# - Postgres under load?
```

**2. Backend Startup Time**

```bash
# Profile backend startup
time curl --retry 30 --retry-delay 1 --retry-connrefused http://localhost:4000/api/v1/ping

# Should be <15s locally:
# real    0m12.341s

# If >30s, check:
# - Database connection (slow connection?)
# - Migrations running (first-time startup?)
# - CPU usage (other processes competing?)
```

**3. Optimize Seed Data**

```typescript
// ❌ SLOW: Creating many unused credentials
await resetAndSeed({
  credentials: {
    openai: { assigned: true },
    jira: { assigned: true },
    slack: { assigned: true },
    github: { assigned: true },
    notion: { assigned: true },
    confluence: { assigned: true },
    // ... 10 more (each adds ~500ms)
  }
})
// Total: ~8 seconds

// ✅ FAST: Create only what you need
await resetAndSeed({
  credentials: {
    openai: { assigned: true }  // Only what test uses
  }
})
// Total: ~3 seconds
```

**Verification:**
```bash
# Run single test with timing
time pnpm exec playwright test tests/auth.spec.ts --workers=1

# Should output:
# real    0m25.123s  (acceptable)
# NOT: real    2m15.456s  (too slow)
```

---

### 2. Playwright browser launch delays

**Symptoms:**
```
Test startup takes 30+ seconds
Browser fails to launch
"Timeout waiting for browser to connect"
```

**Use Persistent Context (Faster)**

```typescript
// playwright.config.ts
export default defineConfig({
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: './e2e/.auth/user.json',  // Reuses auth
        channel: 'chrome',  // Use installed Chrome (faster than Chromium)
      }
    }
  ]
})
```

**Check Browsers Are Installed:**

```bash
# List installed browsers
pnpm exec playwright list

# Expected output:
# chromium 123.0.6312.4
# firefox 121.0
# webkit 17.4

# If not installed:
pnpm test:e2e:setup
```

**Verify Installation:**

```bash
# Check browser binaries exist
ls -lh ~/.cache/ms-playwright/

# Should show:
# chromium-1234/
# firefox-5678/
# webkit-9012/

# Total size: ~500MB per browser
```

**Use Existing Browser (Development):**

```bash
# Run with system Chrome (faster than bundled Chromium)
pnpm exec playwright test --project=chromium --headed

# Or configure in playwright.config.ts:
use: {
  channel: 'chrome'  // Use system Chrome instead of Chromium
}
```

**Verification:**
```bash
# Test browser launch speed
time pnpm exec playwright test --list

# Should be <5s:
# real    0m3.421s

# If >15s, reinstall browsers:
pnpm exec playwright install --force
```

---

### 3. CI tests slower than local

**Expected CI Performance:**

| Metric | Local (M1 Mac) | GitHub Actions Free | Acceptable Ratio |
|--------|----------------|---------------------|------------------|
| Test suite | 45s | 90-120s | 2-3x slower |
| Single test | 10s | 20-30s | 2-3x slower |
| Database reset | 2s | 4-6s | 2-3x slower |

**Why CI Is Slower:**

1. **CPU**: GitHub Actions free tier: 2 cores vs. M1/M2: 8-10 cores
2. **Disk**: CI: Slower network storage vs. Local: NVMe SSD
3. **Network**: CI: Cloud latency vs. Local: Localhost (no network)
4. **Parallelization**: CI: Sequential (workers=1) vs. Local: Parallel

**This Is Normal and Expected**

**Adjust Timeouts for CI:**

```typescript
// playwright.config.ts
export default defineConfig({
  timeout: process.env.CI ? 90000 : 30000,  // 3x longer in CI

  expect: {
    timeout: process.env.CI ? 15000 : 5000  // 3x longer
  },

  use: {
    actionTimeout: process.env.CI ? 30000 : 10000,  // 3x longer
  }
})
```

**Optimize CI Performance:**

```yaml
# .github/workflows/e2e-tests.yml

# 1. Use faster runner (paid tiers)
runs-on: ubuntu-latest-4-cores  # Instead of ubuntu-latest

# 2. Cache dependencies
- uses: actions/cache@v3
  with:
    path: ~/.cache/ms-playwright
    key: playwright-${{ hashFiles('**/package.json') }}

# 3. Use playwright docker image (pre-installed browsers)
# container: mcr.microsoft.com/playwright:v1.40.0-jammy
```

**Verification:**
```bash
# Compare local vs CI times
# Local:
time pnpm test:e2e
# real    0m45.123s

# CI: Check GitHub Actions logs
# Duration: 1m 35s

# Ratio: 95s / 45s = 2.1x (acceptable)
```

---

## Debug Commands & Tools

### Essential Diagnostic Commands

```bash
# ========================================
# PostgreSQL Diagnostics
# ========================================

# Check what's using port 5432
lsof -i:5432

# Connect to test database directly
psql -h localhost -U test_user -d test_flowise_e2e

# Verify test user exists
psql -h localhost -U postgres -c "\du test_user"

# List all databases
psql -h localhost -U postgres -c "\l" | grep test_

# Check pgvector extension
psql -h localhost -U test_user -d test_flowise_e2e -c "\dx"

# Check database size
psql -h localhost -U postgres -c "
  SELECT datname, pg_size_pretty(pg_database_size(datname))
  FROM pg_database
  WHERE datname LIKE 'test_%';"

# ========================================
# Backend Diagnostics
# ========================================

# Check backend logs
tail -f /tmp/flowise-test-backend.log

# Check backend process
lsof -i:4000

# Test backend health
curl http://localhost:4000/api/v1/ping

# Test E2E endpoints
curl -X POST http://localhost:4000/api/v1/__test__/reset
curl -X POST http://localhost:4000/api/v1/__test__/status

# ========================================
# Docker Diagnostics
# ========================================

# Check Docker postgres logs
docker logs flowise-postgres-test

# Connect to Docker postgres
docker exec -it flowise-postgres-test psql -U postgres

# Check container status
docker ps | grep postgres
docker ps | grep redis

# Restart Docker services
docker-compose restart postgres redis

# ========================================
# Redis Diagnostics
# ========================================

# Verify Redis is running
redis-cli ping
# Expected: PONG

# Check Redis info
redis-cli INFO

# Clear Redis cache
redis-cli FLUSHDB

# ========================================
# Playwright Diagnostics
# ========================================

# Run Playwright in UI mode (interactive debugging)
cd apps/web
pnpm test:e2e:ui

# Run Playwright with trace (detailed debugging)
pnpm test:e2e --trace on

# Run specific test file
pnpm test:e2e tests/auth.spec.ts

# Run tests in headed mode (see browser)
pnpm test:e2e:headed

# Run with debug mode (step-by-step)
pnpm test:e2e:debug

# View last test report
pnpm test:e2e:report

# List installed browsers
pnpm exec playwright list

# Check Playwright version
pnpm exec playwright --version

# ========================================
# Test Database Management
# ========================================

# Reset database manually via API
curl -X POST http://localhost:4000/api/v1/__test__/reset \
  -H "Content-Type: application/json"

# Seed with custom data
curl -X POST http://localhost:4000/api/v1/__test__/seed \
  -H "Content-Type: application/json" \
  -d '{
    "user": {
      "email": "test@example.com",
      "organization": {"auth0Id": "org_123", "name": "Test"}
    }
  }'

# ========================================
# Environment Diagnostics
# ========================================

# Check Node.js version
node --version
# Should be: v20.x.x or higher

# Check pnpm version
pnpm --version
# Should be: 8.x.x or higher

# Check environment variables
env | grep -E "NODE_ENV|DATABASE_|TEST_|AUTH0_|E2E_"

# Check .env.test file
cat apps/web/.env.test

# ========================================
# Migration Diagnostics
# ========================================

# Check migration status
cd packages/server
pnpm typeorm migration:show

# Run migrations
NODE_ENV=test DATABASE_NAME=flowise_e2e pnpm typeorm migration:run

# Revert last migration
NODE_ENV=test DATABASE_NAME=flowise_e2e pnpm typeorm migration:revert

# ========================================
# Performance Profiling
# ========================================

# Profile database connection
time psql -h localhost -U test_user -d test_flowise_e2e -c "SELECT 1;"

# Profile backend startup
time curl --retry 30 --retry-delay 1 --retry-connrefused \
  http://localhost:4000/api/v1/ping

# Profile test execution
time pnpm exec playwright test tests/auth.spec.ts

# Profile database reset
time curl -X POST http://localhost:4000/api/v1/__test__/reset

# ========================================
# Cleanup Commands
# ========================================

# Clear auth cache
rm apps/web/e2e/.auth/user.json

# Clear test storage
rm -rf /tmp/.flowise-test/storage

# Clear Playwright cache
rm -rf apps/web/e2e/test-results/
rm -rf apps/web/e2e/playwright-report/

# Stop all Docker services
docker-compose down

# Remove Docker volumes (full reset)
docker-compose down -v
```

---

## Getting Help

### Documentation Resources

1. **E2E Comprehensive Guide**: `/apps/web/e2e/E2E_COMPREHENSIVE_GUIDE.md`
   - Complete architecture overview
   - Helper library reference
   - Best practices and patterns

2. **Quick Start Guide**: `/apps/web/e2e/README.md`
   - Setup instructions
   - Available commands
   - Common workflows

3. **GitHub Actions Workflow**: `/.github/workflows/e2e-tests.yml`
   - CI configuration
   - Environment variables
   - Service container setup

4. **Playwright Documentation**: https://playwright.dev/
   - API reference
   - Best practices
   - Advanced patterns

### Debugging Workflow

**Step 1: Identify the Issue Category**
- Database connection? → [Database Connection Issues](#database-connection-issues)
- Auth0 login? → [Auth0 Authentication Failures](#auth0-authentication-failures)
- Test timeout? → [Test Timeout Issues](#test-timeout-issues)
- CI failure? → [Local vs CI Differences](#local-vs-ci-differences)

**Step 2: Run Diagnostic Commands**
```bash
# Quick health check
curl http://localhost:4000/api/v1/ping
psql -h localhost -U test_user -d test_flowise_e2e -c "SELECT 1;"
redis-cli ping

# All should return success
```

**Step 3: Check Logs**
```bash
# Backend logs
tail -f /tmp/flowise-test-backend.log

# Test output
pnpm test:e2e:ui  # Visual debugging
```

**Step 4: Isolate the Problem**
```bash
# Test individual components
pnpm test:e2e tests/auth.spec.ts  # Just auth
pnpm test:e2e tests/creds-001.spec.ts  # Just one test

# Run in headed mode to see what's happening
pnpm test:e2e:headed
```

### Common Error Messages Quick Reference

| Error Message | Section | Quick Fix |
|---------------|---------|-----------|
| "role test_user does not exist" | [Database #1](#1-role-test_user-does-not-exist) | Create user or stop local postgres |
| "pgvector extension not found" | [Database #2](#2-pgvector-extension-not-found) | `brew install pgvector` |
| "organization selector not found" | [Auth0 #1](#1-organization-selector-not-appearing) | Check user org membership |
| "Wrong email or password" | [Auth0 #2](#2-login-credentials-rejected) | Verify .env.test credentials |
| "Timeout 30000ms exceeded" | [Timeout #1](#1-playwright-timeout-errors) | Increase timeout or fix slow operation |
| "Backend not ready after 60s" | [Timeout #2](#2-backend-startup-timeout) | Check database connection |
| "404 Not Found: /api/v1/__test__/reset" | [Backend #2](#2-e2e-endpoints-return-404) | Set NODE_ENV=test |
| "Migration failed" | [Backend #3](#3-migration-errors) | Run `pnpm typeorm migration:run` |

### Recent Commits for Reference

Check recent test infrastructure changes:

```bash
# View commits related to E2E testing
git log --oneline --grep="test\|e2e\|E2E" -20

# View changes to test files
git log --oneline -- apps/web/e2e/ packages/server/src/test-utils/ -10

# View specific file history
git log --follow -p apps/web/e2e/helpers/database.ts
```

### Getting Support

1. **Check this troubleshooting guide first** - Most issues are documented here
2. **Review E2E Comprehensive Guide** - Understand the architecture
3. **Check GitHub Actions logs** - See exact error messages from CI
4. **Search recent commits** - Issue might be related to recent changes
5. **Ask in #engineering Slack** - Include:
   - Error message (full stack trace)
   - Steps to reproduce
   - Output of diagnostic commands
   - Local vs CI (where does it fail?)

**Template for Support Request:**

```
**Issue:** [Brief description]

**Environment:**
- Local or CI: [local/CI]
- OS: [macOS/Linux/Windows]
- Node version: [output of `node -v`]
- Playwright version: [output of `pnpm exec playwright --version`]

**Error Message:**
```
[Paste full error with stack trace]
```

**Steps to Reproduce:**
1. ...
2. ...

**Diagnostic Output:**
```bash
# Database check
lsof -i:5432
# [paste output]

# Backend check
curl http://localhost:4000/api/v1/ping
# [paste output]

# Environment check
env | grep -E "NODE_ENV|DATABASE_|TEST_"
# [paste output]
```

**What I've Tried:**
- [List troubleshooting steps already attempted]
```

---

## Summary

This troubleshooting guide covers the most common E2E testing issues encountered in the TheAnswer.ai project:

✅ **Database Connection Issues** - Dual postgres conflicts, pgvector setup, test database isolation
✅ **Auth0 Authentication** - Organization selection, credential errors, session caching
✅ **Timeouts** - Playwright, backend startup, database operations
✅ **Environment Differences** - Local vs CI, file paths, parallel execution
✅ **Backend Configuration** - E2E endpoints, migrations, silent failures
✅ **Performance** - Slow tests, browser launch, CI optimization
✅ **Debug Tools** - Comprehensive command reference

For architectural details and best practices, see `/apps/web/e2e/E2E_COMPREHENSIVE_GUIDE.md`.

For quick setup instructions, see `/apps/web/e2e/README.md`.

For security and database isolation, see test mode documentation in the backend codebase.

**Most Common Issues (90% of problems):**
1. Local postgres conflicts → Stop local postgres or create test_user
2. Auth0 org membership → Add test user to organization
3. Missing environment variables → Check .env.test
4. Database not reset → Run resetAndSeed() in beforeEach
5. Backend not in test mode → Set NODE_ENV=test

Happy testing! 🧪
