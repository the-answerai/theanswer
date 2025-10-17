# E2E Testing Comprehensive Guide

## 📋 Table of Contents
- [Architecture Overview](#architecture-overview)
- [Quick Start](#quick-start)
- [How Tests Work](#how-tests-work)
- [Database Management](#database-management)
- [Authentication System](#authentication-system)
- [Helper Libraries](#helper-libraries)
- [Creating New Test Scenarios](#creating-new-test-scenarios)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [Advanced Patterns](#advanced-patterns)

## 🏗️ Architecture Overview

Our E2E testing infrastructure is built on **Playwright** with a sophisticated helper system designed for enterprise-grade testing. The architecture follows domain-driven design principles with clear separation of concerns.

### Key Components
- **Playwright Configuration**: Multi-browser testing with persistent authentication
- **Helper Libraries**: Modular utilities for auth, database, UI interactions
- **Database Management**: Complete reset/seed cycle for test isolation
- **Authentication System**: Auth0 integration with role-based testing
- **Test Organization**: Feature-based directory structure with sequential naming

### Directory Structure
```
apps/web/e2e/
├── playwright.config.ts         # Main Playwright configuration
├── auth.setup.ts               # Authentication setup for all tests
├── .env.test                   # Environment variables for testing
├── helpers/                    # Reusable testing utilities
│   ├── auth.ts                 # Authentication helpers
│   ├── credentials.ts          # Credential management utilities
│   ├── database.ts            # Enhanced database operations
│   ├── test-db.ts            # Low-level database API calls
│   └── selectors.ts           # UI element selectors & constants
├── tests/                     # Test suites organized by feature
│   ├── auth.spec.ts          # Authentication tests
│   └── Screen 1 - Credential Modal/  # Feature-specific tests
│       ├── creds-001.autoload.spec.ts
│       ├── creds-002.list-loading.spec.ts
│       ├── creds-003.select-credential.spec.ts
│       ├── creds-004.add-new-credential.spec.ts
│       ├── creds-005.assign-and-continue.spec.ts
│       └── creds-006.cancel.spec.ts
└── .auth/                     # Stored authentication state
    └── user.json             # Cached login sessions
```

## 🚀 Quick Start

### 1. Environment Setup
```bash
# Copy environment template
cp apps/web/e2e/env.example apps/web/e2e/.env.test

# Install Playwright browsers
pnpm test:e2e:setup

# Verify setup
pnpm test:e2e:check
```

### 2. Run Tests
```bash
# Run all tests
pnpm test:e2e

# Run with UI (development mode)
pnpm test:e2e:dev

# Run in headed browser mode
pnpm test:e2e:headed

# Debug mode (step-by-step)
pnpm test:e2e:debug

# View test reports
pnpm test:e2e:report
```

### 3. Required Environment Variables
```bash
# Auth0 Configuration
AUTH0_SECRET=your_auth0_secret
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=https://your-tenant.us.auth0.com
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret

# Test Users (see env.example for complete list)
TEST_USER_ENTERPRISE_ADMIN_EMAIL=admin@example.com
TEST_USER_ENTERPRISE_ADMIN_PASSWORD=shared_password
TEST_ORGANIZATION_ID=your_org_id
```

## 🔧 How Tests Work

### Test Lifecycle
1. **Setup Phase**: Auth setup runs once, authenticates and saves session
2. **Before Each Test**: Database reset and seed with test data
3. **Test Execution**: Uses cached authentication + fresh data
4. **Cleanup**: Automatic cleanup between tests

### Authentication Flow
```typescript
// All tests use persistent authentication from setup
// Individual tests can login as different users if needed
await loginWithTestUser(page, 'admin')  // Uses cached session when possible
await loginWithTestUser(page, 'member', true)  // Fresh login when needed
```

### Test Structure Pattern
```typescript
import { test, expect } from '@playwright/test'
import { resetAndSeed, loginWithTestUser } from '../helpers'
import { MODAL_TITLES, CREDENTIAL_LABELS } from '../helpers/selectors'

test.describe('Feature Name', () => {
    test.beforeEach(async ({ page }) => {
        // Setup clean state with specific test data
        await resetAndSeed({
            chatflow: { name: 'Test Chatflow Name' },
            credentials: {
                openai: { assigned: true, name: 'Test OpenAI' },
                jira: { create: false }
            }
        })

        // Authenticate with appropriate user role
        await loginWithTestUser(page, 'admin')
        await page.waitForURL(/\/chat\//, { timeout: 20000 })
    })

    test('should perform specific behavior', async ({ page }) => {
        // Test implementation using helpers
        const modal = page.getByRole('dialog', { name: MODAL_TITLES.credentials })
        await expect(modal).toBeVisible({ timeout: 10000 })
        // ... rest of test
    })
})
```

## 🗄️ Database Management

### Core Functions

#### `resetAndSeed(overrides?)`
Resets database and seeds with custom data. This is the primary function for test setup.

```typescript
await resetAndSeed({
    chatflow: { name: 'My Test Chatflow' },
    credentials: {
        openai: { assigned: true, name: 'Test OpenAI Key' },
        jira: { assigned: false, name: 'Unassigned Jira' },
        slack: { create: false }  // Don't create this credential
    }
})
```

#### `resetOnly()`
Clears all test data without seeding. Use sparingly—most tests should jump straight to one of the combined helpers below.

```typescript
await resetOnly()  // Clean slate
```

#### `seedScenario(scenario, userType?)`
Applies a predefined scenario to the currently logged-in user. Call this *after* `resetOnly()` and logging in so the user record exists.

```typescript
await seedScenario('user-with-both-credentials')
```

> **Deprecated:** `seedOnly` still exists for backward compatibility, but new tests should prefer `resetAndSeed` (reset + payload) or the `resetOnly()` + `seedScenario()` flow so the "reset → seed → test" steps stay explicit.

### Credential Configuration Options

```typescript
type CredentialSeedConfig = {
    assigned?: boolean        // Whether credential is assigned to user
    name?: string            // Custom credential name
    create?: boolean         // Whether to create the credential (default: true)
}

// Available credential types:
const credentialTypes = [
    'openai', 'exa', 'jira', 'confluence',
    'github', 'slack', 'linear', 'notion'
]
```

### Predefined Scenarios
```typescript
// Use predefined scenarios for common test setups (after login)
await seedScenario('user-with-both-credentials')
await seedScenario('user-with-openai')
await seedScenario('user-with-all-but-slack-assigned')
```

### Database API Endpoints
The system uses HTTP endpoints for database operations:
- `POST /api/v1/__test__/reset` - Reset database
- `POST /api/v1/__test__/seed` - Seed with data payload
- Base URL: `http://localhost:4000` (configurable via `API_URL`)

## 🔐 Authentication System

### Test Users
Three main user roles with different permissions:

```typescript
const TEST_USERS = {
    admin: {
        email: process.env.TEST_USER_ENTERPRISE_ADMIN_EMAIL,
        role: 'admin',
        permissions: ['org:manage', 'user:manage', 'chatflow:manage']
    },
    builder: {
        email: process.env.TEST_USER_ENTERPRISE_BUILDER_EMAIL,
        role: 'builder',
        permissions: ['chatflow:manage', 'credential:manage']
    },
    member: {
        email: process.env.TEST_USER_ENTERPRISE_MEMBER_EMAIL,
        role: 'member',
        permissions: ['chatflow:use']
    }
}
```

### Authentication Functions

#### `loginWithTestUser(page, userType, fresh?)`
Primary login function with role-based user selection.

```typescript
// Use cached authentication (faster)
await loginWithTestUser(page, 'admin')

// Force fresh login (clears cookies first)
await loginWithTestUser(page, 'builder', true)
```

#### `loginAsUser(page, email, password, orgId?)`
Direct login with specific credentials.

```typescript
await loginAsUser(page, 'user@example.com', 'password', 'org-123')
```

### Auth0 Integration
- **Multi-step flow**: Email → Password → Organization Selection
- **Organization handling**: Automatic selection for enterprise users
- **Error handling**: Robust fallback selectors and timeout management
- **Session persistence**: Stored in `.auth/user.json` for reuse

## 📚 Helper Libraries

### Authentication Helper (`auth.ts`)
```typescript
import { loginWithTestUser, TEST_USERS } from '../helpers/auth'

// Login as different user types
await loginWithTestUser(page, 'admin')    // Enterprise admin
await loginWithTestUser(page, 'builder')  // Content builder
await loginWithTestUser(page, 'member')   // Regular member
```

### Database Helper (`database.ts`)
```typescript
import { resetAndSeed, resetOnly, seedOnly } from '../helpers/database'

// Common patterns
await resetAndSeed()  // Clean state with default data
await resetAndSeed({ chatflow: { name: 'Custom Flow' }})  // Custom chatflow
await resetOnly()     // Just clear everything
```

### Credentials Helper (`credentials.ts`)
```typescript
import {
    waitForLoadingToResolve,
    getCredentialCard,
    expectCredentialStatus,
    expectModalVisible
} from '../helpers/credentials'

// Wait for credential loading
await waitForLoadingToResolve(modal)

// Get specific credential card
const openaiCard = getCredentialCard(modal, CREDENTIAL_LABELS.openai)

// Verify credential status
await expectCredentialStatus(modal, 'openai', 'assigned')
```

### Selectors Helper (`selectors.ts`)
```typescript
import {
    MODAL_TITLES,
    CREDENTIAL_LABELS,
    TEST_IDS,
    BUTTON_TEXTS
} from '../helpers/selectors'

// Use centralized selectors
const modal = page.getByRole('dialog', { name: MODAL_TITLES.credentials })
const openaiCard = getCredentialCard(modal, CREDENTIAL_LABELS.openai)
const loadingSpinner = modal.getByTestId(TEST_IDS.credentialsLoading)
```

## ✨ Creating New Test Scenarios

### 1. File Naming Convention
Follow the sequential pattern: `feature-###.description.spec.ts`

```typescript
// Example: creds-007.bulk-assignment.spec.ts
```

### 2. Basic Test Template
```typescript
import { test, expect } from '@playwright/test'
import {
    resetAndSeed,
    loginWithTestUser,
    expectModalVisible
} from '../helpers'
import { MODAL_TITLES } from '../helpers/selectors'

test.describe('Feature: New Functionality', () => {
    test.beforeEach(async ({ page }) => {
        console.log('🗑️ Setting up test data...')
        await resetAndSeed({
            chatflow: { name: 'Test Feature Chatflow' },
            credentials: {
                openai: { assigned: true },
                jira: { assigned: false }
            }
        })

        console.log('🔐 Authenticating user...')
        await loginWithTestUser(page, 'admin')
        await page.waitForURL(/\/chat\//, { timeout: 20000 })

        console.log('✅ Setup complete')
    })

    test('should handle new functionality', async ({ page }) => {
        // Your test implementation
        const modal = page.getByRole('dialog', { name: MODAL_TITLES.credentials })
        await expectModalVisible(page)

        // Test specific behavior
        // ...
    })
})
```

### 3. Advanced Test Patterns

#### Multiple User Scenarios
```typescript
test('should handle multi-user workflow', async ({ page, context }) => {
    // Test as admin
    await loginWithTestUser(page, 'admin')
    // ... admin actions

    // Switch to different user
    const memberPage = await context.newPage()
    await loginWithTestUser(memberPage, 'member', true)  // Fresh login
    // ... member actions
})
```

#### Custom Data Scenarios
```typescript
test.beforeEach(async ({ page }) => {
    await resetAndSeed({
        chatflow: {
            name: 'Complex Scenario',
            template: 'custom-template-id'
        },
        credentials: {
            openai: {
                assigned: true,
                name: 'Production OpenAI Key',
                apiKey: 'test-key-123'
            },
            jira: {
                assigned: false,
                name: 'Staging Jira Instance',
                baseUrl: 'https://staging.atlassian.net'
            },
            slack: { create: false }  // Don't create
        }
    })
})
```

#### Dialog and Alert Handling
```typescript
test('should handle browser dialogs', async ({ page }) => {
    // Setup dialog handler before triggering action
    page.on('dialog', async dialog => {
        console.log(`Dialog: ${dialog.type()} - ${dialog.message()}`)
        await dialog.accept()
    })

    // Trigger action that shows dialog
    await page.click('[data-testid="delete-button"]')
})
```

### 4. Debugging New Tests

#### Comprehensive Logging
```typescript
test('debugging example', async ({ page }) => {
    console.log('🔍 Starting test step 1...')
    // Step 1 implementation

    console.log('📝 Current URL:', page.url())
    console.log('🎯 Looking for element...')

    const element = page.locator('[data-testid="target"]')
    await expect(element).toBeVisible({ timeout: 10000 })

    console.log('✅ Step 1 complete')
})
```

#### Screenshot Debugging
```typescript
test('visual debugging', async ({ page }) => {
    // Take screenshot at specific points
    await page.screenshot({ path: 'debug-step1.png' })

    // Test actions
    await someComplexInteraction()

    await page.screenshot({ path: 'debug-step2.png' })
})
```

## 📋 Best Practices

### 1. Test Isolation
- **Always use `resetAndSeed()`** in beforeEach for clean state
- **Avoid test interdependencies** - each test should run independently
- **Use fresh logins** when testing different user permissions

### 2. Selector Strategy
```typescript
// ✅ Good: Semantic selectors
const modal = page.getByRole('dialog', { name: 'Credential Modal' })
const button = page.getByRole('button', { name: 'Save' })

// ✅ Good: Test IDs for dynamic content
const loading = page.getByTestId('credentials-loading')

// ❌ Avoid: Brittle CSS selectors
const button = page.locator('.btn.btn-primary.save-button')
```

### 3. Wait Strategies
```typescript
// ✅ Wait for specific states
await page.waitForURL(/\/chat\//)
await expect(element).toBeVisible({ timeout: 10000 })
await waitForLoadingToResolve(modal)

// ❌ Avoid arbitrary timeouts
await page.waitForTimeout(5000)  // Use only when necessary
```

### 4. Error Handling
```typescript
test('robust error handling', async ({ page }) => {
    try {
        await someFlakyCOperation()
    } catch (error) {
        console.log('❌ Operation failed, taking screenshot...')
        await page.screenshot({ path: 'error-state.png' })
        throw error  // Re-throw to fail test
    }
})
```

### 5. Data Management
```typescript
// ✅ Explicit test data setup
await resetAndSeed({
    credentials: {
        openai: { assigned: true, name: 'Test Key for Feature X' }
    }
})

// ✅ Use meaningful names for test data
chatflow: { name: 'CREDS-004 Add New Credential Test' }
```

## 🚨 Troubleshooting

### Common Issues

#### Authentication Failures
```bash
# Check environment variables
grep -E "TEST_USER|AUTH0" apps/web/e2e/.env.test

# Verify Auth0 setup
pnpm test:e2e:auth

# Clear cached auth state
rm apps/web/e2e/.auth/user.json
```

#### Database Connection Issues
```bash
# Verify API endpoint
curl -X POST http://localhost:4000/api/v1/__test__/reset

# Check server logs
pnpm dev  # Ensure dev server is running
```

#### Element Selection Problems
```typescript
// Debug selector issues
console.log('Available elements:', await page.locator('[role="button"]').count())
await page.screenshot({ path: 'selector-debug.png' })

// Use multiple fallback selectors
const button = page.locator('button:has-text("Save"), [data-testid="save-btn"]')
```

### Debugging Commands
```bash
# Run specific test with debug info
pnpm test:e2e tests/auth.spec.ts --debug

# Run in headed mode to see browser
pnpm test:e2e:headed

# Generate detailed trace
pnpm test:e2e --trace on
```

## 🎯 Advanced Patterns

### 1. Page Object Model
```typescript
// Create reusable page objects
class CredentialModalPage {
    constructor(private page: Page) {}

    async openModal() {
        await this.page.click('[data-testid="open-credentials"]')
        await expect(this.modal).toBeVisible()
    }

    get modal() {
        return this.page.getByRole('dialog', { name: MODAL_TITLES.credentials })
    }

    async selectCredential(type: string, value: string) {
        const card = getCredentialCard(this.modal, CREDENTIAL_LABELS[type])
        const dropdown = card.getByRole('combobox')
        await dropdown.click()
        await this.page.getByRole('option', { name: value }).click()
    }
}

// Usage in tests
test('page object example', async ({ page }) => {
    const credentialModal = new CredentialModalPage(page)
    await credentialModal.openModal()
    await credentialModal.selectCredential('openai', 'Test Key')
})
```

### 2. Custom Fixtures
```typescript
// Define custom fixtures
import { test as base } from '@playwright/test'

interface TestFixtures {
    authenticatedPage: Page
    credentialModal: CredentialModalPage
}

export const test = base.extend<TestFixtures>({
    authenticatedPage: async ({ page }, use) => {
        await loginWithTestUser(page, 'admin')
        await page.waitForURL(/\/chat\//)
        await use(page)
    },

    credentialModal: async ({ authenticatedPage }, use) => {
        const modal = new CredentialModalPage(authenticatedPage)
        await use(modal)
    }
})

// Usage
test('fixture example', async ({ credentialModal }) => {
    await credentialModal.openModal()
    // Test implementation
})
```

### 3. API Testing Integration
```typescript
// Combine E2E with API testing
test('full stack integration', async ({ page, request }) => {
    // Setup via API
    const response = await request.post('/api/v1/__test__/seed', {
        data: { credentials: { openai: { assigned: true }}}
    })
    expect(response.ok()).toBeTruthy()

    // Test UI behavior
    await loginWithTestUser(page, 'admin')
    // ... UI assertions

    // Verify API state
    const credentials = await request.get('/api/v1/credentials')
    const data = await credentials.json()
    expect(data.length).toBe(1)
})
```

---

## 📝 Summary

This E2E testing framework provides:
- **🏗️ Robust Architecture**: Modular helpers with clear separation of concerns
- **🔐 Enterprise Auth**: Full Auth0 integration with role-based testing
- **🗄️ Database Management**: Complete reset/seed cycle for test isolation
- **📚 Rich Helpers**: Domain-specific utilities for common testing patterns
- **🎯 Best Practices**: Comprehensive patterns for reliable test development

The system is designed to scale with your application while maintaining test reliability and developer productivity. Follow the patterns outlined in this guide to ensure consistent, maintainable tests that accurately reflect your application's behavior.

For questions or contributions, refer to the existing test examples in `/tests/Screen 1 - Credential Modal/` for practical implementation patterns.
