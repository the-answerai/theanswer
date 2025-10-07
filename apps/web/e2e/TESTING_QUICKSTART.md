# E2E Testing Quick Start Guide

**Get up and running with E2E tests in 5 minutes!**

This guide will help you run your first end-to-end test on TheAnswer.ai web application. If you need more details later, check out the [comprehensive guide](./E2E_COMPREHENSIVE_GUIDE.md).

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
pnpm test:e2e e2e/tests/Screen\ 1\ -\ Credential\ Modal/creds-001.autoload.spec.ts
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

  ✓  [chromium] › creds-001.autoload.spec.ts:21:5 › shows the credentials modal after login (8.2s)

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
pnpm test:e2e e2e/tests/Screen\ 1\ -\ Credential\ Modal/creds-001.autoload.spec.ts

# Run all tests in a directory
pnpm test:e2e e2e/tests/Screen\ 1\ -\ Credential\ Modal/

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

1. **Explore existing tests** in `e2e/tests/Screen 1 - Credential Modal/`
2. **Use helper libraries** for auth, database, and UI interactions
3. **Follow naming convention:** `feature-###.description.spec.ts`
4. **Test in isolation:** Always use `resetAndSeed()` or `resetOnly()` + `seedScenario()`

### Example Test Structure

```typescript
import { test, expect } from '@playwright/test'
import { resetAndSeed, loginWithTestUser } from '../../helpers'
import { MODAL_TITLES } from '../../helpers/selectors'

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
        await page.waitForURL(/\/chat\//, { timeout: 20000 })
    })

    test('should do something amazing', async ({ page }) => {
        // Your test implementation
        const modal = page.getByRole('dialog', { name: MODAL_TITLES.credentials })
        await expect(modal).toBeVisible()
    })
})
```

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
