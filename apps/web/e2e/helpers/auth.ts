import { expect, Page } from '@playwright/test'

/**
 * Robust authentication helpers for E2E testing
 * Extracted from Brad's implementation in auth.spec.ts and auth.setup.ts
 */

interface LoginOptions {
    email: string
    password: string
    organizationId?: string
}

export interface TestUser {
    email: string
    password: string
    role: 'admin' | 'builder' | 'member'
    auth0Id?: string
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
        organizationName: process.env.TEST_ENTERPRISE_ORG_NAME,
        auth0Id: process.env.TEST_USER_ENTERPRISE_ADMIN_AUTH0_ID,
        name: process.env.TEST_USER_ENTERPRISE_ADMIN_NAME
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
 * Main login function with robust organization selection
 * Based on Brad's loginAsUser function from auth.spec.ts
 */
export const loginAsUser = async (page: Page, email: string, password: string, orgId?: string): Promise<void> => {
    // Clear any existing auth state
    await page.context().clearCookies()

    // Go to the homepage - this will redirect to Auth0
    await page.goto('/')

    // Step 1: Wait for Auth0 email input page
    await page.waitForSelector('input[name="username"], input[type="email"], input[name="email"]', {
        timeout: 10000
    })

    // Fill email first
    const emailInput = page.locator('input[name="username"], input[type="email"], input[name="email"]').first()
    await emailInput.fill(email)

    // Click Continue/Submit to proceed to password step
    const continueButton = page
        .locator(
            [
                'button[type="submit"]',
                'button:has-text("Continue")',
                'button:has-text("Next")',
                'button[data-action-button-primary="true"]'
            ].join(', ')
        )
        .first()
    await continueButton.click()

    // Step 2: Wait for password input page
    await page.waitForSelector('input[name="password"], input[type="password"]', {
        timeout: 10000
    })

    // Fill password
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first()
    await passwordInput.fill(password)

    // Submit login form
    const submitButton = page
        .locator(
            [
                'button[type="submit"][data-action-button-primary="true"]',
                'button[type="submit"]:not([data-provider])',
                'button:has-text("Log In")',
                'button:has-text("Sign In")',
                'button:has-text("Continue")'
            ].join(', ')
        )
        .first()
    await submitButton.click()

    // Step 3: Handle organization selection using Brad's robust logic
    if (orgId) {
        try {
            console.log(`[loginAsUser] Looking for organization with ID: ${orgId}`)

            // Wait for organization selection forms to appear
            await page.waitForSelector('form', { timeout: 10000 })

            // Look for the form that contains a hidden input with the specific organization ID
            const targetForm = page.locator(`form:has(input[name="organization"][value="${orgId}"])`)

            if (await targetForm.isVisible({ timeout: 10000 })) {
                console.log(`[loginAsUser] Found form with organization ID: ${orgId}`)

                // Find the submit button within this specific form and click it
                const submitButton = targetForm.locator('button[type="submit"]')
                if (await submitButton.isVisible({ timeout: 5000 })) {
                    const buttonText = await submitButton.textContent()
                    console.log(`[loginAsUser] Clicking organization button: "${buttonText}" (ID: ${orgId})`)
                    await submitButton.click()
                } else {
                    console.log('[loginAsUser] Submit button not found in the target form')
                }
            } else {
                console.log(`[loginAsUser] Could not find form with organization ID: ${orgId}`)

                // Debug: Log all available organization IDs
                const allOrgInputs = page.locator('form input[name="organization"]')
                const orgCount = await allOrgInputs.count()
                console.log(`[loginAsUser] Found ${orgCount} organization forms. Available organization IDs:`)

                for (let i = 0; i < orgCount; i++) {
                    const orgInput = allOrgInputs.nth(i)
                    const orgIdValue = await orgInput.getAttribute('value')
                    const form = orgInput.locator('..')
                    const buttonText = await form
                        .locator('button span')
                        .textContent()
                        .catch(() => 'Unknown')
                    console.log(`[loginAsUser]   - ID: ${orgIdValue}, Name: "${buttonText}"`)
                }

                // Fallback: Try name-based selection
                const orgName = process.env.TEST_ENTERPRISE_ORG_NAME
                if (orgName) {
                    console.log(`[loginAsUser] Falling back to name-based selection: ${orgName}`)
                    const nameBasedButton = page.locator(`button:has-text("${orgName}")`)
                    if (await nameBasedButton.isVisible({ timeout: 5000 })) {
                        await nameBasedButton.click()
                    } else {
                        console.log(`[loginAsUser] Could not find organization with name: ${orgName}`)
                        // Select first available organization as last resort
                        const firstForm = page.locator('form').first()
                        const firstButton = firstForm.locator('button[type="submit"]')
                        if (await firstButton.isVisible({ timeout: 5000 })) {
                            const firstButtonText = await firstButton.textContent()
                            console.log(`[loginAsUser] Selecting first available organization: "${firstButtonText}"`)
                            await firstButton.click()
                        }
                    }
                } else {
                    // Select first available organization if no name specified
                    const firstForm = page.locator('form').first()
                    const firstButton = firstForm.locator('button[type="submit"]')
                    if (await firstButton.isVisible({ timeout: 5000 })) {
                        const firstButtonText = await firstButton.textContent()
                        console.log(`[loginAsUser] No organization name specified, selecting first available: "${firstButtonText}"`)
                        await firstButton.click()
                    }
                }
            }

            // Wait for organization selection to complete before proceeding
            await page.waitForLoadState('networkidle', { timeout: 10000 })
        } catch (error) {
            console.error('[loginAsUser] Organization selection failed:', error instanceof Error ? error.message : error)
            throw error // Re-throw to fail the test if organization selection fails
        }
    }

    // Wait for redirect back to application
    await page.waitForURL(/localhost:3000/, { timeout: 20000 })

    // Verify we're logged in
    await expect(page).not.toHaveURL(/auth0\.com|\.auth0\.com/)

    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => page.waitForLoadState('domcontentloaded'))
}

/**
 * Convenience function using test user configuration
 */
export const loginWithTestUser = async (page: Page, userType: keyof typeof TEST_USERS = 'admin'): Promise<void> => {
    const user = TEST_USERS[userType]
    if (!user.email || !user.password) {
        throw new Error(`Missing environment variables for ${userType} user`)
    }
    return loginAsUser(page, user.email, user.password, user.organizationId)
}

// Backward compatibility with existing code
export const loginThroughAuth0 = loginAsUser

export default loginAsUser
