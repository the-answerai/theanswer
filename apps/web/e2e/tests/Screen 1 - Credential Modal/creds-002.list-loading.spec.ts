import { test, expect } from '@playwright/test'
import { loginWithTestUser } from '../../helpers/auth'
import { resetOnly, seedScenario } from '../../helpers/database'
import { waitForLoadingToResolve, expectCredentialStatus } from '../../helpers/credentials'
import { MODAL_TITLES } from '../../helpers/selectors'

test.describe('List Loading', () => {
    test('shows Assigned/Setup Required states', async ({ page }) => {
        // Step 1: Clean database for isolated test
        console.log('🗑️ Resetting database for clean test state...')
        await resetOnly()

        // Step 2: Login using proven approach from auth.spec.ts (creates user + default chatflow)
        console.log('🔐 Starting fresh login...')
        await loginWithTestUser(page, 'admin', true)

        // Step 3: Verify we're authenticated and can see user content
        const userEmail = page.locator('text=' + process.env.TEST_USER_ENTERPRISE_ADMIN_EMAIL!).first()
        await expect(userEmail).toBeVisible({ timeout: 10000 })
        console.log('✅ User authenticated and visible in UI')

        // Step 4: Ensure we're on /chat/ before seeding so the user exists server-side
        await expect(page).toHaveURL(/\/chat\//, { timeout: 20000 })

        // Step 5: Apply scenario to the logged-in user (assign credentials to chatflow)
        console.log('🔧 Applying credential scenario: user-with-both-credentials...')
        await seedScenario('user-with-both-credentials')
        await page.waitForTimeout(2000)

        // Step 6: Navigate to chat - modal should appear automatically
        console.log('🚀 Navigating to /chat...')
        await page.goto('/chat', { waitUntil: 'networkidle' })
        await expect(page).not.toHaveURL(/auth0\.com/)

        // Step 6: Wait for modal to appear
        console.log('⏳ Waiting for credentials modal...')
        await page.waitForSelector(`[role="dialog"]`, { timeout: 10000 })

        const modal = page.getByRole('dialog', { name: MODAL_TITLES.credentials })
        await expect(modal).toBeVisible()
        console.log('✅ Credentials modal appeared')

        // Step 7: Wait for loading to resolve and test credential states
        await waitForLoadingToResolve(modal)

        // These should show as "Assigned" (assigned to chatflow nodes)
        await expectCredentialStatus(modal, 'openai', 'assigned')
        await expectCredentialStatus(modal, 'exa', 'assigned')

        // These should show as "Setup Required" (exist but not assigned to nodes)
        await expectCredentialStatus(modal, 'jira', 'setup-required')
        await expectCredentialStatus(modal, 'confluence', 'setup-required')

        console.log('✅ All credential states verified successfully')
    })
})
