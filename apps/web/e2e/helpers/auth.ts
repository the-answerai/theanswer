import { expect, Page } from '@playwright/test'
import { TIMEOUTS, FORM_SELECTORS, AUTH_SELECTORS } from './selectors'

/**
 * Robust authentication helpers for E2E testing
 * Extracted from Brad's implementation in auth.spec.ts and auth.setup.ts
 */

/**
 * Validates that required test environment variables are set
 * Runs on module load to warn early about missing configuration
 */
const validateEnvVars = () => {
    const required = [
        'TEST_USER_ENTERPRISE_ADMIN_EMAIL',
        'TEST_USER_ENTERPRISE_BUILDER_EMAIL',
        'TEST_USER_ENTERPRISE_MEMBER_EMAIL',
        'TEST_USER_PASSWORD'
    ]
    const missing = required.filter((key) => !process.env[key])
    if (missing.length > 0) {
        console.warn(`⚠️ Missing test environment variables: ${missing.join(', ')}`)
        console.warn('Copy apps/web/e2e/env.example to apps/web/.env.test and configure')
    }
}

// Run validation on module load
validateEnvVars()

interface LoginOptions {
    email: string
    password: string
    organizationId?: string
}

export interface TestUser {
    email: string
    password: string
    role: 'admin' | 'builder' | 'member'
    organizationId?: string
    organizationName?: string
    name?: string
}

/**
 * Test user configurations from environment variables
 */
export const TEST_USERS = {
    admin: {
        email: process.env.TEST_USER_ENTERPRISE_ADMIN_EMAIL!,
        password: process.env.TEST_USER_PASSWORD!,
        role: 'admin' as const,
        organizationId: process.env.TEST_ENTERPRISE_AUTH0_ORG_ID,
        organizationName: process.env.TEST_ENTERPRISE_ORG_NAME
    },
    builder: {
        email: process.env.TEST_USER_ENTERPRISE_BUILDER_EMAIL!,
        password: process.env.TEST_USER_PASSWORD!,
        role: 'builder' as const,
        organizationId: process.env.TEST_ENTERPRISE_AUTH0_ORG_ID,
        organizationName: process.env.TEST_ENTERPRISE_ORG_NAME
    },
    member: {
        email: process.env.TEST_USER_ENTERPRISE_MEMBER_EMAIL!,
        password: process.env.TEST_USER_PASSWORD!,
        role: 'member' as const,
        organizationId: process.env.TEST_ENTERPRISE_AUTH0_ORG_ID,
        organizationName: process.env.TEST_ENTERPRISE_ORG_NAME
    }
}

/**
 * Fills the email input on Auth0 login page and clicks Continue
 * @param page - Playwright page object
 * @param email - User email address
 * @throws {Error} If email input not found within timeout
 * @example
 * ```typescript
 * await fillEmailStep(page, 'user@example.com')
 * // Waits for email input, fills it, and clicks Continue button
 * ```
 */
export async function fillEmailStep(page: Page, email: string): Promise<void> {
    // Wait for Auth0 email input page to load
    await page.waitForSelector(FORM_SELECTORS.email, {
        timeout: TIMEOUTS.MEDIUM
    })

    // Fill email field
    const emailInput = page.locator(FORM_SELECTORS.email).first()
    await emailInput.fill(email)

    // Click Continue/Submit to proceed to password step
    const continueButton = page.locator(AUTH_SELECTORS.continueButton).first()
    await continueButton.click()
}

/**
 * Fills the password input on Auth0 login page and submits the form
 * @param page - Playwright page object
 * @param password - User password
 * @throws {Error} If password input not found within timeout
 * @example
 * ```typescript
 * await fillPasswordStep(page, 'secure-password-123')
 * // Waits for password input, fills it, and submits the form
 * ```
 */
export async function fillPasswordStep(page: Page, password: string): Promise<void> {
    // Wait for password input page to load
    await page.waitForSelector(FORM_SELECTORS.password, {
        timeout: TIMEOUTS.MEDIUM
    })

    // Fill password field
    const passwordInput = page.locator(FORM_SELECTORS.password).first()
    await passwordInput.fill(password)

    // Submit login form
    const submitButton = page.locator(AUTH_SELECTORS.submitButton).first()
    await submitButton.click()
}

