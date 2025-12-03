# E2E Testing Quick Start Guide

**Get up and running with E2E tests in 5 minutes!**

This guide will help you run your first end-to-end test on TheAnswer.ai web application. If you need more details later, check out the [comprehensive guide](./E2E_COMPREHENSIVE_GUIDE.md).

## What's New (January 2025)

This guide reflects recent improvements to the E2E test suite:

- ✅ **Centralized Timeouts** - Use `TIMEOUTS` constants instead of hardcoded values
- ✅ **Refactored Helpers** - Smaller, composable auth and database functions
- ✅ **Better Documentation** - JSDoc comments on all helper functions
- ✅ **No Arbitrary Waits** - All tests use explicit waits for conditions
- ✅ **Enhanced Config** - Playwright config with conditional browser strategy

---

## Prerequisites Checklist

Before starting, make sure you have:

- ✅ **Node.js 20+** installed (`node --version`)
- ✅ **pnpm 8+** installed (`pnpm --version`)
- ✅ **Docker Desktop** running (for PostgreSQL and Redis)
- ✅ **Auth0 test account** with three test users (admin, builder, member)
- ✅ **Project dependencies** installed (`pnpm install` from root)

---

## Quick Setup (5 minutes)

### Step 1: Clone and Install Dependencies

```bash
# From project root
cd /Users/diegocosta/dev/theanswer

# Install all dependencies (if not already done)
pnpm install

# Install Playwright browsers (first time only)
cd apps/web
pnpm test:e2e:setup
```

⏱️ **Time:** ~2-3 minutes (one-time setup)

---

### Step 2: Configure Environment Variables

```bash
# From apps/web directory
cd apps/web

# Copy the environment template
cp e2e/env.example .env.test

# Edit .env.test with your credentials
# Use your preferred editor (VSCode, vim, nano, etc.)
code .env.test
```

**Required variables to configure:**

```bash
# Test User Credentials (all users share the same password)
TEST_USER_PASSWORD=your-secure-test-password

# Test User Email Addresses
TEST_USER_ENTERPRISE_ADMIN_EMAIL=admin@yourdomain.com
TEST_USER_ENTERPRISE_BUILDER_EMAIL=builder@yourdomain.com
TEST_USER_ENTERPRISE_MEMBER_EMAIL=member@yourdomain.com

# Organization Configuration
TEST_ENTERPRISE_AUTH0_ORG_ID=org_your_org_id_here
TEST_ENTERPRISE_ORG_NAME=Your Org Name

# Auth0 Configuration (match your dev environment)
AUTH0_SECRET=your-auth0-secret
AUTH0_ISSUER_BASE_URL=https://your-tenant.us.auth0.com
AUTH0_BASE_URL=http://localhost:3000
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret

# Enable test endpoints
ENABLE_E2E_ENDPOINTS=true
```

⚠️ **Important:** These test users must exist in your Auth0 tenant with appropriate roles and permissions.

⏱️ **Time:** ~1 minute

---

### Step 3: Start Required Services

**Option A: Using Docker Compose (Recommended)**

```bash
# From project root
docker-compose up -d postgres redis

# Verify services are running
docker-compose ps
```

**Option B: Local PostgreSQL**

If you have PostgreSQL installed locally, ensure it's running and accessible.

⏱️ **Time:** ~30 seconds

---

### Step 4: Start Flowise Backend in Test Mode

The backend must run with `NODE_ENV=test` to automatically prefix the database with `test_flowise_e2e`.

```bash
# From project root
cd packages/server

# Start backend in test mode
NODE_ENV=test pnpm start

# OR for development with hot reload
NODE_ENV=test pnpm dev
```

✅ **Success indicator:** You should see:
```
[SERVER]: Server is running on port 4000
[DATABASE]: Connected to test_flowise_e2e database
```

⚠️ **Keep this terminal running** while you run tests in another terminal.

⏱️ **Time:** ~30 seconds

---

### Step 5: Run Your First Test

Open a **new terminal** and run a single test:

```bash
# From apps/web directory
cd apps/web

# Run a single test file
pnpm test:e2e e2e/tests/credential-modal/autoload.spec.ts
```

⏱️ **Time:** ~10-15 seconds

---

## What to Expect

### During Test Execution

You'll see console output like this:

