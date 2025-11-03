import { test, expect } from '@playwright/test'
import { resetOnly, seedScenario } from '../../helpers/database'
import { waitForLoadingToResolve } from '../../helpers/credentials'
import { loginWithTestUser } from '../../helpers/auth'
import { MODAL_TITLES } from '../../helpers/selectors'

test.describe('Popup Auto-load', () => {
    test.beforeEach(async ({ page }) => {
        await resetOnly()
        await seedScenario('baseline', 'member')
        await loginWithTestUser(page, 'member', true)
        await expect(page).toHaveURL(/\/chat\//, { timeout: 20000 })
    })

    test('shows the credentials modal after login', async ({ page }) => {
        // Step 1: Verify automatic redirect to /chat/
        await expect(page).toHaveURL(/\/chat\//, { timeout: 20000 })

        // Step 2: Wait for the credentials modal to appear automatically (give it up to 10 seconds for Firefox)
        const modal = page.getByRole('dialog', { name: MODAL_TITLES.credentials })
        await expect(modal).toBeVisible({ timeout: 10000 })

        // Step 3: Wait for modal loading state to resolve
        await waitForLoadingToResolve(modal)

        // Step 4: Verify modal title is correct (target h4 to avoid strict mode violation)
        await expect(modal.getByRole('heading', { name: MODAL_TITLES.credentials, level: 4 })).toBeVisible()

        // Step 5: Verify "Required" section exists
        const requiredHeading = modal.getByRole('heading', { name: 'Required', level: 6 })
        await expect(requiredHeading).toBeVisible()

        // Step 6: Verify "Required" section has at least one credential card
        const requiredCredentialHeadings = modal.locator('.MuiPaper-root').filter({ hasText: 'Required' }).locator('h6')
        await expect(requiredCredentialHeadings.first()).toBeVisible()

        // Step 7: Check if "Optional" section exists
        const optionalHeading = modal.getByRole('heading', { name: 'Optional', level: 6 })
        const hasOptional = await optionalHeading.isVisible().catch(() => false)

        if (hasOptional) {
            await expect(optionalHeading).toBeVisible()

            // Step 8: Verify "Optional" section has at least one credential card
            const optionalCredentialCards = modal.locator('.MuiPaper-root').filter({ hasText: /Connect|Use existing/ })
            await expect(optionalCredentialCards.first()).toBeVisible()
        }

        // Step 9: Verify at least one credential shows "Required" chip (for required unconnected credentials)
        const requiredChip = modal.getByText('Required').first()
        await expect(requiredChip).toBeVisible()
    })
})
