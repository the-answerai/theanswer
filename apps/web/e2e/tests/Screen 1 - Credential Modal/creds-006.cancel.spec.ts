import { test, expect } from '@playwright/test'
import { resetOnly, seedScenario } from '../../helpers/database'
import { loginWithTestUser } from '../../helpers/auth'
import { waitForLoadingToResolve, getCredentialCard, expectModalVisible } from '../../helpers/credentials'
import { MODAL_TITLES, CREDENTIAL_LABELS, STATUS_CHIP } from '../../helpers/selectors'

test.describe('Cancel behaviour', () => {
    test.beforeEach(async ({ page }) => {
        console.log('🗑️ Resetting database for clean test state...')
        await resetOnly()

        console.log('🔐 Logging in as admin (creates chatflow)...')
        await loginWithTestUser(page, 'admin', true)

        await expect(page).toHaveURL(/\/chat\//, { timeout: 20000 })

        console.log('🔧 Applying credential scenario: user-with-openai...')
        await seedScenario('user-with-openai', 'admin')

        await page.goto('/chat', { waitUntil: 'networkidle' })
        await expect(page).not.toHaveURL(/auth0\.com/)
        await expectModalVisible(page)
    })

    test('closes modal and discards changes', async ({ page }) => {
        const modal = page.getByRole('dialog', { name: MODAL_TITLES.credentials })
        await waitForLoadingToResolve(modal)

        // Setup handler for the browser alert that appears when clicking Cancel
        page.on('dialog', async (dialog) => {
            console.log(`Dialog type: ${dialog.type()}`)
            console.log(`Dialog message: ${dialog.message()}`)
            // Accept the alert to confirm cancellation
            await dialog.accept()
        })

        // Click the Cancel button which will trigger the browser alert
        await modal.getByRole('button', { name: /^Cancel$/ }).click()

        // Verify modal closes after accepting the alert
        await expect(modal).toBeHidden({ timeout: 10000 })

        // Navigate back to modal to verify no changes were saved
        const quickSetupUrl = new URL(page.url())
        quickSetupUrl.searchParams.set('QuickSetup', 'true')
        await page.goto(quickSetupUrl.toString(), { waitUntil: 'networkidle' })

        const reopenedModal = page.getByRole('dialog', { name: MODAL_TITLES.credentials })
        await expect(reopenedModal).toBeVisible()
        await waitForLoadingToResolve(reopenedModal)

        // Verify that jira still shows as Setup Required (no changes were saved)
        const jiraCard = getCredentialCard(reopenedModal, CREDENTIAL_LABELS.jira)
        await expect(jiraCard.getByText(STATUS_CHIP.setupRequired)).toBeVisible()
    })
})
