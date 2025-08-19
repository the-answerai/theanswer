# Automated Testing Strategy for TheAnswer.ai Platform

## Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Critical User Journeys](#critical-user-journeys)
3. [Auth0 Testing Strategy](#auth0-testing-strategy)
4. [Test Data Management](#test-data-management)
5. [Billing & Credits Testing](#billing--credits-testing)
6. [Permissions Testing](#permissions-testing)
7. [API Contract Testing](#api-contract-testing)
8. [Example Test Implementations](#example-test-implementations)
9. [CI/CD Strategy](#cicd-strategy)
10. [Getting Started Exercise](#getting-started-exercise)

---

## Testing Philosophy

### Layered Testing Approach

Our testing strategy follows the **testing pyramid** with three main layers:

```
    /\
   /  \    E2E Tests (Few, Critical Paths)
  /____\
 /      \   Integration/API Tests (More, Fast)
/__________\ Unit Tests (Many, Instant)
```

**Unit Tests (70%)**

-   Fast, isolated tests for business logic
-   Focus on: billing calculations, permission checks, data transformations
-   Run in milliseconds, no external dependencies

**API/Integration Tests (25%)**

-   Test API contracts and data flow
-   Focus on: authentication, authorization, billing endpoints
-   Use real database (test schema), mock external services

**E2E Tests (5%)**

-   Critical user journeys only
-   Focus on: login flow, billing limits, permission blocks
-   Use Playwright with real browser automation

### Key Testing Principles

1. **Fast Feedback**: Unit tests should run in <10 seconds
2. **Reliable**: Tests shouldn't be flaky or dependent on external services
3. **Maintainable**: Clear naming, good structure, easy to debug
4. **Realistic**: Test with data that mirrors production scenarios

---

## Critical User Journeys

These are the **must-test** scenarios that, if broken, would severely impact the business:

### 1. **New User Onboarding** (High Priority)

```
User clicks "Sign Up" → Auth0 → Account creation → Free tier credits assigned → Dashboard with empty state
```

### 2. **AI Credit Consumption** (High Priority)

```
User makes AI request → Credits deducted correctly → Usage dashboard updates → Billing tracked in Stripe
```

### 3. **Billing Threshold Enforcement** (Critical)

```
User approaches limit → Warning shown → Hard limit reached → Requests blocked → Upgrade prompt
```

### 4. **Permission Enforcement** (High Priority)

```
Regular user tries admin action → Access denied → Admin performs same action → Success
```

### 5. **Organization Management** (Medium Priority)

```
Admin invites user → User accepts → Proper org scope → Resource visibility correct
```

---

## Auth0 Testing Strategy

### Using storageState for Authentication

Instead of hardcoding redirect URLs, use Playwright's `storageState` to persist authentication:

```typescript
// tests/setup/auth-setup.ts
import { test as setup, expect } from '@playwright/test'

const authFile = 'playwright/.auth/user.json'

setup('authenticate', async ({ page }) => {
    // Go to login page
    await page.goto('/login')

    // Use Auth0 test credentials
    await page.fill('[data-testid="email"]', process.env.TEST_USER_EMAIL!)
    await page.fill('[data-testid="password"]', process.env.TEST_USER_PASSWORD!)
    await page.click('[data-testid="submit"]')

    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard')
    await expect(page.getByText('Welcome')).toBeVisible()

    // Save authentication state
    await page.context().storageState({ path: authFile })
})
```

```typescript
// playwright.config.ts
export default defineConfig({
    // Other config...
    projects: [
        {
            name: 'setup',
            testMatch: /.*\.setup\.ts/
        },
        {
            name: 'authenticated',
            use: {
                storageState: 'playwright/.auth/user.json'
            },
            dependencies: ['setup']
        }
    ]
})
```

### Different User Roles

Create separate auth files for different roles:

```typescript
// tests/setup/admin-auth.setup.ts
setup('admin-auth', async ({ page }) => {
    await authenticateAs({
        page,
        email: process.env.ADMIN_USER_EMAIL!,
        password: process.env.ADMIN_USER_PASSWORD!,
        authFile: 'playwright/.auth/admin.json'
    })
})

// tests/setup/regular-user-auth.setup.ts
setup('regular-user-auth', async ({ page }) => {
    await authenticateAs({
        page,
        email: process.env.REGULAR_USER_EMAIL!,
        password: process.env.REGULAR_USER_PASSWORD!,
        authFile: 'playwright/.auth/regular-user.json'
    })
})
```

---

## Test Data Management

### Test-Only API Endpoints (Factories)

Create factory endpoints that only work in test environments:

```typescript
// packages/server/src/routes/test-factories/index.ts
import express from 'express'
import { testOnlyMiddleware } from '../../middlewares/testOnly'

const router = express.Router()

// Only available when NODE_ENV=test
router.use(testOnlyMiddleware)

// Create test user with specific credits
router.post('/users', async (req, res) => {
    const { email, credits = 1800, role = 'user', organizationId } = req.body

    const user = await createTestUser({
        email,
        auth0Id: `test-auth0-${Date.now()}`,
        organizationId,
        role,
        stripeCustomerId: await createTestStripeCustomer()
    })

    await setUserCredits(user.id, credits)

    res.json({ user, apiKey: await generateApiKey(user.id) })
})

// Create test organization
router.post('/organizations', async (req, res) => {
    const { name, planType = 'free' } = req.body

    const org = await createTestOrganization({
        name,
        auth0Id: `org-${Date.now()}`,
        planType
    })

    res.json({ organization: org })
})

// Set user credits
router.put('/users/:userId/credits', async (req, res) => {
    const { credits } = req.body
    await setUserCredits(req.params.userId, credits)
    res.json({ success: true })
})

// Clean up test data
router.delete('/cleanup', async (req, res) => {
    await cleanupTestData()
    res.json({ success: true })
})
```

### Database Seeding Patterns

```typescript
// tests/helpers/factories.ts
export class TestDataFactory {
    static async createUserWithCredits(options: { email?: string; credits?: number; organizationId?: string; role?: 'user' | 'admin' }) {
        const response = await request.post('/api/test-factories/users').send(options).expect(200)

        return response.body
    }

    static async setUserCredits(userId: string, credits: number) {
        await request.put(`/api/test-factories/users/${userId}/credits`).send({ credits }).expect(200)
    }

    static async cleanup() {
        await request.delete('/api/test-factories/cleanup').expect(200)
    }
}
```

### Test Isolation Strategies

**Option 1: Database Reset (Simple)**

```typescript
// Reset entire test database between test suites
beforeEach(async () => {
    await TestDataFactory.cleanup()
})
```

**Option 2: Tenant Isolation (Scalable)**

```typescript
// Use unique organization per test
beforeEach(async () => {
    const testOrg = await TestDataFactory.createOrganization({
        name: `test-org-${Date.now()}`
    })

    testUser = await TestDataFactory.createUserWithCredits({
        organizationId: testOrg.id,
        credits: 1800
    })
})
```

---

## Billing & Credits Testing

### Problem: Testing Without Spending Money

We need to test billing logic without making real AI API calls or charging real money.

### Solution: AI Client Abstraction

```typescript
// packages/server/src/services/ai/AiClientInterface.ts
export interface AiClient {
    generate(prompt: string, options?: AiOptions): Promise<AiResponse>
    getTokenCount(text: string): number
    getCreditCost(tokens: number): number
}

export interface AiResponse {
    content: string
    tokens: number
    credits: number
}
```

```typescript
// packages/server/src/services/ai/OpenAiClient.ts (Production)
export class OpenAiClient implements AiClient {
    async generate(prompt: string, options?: AiOptions): Promise<AiResponse> {
        const response = await this.openai.completions.create({
            model: options?.model || 'gpt-4',
            prompt,
            max_tokens: options?.maxTokens
        })

        const tokens = response.usage?.total_tokens || 0
        const credits = this.getCreditCost(tokens)

        // Track real usage in billing system
        await this.billingService.trackUsage('ai_tokens', credits)

        return {
            content: response.choices[0].text,
            tokens,
            credits
        }
    }

    getCreditCost(tokens: number): number {
        return Math.ceil(tokens / 10) // 10 tokens = 1 credit
    }
}
```

```typescript
// packages/server/src/services/ai/FakeAiClient.ts (Test)
export class FakeAiClient implements AiClient {
    private responses: Map<string, AiResponse> = new Map()

    // Pre-configure responses for testing
    mockResponse(prompt: string, response: AiResponse) {
        this.responses.set(prompt, response)
    }

    async generate(prompt: string): Promise<AiResponse> {
        // Return canned response
        const cannedResponse = this.responses.get(prompt) || {
            content: 'Test AI response',
            tokens: 100,
            credits: 10
        }

        // Still track usage in test billing system
        await this.billingService.trackUsage('ai_tokens', cannedResponse.credits)

        return cannedResponse
    }

    getCreditCost(tokens: number): number {
        return Math.ceil(tokens / 10)
    }
}
```

### Dependency Injection

```typescript
// packages/server/src/services/ServiceContainer.ts
export class ServiceContainer {
    static getAiClient(): AiClient {
        if (process.env.NODE_ENV === 'test') {
            return new FakeAiClient()
        }
        return new OpenAiClient()
    }
}
```

### Test Examples

```typescript
// tests/billing/credit-consumption.test.ts
describe('Credit Consumption', () => {
    let fakeAiClient: FakeAiClient
    let testUser: any

    beforeEach(async () => {
        fakeAiClient = ServiceContainer.getAiClient() as FakeAiClient
        testUser = await TestDataFactory.createUserWithCredits({
            credits: 1800
        })
    })

    test('should deduct credits correctly for AI usage', async () => {
        // Configure fake AI response
        fakeAiClient.mockResponse('Hello world', {
            content: 'Hello! How can I help?',
            tokens: 150, // Will cost 15 credits
            credits: 15
        })

        // Make AI request
        const response = await request
            .post('/api/v1/chatflows/predict')
            .set('Authorization', `Bearer ${testUser.apiKey}`)
            .send({
                chatflowId: testUser.defaultChatflowId,
                question: 'Hello world'
            })
            .expect(200)

        // Verify response
        expect(response.body.text).toBe('Hello! How can I help?')

        // Verify credits deducted
        const updatedUser = await getUserCredits(testUser.id)
        expect(updatedUser.credits).toBe(1785) // 1800 - 15
    })

    test('should block requests when credits exhausted', async () => {
        // Set user to very low credits
        await TestDataFactory.setUserCredits(testUser.id, 5)

        // Configure expensive AI response
        fakeAiClient.mockResponse('Complex question', {
            content: 'Complex answer...',
            tokens: 100,
            credits: 10 // More than user has
        })

        // Request should be blocked
        await request
            .post('/api/v1/chatflows/predict')
            .set('Authorization', `Bearer ${testUser.apiKey}`)
            .send({
                chatflowId: testUser.defaultChatflowId,
                question: 'Complex question'
            })
            .expect(403)
            .expect((res) => {
                expect(res.body.error).toContain('insufficient credits')
            })
    })
})
```

---

## Permissions Testing

### Unit Tests for Permission Matrix

```typescript
// tests/unit/permissions.test.ts
import { enforceAbility } from '../src/middlewares/authentication/enforceAbility'

describe('Permission Matrix', () => {
    const testCases = [
        // [role, resource, action, hasAccess]
        ['admin', 'Chatflow', 'read', true],
        ['admin', 'Chatflow', 'write', true],
        ['admin', 'Chatflow', 'delete', true],
        ['user', 'Chatflow', 'read', true], // Own resources
        ['user', 'Chatflow', 'write', true], // Own resources
        ['user', 'Chatflow', 'delete', false], // Cannot delete
        ['user', 'Organization', 'read', false],
        ['user', 'Organization', 'write', false]
    ]

    testCases.forEach(([role, resource, action, expected]) => {
        test(`${role} ${action} ${resource} should be ${expected}`, async () => {
            const mockReq = createMockRequest({ role, resource, action })
            const mockRes = createMockResponse()
            const mockNext = jest.fn()

            await enforceAbility(resource)(mockReq, mockRes, mockNext)

            if (expected) {
                expect(mockNext).toHaveBeenCalled()
            } else {
                expect(mockRes.status).toHaveBeenCalledWith(403)
            }
        })
    })
})
```

### Minimal E2E Permission Tests

Only test the most critical permission scenarios in E2E:

```typescript
// tests/e2e/permissions.spec.ts
test.describe('Critical Permissions', () => {
    test('regular user cannot access admin settings', async ({ page }) => {
        // Use regular user auth
        await page.goto('/admin/organizations')

        // Should see 403 or redirect to unauthorized page
        await expect(page.getByText('Access Denied')).toBeVisible()
    })

    test('admin can manage organization', async ({ page }) => {
        // Use admin auth
        await page.goto('/admin/organizations')

        // Should see admin interface
        await expect(page.getByText('Organization Management')).toBeVisible()
        await expect(page.getByRole('button', { name: 'Add User' })).toBeVisible()
    })
})
```

---

## API Contract Testing

Use Playwright's `request` context for fast API testing:

```typescript
// tests/api/chatflows.api.test.ts
import { test, expect } from '@playwright/test'

test.describe('Chatflows API', () => {
    let apiContext: any
    let testUser: any

    test.beforeAll(async ({ playwright }) => {
        // Create API context
        apiContext = await playwright.request.newContext({
            baseURL: process.env.API_URL || 'http://localhost:3000'
        })

        // Create test user
        testUser = await TestDataFactory.createUserWithCredits({
            credits: 1000
        })
    })

    test('GET /api/v1/chatflows returns user chatflows', async () => {
        const response = await apiContext.get('/api/v1/chatflows', {
            headers: {
                Authorization: `Bearer ${testUser.apiKey}`
            }
        })

        expect(response.status()).toBe(200)

        const chatflows = await response.json()
        expect(Array.isArray(chatflows)).toBe(true)
        expect(chatflows.every((cf) => cf.userId === testUser.id)).toBe(true)
    })

    test('POST /api/v1/chatflows creates new chatflow', async () => {
        const newChatflow = {
            name: 'Test Chatflow',
            flowData: '{"nodes":[],"edges":[]}',
            visibility: 'private'
        }

        const response = await apiContext.post('/api/v1/chatflows', {
            data: newChatflow,
            headers: {
                Authorization: `Bearer ${testUser.apiKey}`
            }
        })

        expect(response.status()).toBe(201)

        const created = await response.json()
        expect(created.name).toBe(newChatflow.name)
        expect(created.userId).toBe(testUser.id)
        expect(created.organizationId).toBe(testUser.organizationId)
    })

    test('unauthorized request returns 401', async () => {
        const response = await apiContext.get('/api/v1/chatflows')
        expect(response.status()).toBe(401)
    })
})
```

---

## Example Test Implementations

### 1. New User Empty State

```typescript
// tests/e2e/new-user-onboarding.spec.ts
import { test, expect } from '@playwright/test'

test.describe('New User Onboarding', () => {
    test('shows empty state for brand new user', async ({ page }) => {
        // Create fresh user with no chatflows
        const newUser = await TestDataFactory.createUserWithCredits({
            email: `newuser-${Date.now()}@test.com`,
            credits: 10000
        })

        // Login as new user (you'd implement auth flow here)
        await authenticateAs(page, newUser.email)

        // Should land on dashboard
        await page.goto('/dashboard')

        // Verify empty state elements
        await expect(page.getByText('Welcome to TheAnswer.ai')).toBeVisible()
        await expect(page.getByText('Create your first chatflow')).toBeVisible()
        await expect(page.getByRole('button', { name: 'Get Started' })).toBeVisible()

        // Verify credits display
        await expect(page.getByText('10,000 credits remaining')).toBeVisible()

        // Click get started
        await page.getByRole('button', { name: 'Get Started' }).click()

        // Should navigate to chatflow builder
        await expect(page).toHaveURL('/canvas')
        await expect(page.getByText('Drag and drop nodes')).toBeVisible()
    })
})
```

### 2. Credit Consumption Flow

```typescript
// tests/e2e/credit-consumption.spec.ts
test.describe('Credit Consumption', () => {
    test('user consuming credits shows correct updates', async ({ page }) => {
        // Setup user with specific credit amount
        const user = await TestDataFactory.createUserWithCredits({
            credits: 1800
        })

        await authenticateAs(page, user.email)
        await page.goto('/dashboard')

        // Initial state
        await expect(page.getByText('1,800 credits remaining')).toBeVisible()

        // Configure fake AI to use 300 credits
        await configureFakeAiResponse('test question', {
            content: 'Test response',
            tokens: 3000,
            credits: 300
        })

        // Make AI request
        await page.goto(`/chat/${user.defaultChatflowId}`)
        await page.fill('[data-testid="chat-input"]', 'test question')
        await page.press('[data-testid="chat-input"]', 'Enter')

        // Wait for response
        await expect(page.getByText('Test response')).toBeVisible()

        // Navigate back to dashboard
        await page.goto('/dashboard')

        // Verify credits updated
        await expect(page.getByText('1,500 credits remaining')).toBeVisible()

        // Verify usage dashboard shows the consumption
        await page.click('[data-testid="usage-tab"]')
        await expect(page.getByText('300 credits used')).toBeVisible()
    })
})
```

### 3. Permission Block

```typescript
// tests/e2e/permissions-block.spec.ts
test.describe('Permission Enforcement', () => {
    test.use({ storageState: 'playwright/.auth/regular-user.json' })

    test('regular user blocked from admin actions', async ({ page }) => {
        // Try to access admin page
        await page.goto('/admin/organizations')

        // Should see access denied
        await expect(page.getByText('Access Denied')).toBeVisible()
        await expect(page.getByText('You do not have permission')).toBeVisible()

        // Try direct API call
        const response = await page.request.get('/api/v1/admin/organizations')
        expect(response.status()).toBe(403)
    })

    test('user can only see own chatflows', async ({ page, request }) => {
        // Create chatflow for different user
        const otherUser = await TestDataFactory.createUserWithCredits({
            email: 'other@test.com'
        })

        const otherChatflow = await request.post('/api/v1/chatflows', {
            data: {
                name: 'Other User Chatflow',
                flowData: '{}',
                userId: otherUser.id
            }
        })

        // Go to chatflows page
        await page.goto('/chatflows')

        // Should not see other user's chatflow
        await expect(page.getByText('Other User Chatflow')).not.toBeVisible()

        // Try to access other user's chatflow directly
        await page.goto(`/canvas/${otherChatflow.id}`)
        await expect(page.getByText('Not Found')).toBeVisible()
    })
})
```

---

## CI/CD Strategy

### PR Pipeline (Fast & Essential)

```yaml
# .github/workflows/pr.yml
name: PR Tests
on: [pull_request]

jobs:
    unit-tests:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v4
            - uses: actions/setup-node@v4
              with:
                  node-version: '20'
                  cache: 'pnpm'

            - run: pnpm install
            - run: pnpm test:unit
            # Fast: <2 minutes

    api-tests:
        runs-on: ubuntu-latest
        services:
            postgres:
                image: postgres:15
                env:
                    POSTGRES_PASSWORD: test
                options: >-
                    --health-cmd pg_isready
                    --health-interval 10s
                    --health-timeout 5s
                    --health-retries 5

        steps:
            - uses: actions/checkout@v4
            - run: pnpm install
            - run: pnpm db:migrate:test
            - run: pnpm test:api
            # Medium: <5 minutes

    smoke-e2e:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v4
            - run: pnpm install
            - run: pnpm build
            - run: pnpm playwright install
            - run: pnpm test:e2e:smoke
            # Critical paths only: <3 minutes
```

### Nightly Pipeline (Comprehensive)

```yaml
# .github/workflows/nightly.yml
name: Nightly Full Test Suite
on:
  schedule:
    - cron: '0 2 * * *'  # 2 AM daily

jobs:
  full-e2e-suite:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pnpm install
      - run: pnpm build
      - run: pnpm playwright install
      - run: pnpm test:e2e:full
      # All E2E tests: <15 minutes

  api-canary-tests:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - run: pnpm test:api:canary
      # Optional: Test against real APIs with test accounts
      env:
        OPENAI_API_KEY: ${{ secrets.OPENAI_TEST_KEY }}
        STRIPE_SECRET_KEY: ${{ secrets.STRIPE_TEST_KEY }}
```

### Test Categories

```json
// package.json scripts
{
    "test:unit": "jest --testPathPattern=unit",
    "test:api": "jest --testPathPattern=api",
    "test:e2e:smoke": "playwright test --grep @smoke",
    "test:e2e:full": "playwright test",
    "test:e2e:auth": "playwright test --grep @auth",
    "test:e2e:billing": "playwright test --grep @billing"
}
```

```typescript
// Mark critical tests
test('new user onboarding @smoke @auth', async ({ page }) => {
    // Critical path test
})

test('credit consumption @smoke @billing', async ({ page }) => {
    // Critical billing test
})

test('admin dashboard layout @full', async ({ page }) => {
    // Comprehensive but not critical
})
```

---

## Getting Started Exercise

### Step 1: Record Your First Test

**Goal**: Build confidence with Playwright by recording a simple flow.

```bash
# 1. Start your local development server
pnpm dev

# 2. Record a test by interacting with the UI
npx playwright codegen http://localhost:3000

# This opens a browser where you can:
# - Click around the UI
# - Playwright generates test code automatically
# - Copy the generated code when done
```

### Step 2: Improve the Generated Test

Playwright generates brittle selectors. Let's fix them:

**Generated (Bad):**

```typescript
await page.click('text=Login')
await page.fill('input[type="email"]', 'test@example.com')
await page.click('button >> nth=2')
```

**Improved (Good):**

```typescript
await page.getByRole('button', { name: 'Login' }).click()
await page.getByLabel('Email address').fill('test@example.com')
await page.getByRole('button', { name: 'Sign In' }).click()
```

### Step 3: Add Meaningful Assertions

**Generated (Weak):**

```typescript
await page.waitForSelector('text=Dashboard')
```

**Improved (Strong):**

```typescript
// Wait for navigation and verify we're on the right page
await expect(page).toHaveURL('/dashboard')

// Verify key elements are present
await expect(page.getByText('Welcome back')).toBeVisible()
await expect(page.getByText(/\d+,?\d* credits remaining/)).toBeVisible()

// Verify user can interact with main features
await expect(page.getByRole('button', { name: 'Create Chatflow' })).toBeEnabled()
```

### Step 4: Your First Complete Test

Create `tests/getting-started.spec.ts`:

```typescript
import { test, expect } from '@playwright/test'

test.describe('Getting Started Exercise', () => {
    test('basic login and dashboard navigation', async ({ page }) => {
        // 1. Navigate to login
        await page.goto('/login')

        // 2. Verify login page loaded
        await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible()

        // 3. Fill login form (you'll need test credentials)
        await page.getByLabel('Email').fill(process.env.TEST_USER_EMAIL!)
        await page.getByLabel('Password').fill(process.env.TEST_USER_PASSWORD!)

        // 4. Submit and wait for redirect
        await page.getByRole('button', { name: 'Sign In' }).click()
        await expect(page).toHaveURL('/dashboard')

        // 5. Verify dashboard elements
        await expect(page.getByText('Dashboard')).toBeVisible()
        await expect(page.getByText(/credits remaining/)).toBeVisible()

        // 6. Navigate to chatflows
        await page.getByRole('link', { name: 'Chatflows' }).click()
        await expect(page).toHaveURL('/chatflows')

        // 7. Verify chatflows page
        await expect(page.getByRole('heading', { name: 'Chatflows' })).toBeVisible()
        await expect(page.getByRole('button', { name: 'Create New' })).toBeVisible()
    })
})
```

### Step 5: Run Your Test

```bash
# Run in headed mode to see what happens
npx playwright test getting-started.spec.ts --headed

# Run in debug mode to step through
npx playwright test getting-started.spec.ts --debug

# Generate test report
npx playwright test getting-started.spec.ts --reporter=html
npx playwright show-report
```

### Step 6: Set Up CI

Add to your `package.json`:

```json
{
    "scripts": {
        "test:e2e:getting-started": "playwright test getting-started.spec.ts"
    }
}
```

Create `.github/workflows/getting-started.yml`:

```yaml
name: Getting Started Test
on: [push, pull_request]

jobs:
    test:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v4
            - uses: actions/setup-node@v4
              with:
                  node-version: '20'
                  cache: 'pnpm'

            - run: pnpm install
            - run: pnpm playwright install
            - run: pnpm test:e2e:getting-started
              env:
                  TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
                  TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
```

### What You've Learned

✅ **Recording tests**: Use `playwright codegen` to get started quickly  
✅ **Good selectors**: Prefer `getByRole`, `getByLabel` over brittle CSS selectors  
✅ **Strong assertions**: Test behavior, not just presence  
✅ **Local testing**: Debug with `--headed` and `--debug`  
✅ **CI integration**: Run tests automatically on every push

### Next Steps

1. **Add more assertions** to your test
2. **Create a second test** for a different user flow
3. **Practice test data setup** using the factory patterns
4. **Try API testing** with Playwright's request context
5. **Join the team** in building out the full test suite!

---

## Summary

This testing strategy provides:

-   **Clear direction**: Focus on critical user journeys first
-   **Practical patterns**: Real code examples you can copy
-   **Scalable architecture**: From simple tests to comprehensive suites
-   **Cost-effective approach**: Test billing logic without spending money
-   **Team onboarding**: Step-by-step exercise to build confidence

The key is to start small with the getting-started exercise, then gradually build up your test coverage following the patterns and principles outlined here.

Remember: **Perfect is the enemy of good**. Start with basic tests that catch real bugs, then improve them over time as you learn what breaks most often in your application.