```
Running 1 test using 1 worker

🗑️ Resetting database for clean test state...
🔐 Logging in as member user (creates chatflow)...
🔧 Ensuring baseline scenario for member user...
✅ Setup complete

  ✓  [chromium] › autoload.spec.ts:21:5 › shows the credentials modal after login (8.2s)

  1 passed (12.3s)
```

### Success Indicators

- ✅ Test marked with green checkmark
- ✅ Status shows `1 passed`
- ✅ No error messages in console
- ✅ Test completes in ~10-15 seconds

### What Just Happened?

Behind the scenes, the test framework:

1. **Reset Database:** Cleared test database (`test_flowise_e2e`) and seeded with fresh data
2. **Authentication:** Logged into Auth0 as the member user and selected the test organization
3. **Browser Launch:** Opened Chromium browser (headless mode)
4. **Test Execution:** Navigated to `/chat/`, verified credentials modal appears
5. **Assertions:** Checked that modal is visible and shows "Setup Required" status
6. **Cleanup:** Closed browser and prepared for next test

---

## Common Commands Cheat Sheet

### Running Tests

```bash
# Run all tests (headless)
pnpm test:e2e

# Run single test file
pnpm test:e2e e2e/tests/credential-modal/autoload.spec.ts

# Run all tests in a directory
pnpm test:e2e e2e/tests/credential-modal/

# Run tests matching a pattern
pnpm test:e2e --grep "credentials modal"
```

### Development & Debugging

```bash
# Run with Playwright UI (recommended for development)
pnpm test:e2e:dev

# Run with visible browser (watch tests execute)
pnpm test:e2e:headed

# Debug mode (step-by-step with inspector)
pnpm test:e2e:debug

# Run specific test in debug mode
pnpm test:e2e:debug e2e/tests/auth.spec.ts
```

### Reports & Artifacts

```bash
# View HTML report from last run
pnpm test:e2e:report

# View trace file (detailed timeline)
npx playwright show-trace e2e/test-results/trace.zip
```

### Authentication Tests

```bash
# Run only auth tests
pnpm test:e2e:auth

# Auth tests with visible browser
pnpm test:e2e:auth:headed

# Debug auth tests
pnpm test:e2e:auth:debug
```

---

## Common Issues & Quick Fixes

### Issue: "Playwright browsers not found"

**Solution:**
```bash
pnpm test:e2e:setup
```

### Issue: "Auth0 login fails" or "Invalid credentials"

**Solution:**
- Verify `.env.test` has correct Auth0 credentials
- Ensure test users exist in Auth0 with correct roles
- Clear cached auth state: `rm e2e/.auth/user.json`
- Try fresh login: Use `loginWithTestUser(page, 'admin', true)`

### Issue: "Cannot connect to database"

**Solution:**
- Verify backend is running with `NODE_ENV=test`
- Check Docker services: `docker-compose ps`
- Verify `ENABLE_E2E_ENDPOINTS=true` in `.env.test`

### Issue: "Test timeout" or "Element not found"

**Solution:**
- Ensure Next.js dev server is running
- Clear browser cache: `rm -rf e2e/.auth/`
- Increase timeout in test: `{ timeout: 20000 }`
- Run in headed mode to see what's happening: `pnpm test:e2e:headed`

### Issue: "Port already in use"

**Solution:**
```bash
# Kill process on port 3000 (Next.js)
lsof -ti:3000 | xargs kill -9

# Kill process on port 4000 (Flowise backend)
lsof -ti:4000 | xargs kill -9
```

---

## Visual Debugging with Playwright UI

The **Playwright UI** is the best way to debug tests during development:

```bash
pnpm test:e2e:dev
```

This opens a web interface where you can:

- 📋 **Select tests** to run from sidebar
- 👀 **Watch tests execute** in real-time with screenshots
- 🕒 **Time travel** - click any step to see page state
- 🔍 **Inspect elements** with DOM explorer
- 📊 **View network requests** and API calls
- 🐛 **Debug failures** with detailed error traces

---

## Next Steps

Now that you've run your first test, explore more:

### Learn More

- 📘 **[E2E Comprehensive Guide](./E2E_COMPREHENSIVE_GUIDE.md)** - Deep dive into architecture, helpers, and advanced patterns
- 📄 **[README.md](./README.md)** - Full documentation on testing strategy and CI/CD integration
- 🔒 **[Test Database Security](../../../docs/TEST_DATABASE_SECURITY.md)** - Security implementation for test environments