/**
 * Selects an organization using its Auth0 organization ID (most precise method)
 * @param page - Playwright page object
 * @param orgId - Auth0 organization ID (e.g., "org_unQ8OLmTNsxVTJCT")
 * @returns {boolean} True if organization was selected, false if not found
 * @example
 * ```typescript
 * const selected = await selectOrganizationById(page, 'org_123abc')
 * if (selected) {
 *   console.log('Organization selected successfully')
 * } else {
 *   console.log('Organization not found, trying fallback methods')
 * }
 * ```
 */
async function selectOrganizationById(page: Page, orgId: string): Promise<boolean> {
    console.log(`Looking for organization with ID: ${orgId}`)

    try {
        // Wait for organization selection forms to appear
        await page.waitForSelector('form', { timeout: TIMEOUTS.SHORT })

        // Look for the form that contains a hidden input with the specific organization ID
        const targetForm = page.locator(`form:has(input[name="organization"][value="${orgId}"])`)

        if (await targetForm.isVisible({ timeout: TIMEOUTS.SHORT })) {
            console.log(`Found form with organization ID: ${orgId}`)

            // Find the submit button within this specific form and click it
            const submitButton = targetForm.locator('button[type="submit"]')
            if (await submitButton.isVisible({ timeout: TIMEOUTS.SHORT })) {
                const buttonText = await submitButton.textContent()
                console.log(`Clicking organization button: "${buttonText}" (ID: ${orgId})`)
                await submitButton.click()
                return true
            } else {
                console.log('Submit button not found in the target form')
                return false
            }
        } else {
            console.log(`Could not find form with organization ID: ${orgId}`)

            // Debug: Log all available organization IDs
            const allOrgInputs = page.locator(`form ${FORM_SELECTORS.organization}`)
            const orgCount = await allOrgInputs.count()
            console.log(`Found ${orgCount} organization forms. Available organization IDs:`)

            for (let i = 0; i < orgCount; i++) {
                const orgInput = allOrgInputs.nth(i)
                const orgIdValue = await orgInput.getAttribute('value')
                const form = orgInput.locator('..')
                const buttonText = await form
                    .locator('button span')
                    .textContent()
                    .catch(() => 'Unknown')
                console.log(`  - ID: ${orgIdValue}, Name: "${buttonText}"`)
            }

            return false
        }
    } catch (error) {
        console.log('selectOrganizationById error:', error instanceof Error ? error.message : String(error))
        return false
    }
}

/**
 * Selects an organization by display name (fallback method)
 * @param page - Playwright page object
 * @param orgName - Organization display name
 * @returns {boolean} True if organization was selected, false if not found
 * @example
 * ```typescript
 * const selected = await selectOrganizationByName(page, 'My Organization')
 * if (selected) {
 *   console.log('Organization selected by name')
 * }
 * ```
 */
async function selectOrganizationByName(page: Page, orgName: string): Promise<boolean> {
    console.log(`Attempting name-based selection: ${orgName}`)

    try {
        const nameBasedButton = page.locator(`button:has-text("${orgName}")`)
        if (await nameBasedButton.isVisible({ timeout: TIMEOUTS.SHORT })) {
            console.log(`Found organization by name: ${orgName}`)
            await nameBasedButton.click()
            return true
        } else {
            console.log(`Could not find organization with name: ${orgName}`)
            return false
        }
    } catch (error) {
        console.log('selectOrganizationByName error:', error instanceof Error ? error.message : String(error))
        return false
    }
}

/**
 * Selects the first available organization (last resort fallback)
 * @param page - Playwright page object
 * @returns {boolean} True if an organization was selected, false if none available
 * @example
 * ```typescript
 * const selected = await selectFirstAvailableOrganization(page)
 * if (selected) {
 *   console.log('Selected first available organization')
 * } else {
 *   console.log('No organizations available')
 * }
 * ```
 */
async function selectFirstAvailableOrganization(page: Page): Promise<boolean> {
    console.log('Attempting to select first available organization')

    try {
        const firstForm = page.locator('form').first()
        const firstButton = firstForm.locator('button[type="submit"]')
        if (await firstButton.isVisible({ timeout: TIMEOUTS.SHORT })) {
            const firstButtonText = await firstButton.textContent()
            console.log(`Selecting first available organization: "${firstButtonText}"`)
            await firstButton.click()
            return true
        } else {
            console.log('No organization forms found')
            return false
        }
    } catch (error) {
        console.log('selectFirstAvailableOrganization error:', error instanceof Error ? error.message : String(error))
        return false
    }
}

