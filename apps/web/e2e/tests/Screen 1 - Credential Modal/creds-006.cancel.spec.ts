import { test, expect } from '@playwright/test'

import { resetAndSeed } from '../../helpers/database'
import { loginWithTestUser } from '../../helpers/auth'
import { waitForLoadingToResolve, getCredentialCard, expectModalVisible } from '../../helpers/credentials'
import { MODAL_TITLES, CREDENTIAL_LABELS, STATUS_CHIP } from '../../helpers/selectors'

test.describe('Cancel behaviour', () => {
    test.beforeEach(async ({ page }) => {
        await resetAndSeed({
            chatflow: { name: 'QA CREDS-006 Cancel' },
            credentials: {
                openai: { assigned: true, name: 'QA OpenAI Assigned' },
                jira: { create: false }
            }
        })
        await loginWithTestUser(page, 'admin')
        await page.waitForURL(/\/chat\//, { timeout: 20000 })
        await expectModalVisible(page)
    })

    test('closes modal and discards changes', async ({ page }) => {
        const modal = page.getByRole('dialog', { name: MODAL_TITLES.credentials })
        await waitForLoadingToResolve(modal)

        // Setup handler for the browser alert that appears when clicking Cancel
        page.on('dialog', async dialog => {
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
