import { test, expect } from '@playwright/test'
import { resetOnly, seedScenario } from '../../helpers/database'
import { waitForLoadingToResolve } from '../../helpers/credentials'
import { loginWithTestUser } from '../../helpers/auth'
import { MODAL_TITLES } from '../../helpers/selectors'

test.describe('Popup Auto-load', () => {
    test.beforeEach(async ({ page }) => {
        console.log('🗑️ Resetting database for clean test state...')
        await resetOnly()

        console.log('🔐 Logging in as member user (creates chatflow)...')
        await loginWithTestUser(page, 'member', true)

        await expect(page).toHaveURL(/\/chat\//, { timeout: 20000 })

        console.log('🔧 Ensuring baseline scenario for member user...')
        await seedScenario('baseline', 'member')
    })

    test('shows the credentials modal after login', async ({ page }) => {
        // Step 1: Verify automatic redirect to /chat/
        await expect(page).toHaveURL(/\/chat\//, { timeout: 20000 })

        // Step 2: Wait for the credentials modal to appear automatically (give it up to 10 seconds for Firefox)
        const modal = page.getByRole('dialog', { name: MODAL_TITLES.credentials })
        await expect(modal).toBeVisible({ timeout: 10000 })

        // Step 3: Wait for modal loading state to resolve
        await waitForLoadingToResolve(modal)

        // Step 4: Verify modal title is correct
        await expect(modal.getByRole('heading', { name: MODAL_TITLES.credentials })).toBeVisible()

        // Step 5: Verify at least one credential shows "Setup Required" status
        await expect(modal.getByText('Setup Required').first()).toBeVisible()
    })
})
