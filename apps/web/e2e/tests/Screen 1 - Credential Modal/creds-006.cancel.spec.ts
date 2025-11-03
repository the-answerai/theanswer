import { test, expect } from '@playwright/test'
import { resetOnly, seedScenario } from '../../helpers/database'
import { loginWithTestUser } from '../../helpers/auth'
import { waitForLoadingToResolve, getCredentialCard, expectModalVisible } from '../../helpers/credentials'
import { MODAL_TITLES, CREDENTIAL_LABELS, STATUS_CHIP } from '../../helpers/selectors'

test.describe('Cancel behaviour', () => {
    test.beforeEach(async ({ page }) => {
        console.log('🗑️ Resetting database for clean test state...')
        await resetOnly()

        console.log('🔐 Logging in as admin (creates user and chatflow)...')
        await loginWithTestUser(page, 'admin', true)

        console.log('🌱 Applying credential scenario AFTER login: user-with-openai...')
        await seedScenario('user-with-openai', 'admin')

        await expect(page).toHaveURL(/\/chat\//, { timeout: 20000 })

        await page.goto('/chat', { waitUntil: 'networkidle' })
        await expect(page).not.toHaveURL(/auth0\.com/)
        await expectModalVisible(page)
    })

    test('closes modal and discards changes', async ({ page }) => {
        const modal = page.getByRole('dialog', { name: MODAL_TITLES.credentials })
        await waitForLoadingToResolve(modal)

        // Click the Cancel button which will trigger the ConfirmDialog
        await modal.getByRole('button', { name: /^Cancel$/ }).click()

        // Wait for the confirmation dialog to appear
        const confirmDialog = page.getByRole('dialog', { name: /Close without saving/i })
        await expect(confirmDialog).toBeVisible({ timeout: 5000 })

        // Verify the confirmation message
        await expect(confirmDialog.getByText(/are you sure you want to close/i)).toBeVisible()

        // Click "Close anyway" button to confirm
        await confirmDialog.getByRole('button', { name: /Close anyway/i }).click()

        // Verify modal closes after confirming
        await expect(modal).toBeHidden({ timeout: 10000 })

        // Navigate back to modal to verify no changes were saved
        const quickSetupUrl = new URL(page.url())
        quickSetupUrl.searchParams.set('QuickSetup', 'true')
        await page.goto(quickSetupUrl.toString(), { waitUntil: 'networkidle' })

        const reopenedModal = page.getByRole('dialog', { name: MODAL_TITLES.credentials })
        await expect(reopenedModal).toBeVisible()
        await waitForLoadingToResolve(reopenedModal)

        // Verify that jira still shows as Required (no changes were saved)
        const jiraCard = getCredentialCard(reopenedModal, CREDENTIAL_LABELS.jira)
        await expect(jiraCard.getByText(STATUS_CHIP.required)).toBeVisible()
    })
})