/**
 * Orchestrates organization selection with multiple fallback strategies
 * Tries in order: ID-based → Name-based → First available
 * @param page - Playwright page object
 * @param orgId - Optional Auth0 organization ID
 * @param orgName - Optional organization display name
 * @throws Does not throw - handles all errors internally and tries fallback strategies
 * @example
 * ```typescript
 * // Try ID-based selection first
 * await handleOrganizationSelection(page, 'org_123abc', 'My Organization')
 *
 * // Try name-based selection (no ID provided)
 * await handleOrganizationSelection(page, undefined, 'My Organization')
 *
 * // Select first available (no ID or name)
 * await handleOrganizationSelection(page)
 * ```
 */
export async function handleOrganizationSelection(page: Page, orgId?: string, orgName?: string): Promise<void> {
    try {
        // Strategy 1: Try ID-based selection (most precise)
        if (orgId) {
            const selectedById = await selectOrganizationById(page, orgId)
            if (selectedById) {
                console.log('Organization selected successfully using ID')
                return
            }
        }

        // Strategy 2: Try name-based selection (fallback)
        if (orgName) {
            const selectedByName = await selectOrganizationByName(page, orgName)
            if (selectedByName) {
                console.log('Organization selected successfully using name')
                return
            }
        }

        // Strategy 3: Select first available (last resort)
        const selectedFirst = await selectFirstAvailableOrganization(page)
        if (selectedFirst) {
            console.log('Organization selected successfully using first available')
            return
        }

        console.log('No organization selection was possible, proceeding anyway')
    } catch (error) {
        console.log('Organization selection error (will proceed):', error instanceof Error ? error.message : String(error))
    }
}

/**
 * Waits for Auth0 to redirect back to the application after login
 * @param page - Playwright page object
 * @throws {Error} If redirect doesn't complete within timeout
 * @example
 * ```typescript
 * await waitForAuthRedirect(page)
 * // Waits up to 15 seconds for redirect to localhost:3000
 * // Verifies we're no longer on auth0.com
 * ```
 */
export async function waitForAuthRedirect(page: Page): Promise<void> {
    // Wait for redirect back to application
    await page.waitForURL(/localhost:3000/, { timeout: TIMEOUTS.AUTH_REDIRECT })

    // Verify we're logged in and not on Auth0 anymore
    await expect(page).not.toHaveURL(/auth0\.com|\.auth0\.com/)
}

/**
 * Helper function to perform login with organization selection
 * Orchestrates the complete Auth0 login flow using smaller helper functions
 * @param page - Playwright page object
 * @param email - User email address
 * @param password - User password
 * @param orgId - Optional Auth0 organization ID for organization selection
 * @throws {Error} If any step of the login process fails
 * @example
 * ```typescript
 * // Login with specific organization
 * await loginAsUser(page, 'admin@example.com', 'password123', 'org_abc123')
 *
 * // Login without organization selection
 * await loginAsUser(page, 'user@example.com', 'password123')
 * ```
 */
export async function loginAsUser(page: Page, email: string, password: string, orgId?: string): Promise<void> {
    // Navigate to homepage - this will redirect to Auth0
    await page.goto('/')

    // Step 1: Fill email and continue
    await fillEmailStep(page, email)

    // Step 2: Fill password and submit
    await fillPasswordStep(page, password)

    // Step 3: Handle organization selection if present
    // Determine orgName from environment if not provided
    const orgName = process.env.TEST_ENTERPRISE_ORG_NAME
    await handleOrganizationSelection(page, orgId, orgName)

    // Step 4: Wait for redirect back to application
    await waitForAuthRedirect(page)
}

/**
 * Convenience function using test user configuration
 * @param page - Playwright page instance
 * @param userType - Type of test user to login as (admin/builder/member)
 * @param fresh - Whether to clear cookies before login for a fresh session
 */
export const loginWithTestUser = async (page: Page, userType: keyof typeof TEST_USERS = 'admin', fresh: boolean = false): Promise<void> => {
    const user = TEST_USERS[userType]
    if (!user.email || !user.password) {
        throw new Error(`Missing environment variables for ${userType} user`)
    }

    if (fresh) {
        await page.context().clearCookies()
    }

    return loginAsUser(page, user.email, user.password, user.organizationId)
}

// Backward compatibility with existing code
export const loginThroughAuth0 = loginAsUser

export default loginAsUser