### Write Your Own Tests

1. **Explore existing tests** in `e2e/tests/credential-modal/`
2. **Use helper libraries** for auth, database, and UI interactions
3. **Follow naming convention:** `feature-###.description.spec.ts`
4. **Test in isolation:** Always use `resetAndSeed()` or `resetOnly()` + `seedScenario()`

### Example Test Structure

```typescript
import { test, expect } from '@playwright/test'
import { resetAndSeed, loginWithTestUser } from '../../helpers/database'
import { MODAL_TITLES, TIMEOUTS } from '../../helpers/selectors'

test.describe('My New Feature', () => {
    test.beforeEach(async ({ page }) => {
        // Reset and seed with custom data
        await resetAndSeed({
            chatflow: { name: 'Test Chatflow' },
            credentials: {
                openai: { assigned: true, name: 'Test OpenAI' }
            }
        })

        // Login as admin user
        await loginWithTestUser(page, 'admin')
        await page.waitForURL(/\/chat\//, { timeout: TIMEOUTS.LONG })
    })

    test('should do something amazing', async ({ page }) => {
        // Your test implementation with proper timeouts
        const modal = page.getByRole('dialog', { name: MODAL_TITLES.credentials })
        await expect(modal).toBeVisible({ timeout: TIMEOUTS.MODAL_APPEAR })
    })
})
```

---

## Using Helper Functions

The E2E test suite provides several helper modules to simplify test development. All helpers are fully documented with JSDoc comments.

### Authentication Helpers (`helpers/auth.ts`)

The auth helpers provide reusable functions for Auth0 login:

```typescript
import { loginAsUser, loginWithTestUser, TEST_USERS } from '../helpers/auth'

// Simple login with user role
await loginWithTestUser(page, 'admin')  // Uses cached auth when possible
await loginWithTestUser(page, 'member', true)  // Force fresh login

// Direct login with specific credentials
await loginAsUser(page, 'user@example.com', 'password', 'org-id-123')

// The helper automatically handles:
// - Email input and Continue button
// - Password input and Submit button
// - Organization selection (with fallbacks)
// - Redirect verification
```

**Available functions:**
- `loginAsUser()` - Main auth orchestrator
- `loginWithTestUser()` - Login with predefined test user role
- `fillEmailStep()` - Email input handling
- `fillPasswordStep()` - Password input handling
- `handleOrganizationSelection()` - Org selection with fallbacks
- `waitForAuthRedirect()` - Redirect verification

**Key improvements:**
- All auth functions use `TIMEOUTS` constants
- Organization selection has 3-level fallback (ID → Name → First available)
- Comprehensive console logging for debugging
- JSDoc documentation on all functions

### Timeout Constants (`helpers/selectors.ts`)

Always use `TIMEOUTS` instead of hardcoded values:

```typescript
import { TIMEOUTS } from '../helpers/selectors'

// ❌ Don't do this:
await expect(modal).toBeVisible({ timeout: 10000 })
await page.waitForURL(/\/chat\//, { timeout: 20000 })

// ✅ Do this instead:
await expect(modal).toBeVisible({ timeout: TIMEOUTS.MODAL_APPEAR })
await page.waitForURL(/\/chat\//, { timeout: TIMEOUTS.LONG })
```

**Available timeouts:**
- `TIMEOUTS.SHORT` (5s) - Quick UI updates
- `TIMEOUTS.MEDIUM` (10s) - Standard operations, assertions
- `TIMEOUTS.LONG` (20s) - Complex operations
- `TIMEOUTS.AUTH_REDIRECT` (15s) - Auth0 redirects
- `TIMEOUTS.MODAL_APPEAR` (10s) - Modal visibility
- `TIMEOUTS.PAGE_LOAD` (30s) - Full page loads
- `TIMEOUTS.NETWORK_IDLE` (30s) - Network idle state

**Why use constants?**
- Consistency across all tests
- Easy to adjust globally if needed
- Self-documenting code
- Matches Playwright config expect timeout

### Database Helpers (`helpers/database.ts`)

Seed test data with scenarios or custom payloads:

