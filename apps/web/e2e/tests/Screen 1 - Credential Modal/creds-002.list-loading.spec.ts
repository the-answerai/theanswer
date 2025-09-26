import { test, expect } from '@playwright/test'

import { loginWithTestUser } from '../../helpers/auth'

import { seedScenario } from '../../helpers/test-db'
import { waitForLoadingToResolve, expectCredentialStatus } from '../../helpers/credentials'
import { MODAL_TITLES } from '../../helpers/selectors'

test.describe('List Loading', () => {
    test('shows Assigned/Setup Required states', async ({ page }) => {
        // Step 1: Login using proven approach from auth.spec.ts (creates user + default chatflow)
        console.log('🔐 Starting fresh login...')
        await loginWithTestUser(page, 'admin', true)

        // Step 2: Verify we're authenticated and can see user content
        const userEmail = page.locator('text=' + process.env.TEST_USER_ENTERPRISE_ADMIN_EMAIL!).first()
        await expect(userEmail).toBeVisible({ timeout: 10000 })
        console.log('✅ User authenticated and visible in UI')

        // Step 3: Assign credentials to the existing user's chatflow
        console.log('🔧 Seeding credentials for existing user...')
        await seedScenario('user-with-both-credentials')

        // Add delay to ensure database changes propagate
        await page.waitForTimeout(2000)
        console.log('✅ Credentials seeded for existing user')

        // Step 4: Navigate to chat - modal should appear automatically
        console.log('🚀 Navigating to /chat...')
        await page.goto('/chat', { waitUntil: 'networkidle' })
        await expect(page).not.toHaveURL(/auth0\.com/)

        // Step 5: Wait for modal to appear
        console.log('⏳ Waiting for credentials modal...')
        await page.waitForSelector(`[role="dialog"]`, { timeout: 10000 })

        const modal = page.getByRole('dialog', { name: MODAL_TITLES.credentials })
        await expect(modal).toBeVisible()
        console.log('✅ Credentials modal appeared')

        // Step 6: Wait for loading to resolve and test credential states
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
