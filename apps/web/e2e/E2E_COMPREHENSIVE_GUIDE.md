# E2E Testing Comprehensive Guide

**Deep dive into TheAnswer.ai E2E testing architecture and advanced patterns**

## Recent Improvements (January 2025)

Major enhancements have been made to the test suite:

- ✅ **Centralized Timeout Constants** - All tests use `TIMEOUTS` from `helpers/selectors.ts`
- ✅ **Refactored Auth Helpers** - Login flow broken into smaller, composable functions
- ✅ **Enhanced Playwright Config** - Conditional browser strategy (CI: Chromium only, Local: All browsers)
- ✅ **No Arbitrary Waits** - All `waitForTimeout()` replaced with explicit condition waits
- ✅ **Comprehensive JSDoc** - All helper functions fully documented
- ✅ **Better Error Messages** - Database and auth helpers provide clear validation errors

For quick start and common patterns, see [TESTING_QUICKSTART.md](TESTING_QUICKSTART.md).

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
├── playwright.config.ts         # Main Playwright configuration (with TIMEOUTS import)
├── auth.setup.ts               # Authentication setup for all tests
├── .env.test                   # Environment variables for testing
├── helpers/                    # Reusable testing utilities (all with JSDoc)
│   ├── auth.ts                 # Authentication helpers (refactored into small functions)
│   ├── credentials.ts          # Credential management utilities
│   ├── database.ts            # Enhanced database operations
│   ├── test-db.ts            # Low-level database API calls
│   └── selectors.ts           # UI selectors & TIMEOUTS constants
├── tests/                     # Test suites organized by feature
│   ├── auth.spec.ts          # Authentication tests
│   └── credential-modal/     # Feature-specific tests
│       ├── autoload.spec.ts           # Uses TIMEOUTS constants
│       ├── list-loading.spec.ts       # Uses refactored helpers
│       ├── select-credential.spec.ts
│       ├── add-new-credential.spec.ts
│       ├── assign-and-continue.spec.ts
│       └── cancel.spec.ts
└── .auth/                     # Stored authentication state
    └── user.json             # Cached login sessions
```

**Key changes:**
- All test files now use `TIMEOUTS` constants instead of hardcoded values
- Auth helpers refactored into composable functions (`fillEmailStep`, `fillPasswordStep`, etc.)
- Playwright config imports `TIMEOUTS` for consistent assertion timeouts
- All helpers have comprehensive JSDoc documentation

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

For detailed usage examples, see [TESTING_QUICKSTART.md - Using Helper Functions](TESTING_QUICKSTART.md#using-helper-functions).

### Authentication Helper (`auth.ts`)

**Recent improvements:**
- Refactored into smaller, composable functions
- All functions use `TIMEOUTS` constants
- Comprehensive JSDoc documentation
- 3-level organization fallback strategy

```typescript
import { loginWithTestUser, loginAsUser, TEST_USERS } from '../helpers/auth'

// Login as different user types
await loginWithTestUser(page, 'admin')    // Enterprise admin
await loginWithTestUser(page, 'builder')  // Content builder
await loginWithTestUser(page, 'member')   // Regular member

// Force fresh login (clears cookies)
await loginWithTestUser(page, 'admin', true)

// Direct login with credentials
await loginAsUser(page, 'user@example.com', 'password', 'org-id')
```

**Composable functions** (used internally, but available for advanced use):
- `fillEmailStep()` - Handle email input step
- `fillPasswordStep()` - Handle password input step
- `handleOrganizationSelection()` - Multi-strategy org selection
- `waitForAuthRedirect()` - Verify redirect completion

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

**New in January 2025:** `TIMEOUTS` constants

```typescript
import {
    MODAL_TITLES,
    CREDENTIAL_LABELS,
    TEST_IDS,
    BUTTON_TEXTS,
    TIMEOUTS  // ← NEW: Centralized timeout constants
} from '../helpers/selectors'

// Use centralized selectors
const modal = page.getByRole('dialog', { name: MODAL_TITLES.credentials })
const openaiCard = getCredentialCard(modal, CREDENTIAL_LABELS.openai)
const loadingSpinner = modal.getByTestId(TEST_IDS.credentialsLoading)