```typescript
import { resetOnly, seedScenario, resetAndSeed } from '../helpers/database'

// Pattern 1: Reset + Scenario (recommended for standard test setups)
await resetOnly()
await loginWithTestUser(page, 'member')
await seedScenario('baseline', 'member')  // Predefined scenario for member user

// Pattern 2: Reset + Custom Payload (for specific test data)
await resetAndSeed({
    chatflow: { name: 'Test Chatflow' },
    credentials: {
        openai: { assigned: true, name: 'My OpenAI Key' },
        jira: { assigned: false },
        slack: { create: false }  // Don't create this credential
    }
})
```

**Key functions:**
- `resetOnly()` - Clear database completely
- `seedScenario(scenario, userType)` - Seed with predefined scenario
- `resetAndSeed(overrides)` - Reset + custom seed in one call

**Predefined scenarios:**
- `'baseline'` - Standard setup with basic credentials
- `'user-with-both-credentials'` - OpenAI and Exa assigned
- `'user-with-openai'` - Only OpenAI assigned
- `'user-with-all-but-slack-assigned'` - All except Slack

**Error handling:**
The helpers provide clear error messages:
- Invalid scenario names
- Missing environment variables
- User type validation
- Network/API errors

### Credential Helpers (`helpers/credentials.ts`)

Work with credential cards and modal states:

```typescript
import {
    waitForLoadingToResolve,
    getCredentialCard,
    expectCredentialStatus
} from '../helpers/credentials'

// Wait for credential loading spinner to disappear
const modal = page.getByRole('dialog', { name: MODAL_TITLES.credentials })
await waitForLoadingToResolve(modal)

// Get specific credential card
const openaiCard = getCredentialCard(modal, CREDENTIAL_LABELS.openai)
await expect(openaiCard).toBeVisible()

// Verify credential status
await expectCredentialStatus(modal, 'openai', 'assigned')
await expectCredentialStatus(modal, 'jira', 'setupRequired')
```

**Available functions:**
- `waitForLoadingToResolve()` - Wait for modal loading state
- `getCredentialCard()` - Locate credential card by label
- `expectCredentialStatus()` - Assert credential status
- `expectModalVisible()` - Verify modal visibility

### Selector Constants (`helpers/selectors.ts`)

Use centralized selectors for consistency:

```typescript
import {
    MODAL_TITLES,
    CREDENTIAL_LABELS,
    STATUS_CHIP,
    BUTTON_TEXTS,
    TEST_IDS
} from '../helpers/selectors'

// Modal titles
const modal = page.getByRole('dialog', { name: MODAL_TITLES.credentials })

// Credential labels (regex patterns)
const openaiCard = getCredentialCard(modal, CREDENTIAL_LABELS.openai)

// Status chips
await expect(modal.getByText(STATUS_CHIP.assigned)).toBeVisible()

// Test IDs
const loading = modal.getByTestId(TEST_IDS.credentialsLoading)
```

**Why centralized selectors?**
- Update once, apply everywhere
- Avoid typos and inconsistencies
- Self-documenting test code
- Easy to maintain as UI changes

---

## Pro Tips

💡 **Use UI mode for development** - It's the fastest way to iterate on tests (`pnpm test:e2e:dev`)

💡 **Run single tests** - Don't run the full suite while developing a new test

💡 **Add console logs** - Use `console.log('🔍 Step description...')` for debugging

💡 **Take screenshots** - Use `await page.screenshot({ path: 'debug.png' })` when stuck

💡 **Check test-results/** - Failed tests automatically capture screenshots and traces

💡 **Keep backend running** - Avoid restarting the backend between test runs for faster feedback

---

## Need Help?

- 🐛 **Tests failing?** Check the [Troubleshooting section](./E2E_COMPREHENSIVE_GUIDE.md#-troubleshooting) in the comprehensive guide
- 📚 **Want to learn more?** Read the [E2E Comprehensive Guide](./E2E_COMPREHENSIVE_GUIDE.md)
- 🎯 **Best practices?** See [Best Practices](./E2E_COMPREHENSIVE_GUIDE.md#-best-practices) section
- 💬 **Still stuck?** Ask the team or check existing test examples

---

**Happy Testing!** 🚀

You're now ready to write reliable end-to-end tests for TheAnswer.ai. Remember: the key to great E2E tests is isolation, clear assertions, and good debugging tools.
