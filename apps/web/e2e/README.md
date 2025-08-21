# E2E Testing with Playwright

This directory contains end-to-end tests for the TheAnswer.ai web application using Playwright.

## Setup

### 1. Install Dependencies

Playwright is already installed as a dev dependency. If you need to install browsers:

```bash
npx playwright install
```

### 2. Environment Variables

Create a `.env.test` file in the project root (same level as package.json) with your test credentials:

```bash
cp e2e/env.example .env.test
```

Edit `.env.test` and fill in:

-   `TEST_USER_EMAIL`: Email of your test Auth0 user
-   `TEST_USER_PASSWORD`: Password of your test Auth0 user
-   Auth0 configuration (should match your development environment)

### 3. Test User Setup

You'll need a test user in your Auth0 tenant:

1. Go to your Auth0 Dashboard
2. Navigate to User Management > Users
3. Create a new user or use an existing test user
4. Note the email and password for the `.env.test` file

## Running Tests

### Basic Commands

```bash
# Run tests with Playwright UI (recommended for development)
pnpm test:e2e:dev

# Run all tests (headless)
pnpm test:e2e

# Run tests with browser visible
pnpm test:e2e:headed

# Run tests in debug mode (step through)
pnpm test:e2e:debug

# Run only authentication tests
pnpm test:e2e:auth

# Run auth tests with browser visible
pnpm test:e2e:auth:headed

# View test report
pnpm test:e2e:report
```

### 🎨 Playwright UI Mode (Recommended)

The **Playwright UI** provides a visual interface with:

-   **Live test execution** with step-by-step screenshots
-   **Interactive test explorer** to run specific tests
-   **Time travel debugging** - click any step to see what happened
-   **Network tab** to inspect API calls
-   **Console logs** for each test step
-   **Test artifacts** (screenshots, videos, traces) in one place

```bash
# Open Playwright UI
pnpm test:e2e:dev
```

This opens a web interface where you can:

1. **Select tests** to run from the sidebar
2. **Watch tests execute** in real-time with screenshots
3. **Click any step** to see the page state at that moment
4. **Inspect failures** with detailed error information
5. **Re-run tests** with a single click

### Development Server

The tests are configured to automatically start the development server if it's not running. If you want to run the server manually:

```bash
# In one terminal
pnpm dev
# OR
pnpm start ## for faster tests

# In another terminal
pnpm test:e2e ## Runs in the background
# OR
pnpm test:e2e:headed
```

## Test Files

-   `auth.setup.ts` - Authentication setup that saves login state
-   `tests/auth.spec.ts` - Main authentication flow tests

## Test Structure

### Authentication Flow Tests

1. **Unauthenticated Redirect**: Verifies users are redirected to Auth0 login
2. **Successful Login**: Tests login with valid credentials
3. **Invalid Credentials**: Tests error handling for wrong credentials
4. **Authenticated Access**: Tests that logged-in users can access protected pages

### Test Strategy

The tests follow the authentication strategy from the testing guide:

1. Use `storageState` to persist authentication between tests
2. Test critical authentication flows without relying on hardcoded URLs
3. Verify both Auth0 integration and application behavior

## Debugging

### 🎨 UI Mode (Best for Development)

The Playwright UI is the easiest way to debug tests:

```bash
pnpm test:e2e:dev
```

**Features:**

-   **Visual timeline** - see every action with screenshots
-   **Click to debug** - click any step to pause and inspect
-   **Live DOM inspection** - hover over elements to highlight them
-   **Network monitoring** - see all API calls and responses
-   **Error analysis** - detailed failure information with context

### 🔍 Debug Mode (Step-by-Step)

For detailed step-through debugging:

```bash
pnpm test:e2e:auth:debug
```

This opens a browser and Playwright Inspector where you can:

-   **Step through** test actions one by one
-   **Inspect page elements** in real-time
-   **Execute commands** in the browser console
-   **Modify selectors** and test them live

### 📊 Test Artifacts

Tests automatically capture:

-   **Screenshots** (saved to `e2e/test-results/`)
-   **Videos** of test execution
-   **Traces** with detailed timeline (view with `npx playwright show-trace`)
-   **Network logs** for API debugging

### Common Issues

1. **Auth0 selectors**: If tests fail finding login elements, check the Auth0 page HTML and update selectors in the test files

2. **Timing issues**: If tests are flaky, increase timeouts:

    ```typescript
    await page.waitForSelector('selector', { timeout: 10000 })
    ```

3. **Environment variables**: Ensure `.env.test` is properly configured and the test user exists in Auth0

4. **Development server**: Make sure the Next.js app starts correctly and Auth0 is properly configured

## Extending Tests

### Adding New Tests

1. Create new test files in `e2e/tests/`
2. Follow the pattern in `auth.spec.ts`
3. Use the authentication state from `auth.setup.ts`

### Page Object Pattern

For complex tests, consider creating page objects:

```typescript
// e2e/pages/LoginPage.ts
export class LoginPage {
    constructor(private page: Page) {}

    async login(email: string, password: string) {
        await this.page.fill('[name="username"]', email)
        await this.page.fill('[name="password"]', password)
        await this.page.click('button[type="submit"]')
    }
}
```

## CI/CD Integration

Add to your GitHub Actions workflow:

```yaml
- name: Install Playwright
  run: npx playwright install --with-deps

- name: Run E2E tests
  run: pnpm test:e2e
  env:
      TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
      TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
```

## Resources

-   [Playwright Documentation](https://playwright.dev/)
-   [Auth0 Testing Guide](https://auth0.com/docs/test)
-   [Testing Strategy Document](../../../TESTING_STRATEGY.md)
