import { test, expect } from '@playwright/test'
import { resetOnly, seedScenario, loginWithTestUser, waitForLoadingToResolve, MODAL_TITLES, TIMEOUTS, SECTIONS } from '../../helpers'

test.describe('Popup Auto-load', () => {
    test.beforeEach(async ({ page }) => {
        console.log('🗑️ Resetting database for clean test state...')
        await resetOnly()

        console.log('🔐 Logging in as member user (creates chatflow)...')
        await loginWithTestUser(page, 'member', true)

        await expect(page).toHaveURL(/\/chat\//, { timeout: TIMEOUTS.LONG })

        console.log('🔧 Ensuring baseline scenario for member user...')
        await seedScenario('baseline', 'member')
    })

    test('shows the credentials modal after login', async ({ page }) => {
        // Step 1: Verify automatic redirect to /chat/
        await expect(page).toHaveURL(/\/chat\//, { timeout: TIMEOUTS.LONG })

        // Step 2: Wait for the credentials modal to appear automatically
        // The modal should auto-load when there are unassigned credentials
        const modal = page.getByRole('dialog', { name: MODAL_TITLES.credentials })
        await expect(modal).toBeVisible({ timeout: TIMEOUTS.MODAL_APPEAR })
        console.log('✅ Credentials modal auto-appeared')

        // Step 3: Wait for modal loading state to resolve
        await waitForLoadingToResolve(modal)

        // Step 4: Verify modal title is correct (accepts both "Manage Credentials" and "Setup Required Credentials")
        await expect(modal.getByRole('heading', { name: MODAL_TITLES.credentials }).first()).toBeVisible()
        console.log('✅ Modal title verified')

        // Step 5: Verify credentials that need setup are shown in Required or Optional sections
        // (Status is now indicated by section placement, not status chips)
        const requiredSection = modal.getByText(SECTIONS.required)
        const optionalSection = modal.getByText(SECTIONS.optional)

        const hasRequired = await requiredSection.isVisible().catch(() => false)
        const hasOptional = await optionalSection.isVisible().catch(() => false)

        expect(hasRequired || hasOptional).toBe(true)
        console.log('✅ Modal shows credentials needing setup in Required/Optional sections')
    })
})
