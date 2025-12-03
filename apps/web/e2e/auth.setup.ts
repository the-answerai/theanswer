import { test as setup, expect } from '@playwright/test'
import { TIMEOUTS } from './helpers/selectors'
import { fillEmailStep, fillPasswordStep, handleOrganizationSelection, waitForAuthRedirect } from './helpers/auth'

/**
 * Authentication Setup for E2E Tests
 *
 * Purpose:
 * - Runs once before all tests to establish authentication state
 * - Saves authenticated session to file for reuse across tests
 * - Prevents repeating login flow in every test (faster test execution)
 *
 * Authentication State:
 * - Saved to: ./e2e/.auth/user.json
 * - Includes: Auth0 session cookies, tokens, and storage state
 * - Used by: All tests via playwright.config.ts project configuration
 *
 * How tests use saved state:
 * - Tests load the saved state automatically via storageState config
 * - Tests start already authenticated (no login required)
 * - If auth expires, re-run this setup to refresh the state
 */

const authFile = './e2e/.auth/user.json'

setup('authenticate', async ({ page }) => {
    try {
        // Validate environment variables - we'll use the admin user for setup by default
        const testEmail = process.env.TEST_USER_ENTERPRISE_ADMIN_EMAIL

        if (!testEmail || !process.env.TEST_USER_PASSWORD) {
            throw new Error('TEST_USER_ENTERPRISE_ADMIN_EMAIL and TEST_USER_PASSWORD must be set in .env.test file')
        }

        console.log('🔐 Starting authentication setup...')

        // Go to the homepage - this should redirect to Auth0 login if not authenticated
        await page.goto('/')

        // Wait for either Auth0 login page or already authenticated content
        try {
            // Check if we're already on an authenticated page
            await page.waitForSelector('body', { timeout: TIMEOUTS.SHORT })
            const bodyText = await page.textContent('body')

            if (bodyText?.includes('Dashboard') || bodyText?.includes('Chat') || bodyText?.includes('Welcome')) {
                console.log('ℹ️  Already authenticated, skipping login')
                await page.context().storageState({ path: authFile })
                return
            }
        } catch (error) {
            // Continue with login process
        }

        console.log('🌐 Waiting for Auth0 login page...')

        // Step 1: Fill email and continue
        console.log('📧 Filling email...')
        await fillEmailStep(page, testEmail)

        // Step 2: Fill password and submit
        console.log('🔑 Filling password and submitting login form...')
        await fillPasswordStep(page, process.env.TEST_USER_PASSWORD!)

        // Step 3: Handle potential organization selection
        console.log('🏢 Checking for organization selection...')
        const preferredOrgId = process.env.TEST_ENTERPRISE_AUTH0_ORG_ID
        const preferredOrgName = process.env.TEST_ENTERPRISE_ORG_NAME || 'local'
        await handleOrganizationSelection(page, preferredOrgId, preferredOrgName)

        // Step 4: Wait for redirect back to the application after successful login
        console.log('⏳ Waiting for redirect back to application...')
        await waitForAuthRedirect(page)

        // Step 5: Verify we're actually logged in by checking for user-specific content
        console.log('✅ Verifying successful authentication...')
        await expect(page.locator('body')).toContainText(['Dashboard', 'Welcome', 'Chat', 'Chatflows', 'Settings', 'Profile'], {
            timeout: TIMEOUTS.AUTH_REDIRECT
        })

        // Step 6: Save authentication state for reuse in all tests
        console.log('💾 Saving authentication state...')
        await page.context().storageState({ path: authFile })

        console.log('✅ Authentication setup completed successfully')
    } catch (error) {
        console.error('❌ Authentication setup failed:', error)
        console.error('   Make sure:')
        console.error('   - .env.test file exists with correct credentials')
        console.error('   - Auth0 tenant is accessible')
        console.error('   - Test user has access to the organization')
        throw error // Re-throw to fail the setup
    }
})