// Use TIMEOUTS instead of hardcoded values
await expect(modal).toBeVisible({ timeout: TIMEOUTS.MODAL_APPEAR })
await page.waitForURL(/\/chat\//, { timeout: TIMEOUTS.LONG })
```

**Available TIMEOUTS:**
| Constant | Duration | Use Case |
|----------|----------|----------|
| `SHORT` | 5s | Quick UI updates |
| `MEDIUM` | 10s | Standard operations |
| `LONG` | 20s | Complex operations |
| `AUTH_REDIRECT` | 15s | Auth0 redirects |
| `MODAL_APPEAR` | 10s | Modal visibility |
| `PAGE_LOAD` | 30s | Full page loads |
| `NETWORK_IDLE` | 30s | Network idle |

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

**Use `TIMEOUTS` constants for all waits:**

```typescript
import { TIMEOUTS } from '../helpers/selectors'

// ✅ Wait for specific states with proper timeouts
await page.waitForURL(/\/chat\//, { timeout: TIMEOUTS.LONG })
await expect(element).toBeVisible({ timeout: TIMEOUTS.MODAL_APPEAR })
await waitForLoadingToResolve(modal, TIMEOUTS.MEDIUM)

// ❌ Avoid hardcoded timeouts
await expect(element).toBeVisible({ timeout: 10000 })  // Don't do this

// ❌ NEVER use arbitrary waits
await page.waitForTimeout(5000)  // Removed from all tests
```

**Why this matters:**
- Consistent timeout behavior across all tests
- Easy to adjust globally if needed
- Self-documenting code (TIMEOUTS.MODAL_APPEAR vs 10000)
- Matches Playwright config expect timeout

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

## 📝 Summary of Improvements (Waves 1-4)

### Wave 1: Centralized Timeout Constants
- Added `TIMEOUTS` constant to `helpers/selectors.ts`
- Defined 7 timeout constants for different use cases
- Added JSDoc documentation for all constants
- Updated all existing tests to use constants
- Improved error handling in helper functions

### Wave 2: Enhanced Playwright Configuration
- Updated timeout configuration to use `TIMEOUTS.MEDIUM` (10s)
- Added conditional browser strategy (CI vs local)
- Enhanced comments explaining timeout and browser choices
- Improved web server configuration

### Wave 3: Refactored Auth Helpers
- Split `loginAsUser` into smaller functions:
  - `fillEmailStep()` - Email input handling
  - `fillPasswordStep()` - Password input handling
  - `handleOrganizationSelection()` - Multi-strategy org selection
  - `waitForAuthRedirect()` - Redirect verification
- Added comprehensive JSDoc to all functions
- Improved organization selection with 3-level fallback
- Better error messages and console logging

### Wave 4: Updated Test Files
- All test files now use `TIMEOUTS` constants
- Updated imports to include new constants
- Removed all hardcoded timeout values
- Consistent timeout usage across all tests

### Wave 5: Documentation Consolidation (This Update)
- Updated README.md with improvements summary
- Enhanced TESTING_QUICKSTART.md with helper function guide
- Updated E2E_COMPREHENSIVE_GUIDE.md with recent changes
- Added cross-references between documentation files
- Created helper function reference tables

## 📚 Documentation Hierarchy

The E2E documentation is organized in three levels:

1. **[README.md](README.md)** - Quick start (5 minutes)
   - Installation and setup
   - Running tests
   - Common commands
   - Helper function reference table
   - Link to detailed guides

2. **[TESTING_QUICKSTART.md](TESTING_QUICKSTART.md)** - Common patterns (15 minutes)
   - Step-by-step setup
   - Using helper functions
   - Example test structure
   - Pro tips and troubleshooting
   - Link to comprehensive guide

3. **[E2E_COMPREHENSIVE_GUIDE.md](E2E_COMPREHENSIVE_GUIDE.md)** - Advanced topics (this file)
   - Architecture deep dive
   - Helper library details
   - Advanced patterns
   - Page Object Model
   - Custom fixtures

**Navigation:**
- Need to get started? → [README.md](README.md)
- Need common patterns? → [TESTING_QUICKSTART.md](TESTING_QUICKSTART.md)
- Need advanced topics? → You're reading it!

---

## 📝 Summary

This E2E testing framework provides:
- **🏗️ Robust Architecture**: Modular helpers with clear separation of concerns
- **🔐 Enterprise Auth**: Full Auth0 integration with role-based testing
- **🗄️ Database Management**: Complete reset/seed cycle for test isolation
- **📚 Rich Helpers**: Domain-specific utilities for common testing patterns
- **🎯 Best Practices**: Comprehensive patterns for reliable test development
- **⏱️ Centralized Timeouts**: Consistent timeout behavior across all tests
- **📖 Comprehensive Documentation**: JSDoc on all functions, multiple documentation levels

The system is designed to scale with your application while maintaining test reliability and developer productivity. Follow the patterns outlined in this guide to ensure consistent, maintainable tests that accurately reflect your application's behavior.

For questions or contributions, refer to the existing test examples in `/tests/credential-modal/` for practical implementation patterns.
