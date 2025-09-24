import { test, expect } from '@playwright/test'

import { resetAndSeed } from '../../helpers/database'
import { loginAndOpenCredsModal, waitForLoadingToResolve, getCredentialCard } from '../../helpers/credentials'
import { MODAL_TITLES, CREDENTIAL_LABELS, STATUS_CHIP } from '../../helpers/selectors'

test.describe('CREDS-005: Assign & Continue', () => {
    const jiraCredentialName = 'QA Jira Actionable'

    test.beforeEach(async ({ page }) => {
        await resetAndSeed({
            chatflow: { name: 'QA CREDS-005 Assign Continue' },
            credentials: {
                openai: { assigned: true, name: 'QA OpenAI Assigned' },
                jira: [{ name: jiraCredentialName }]
            }
        })
        await loginAndOpenCredsModal(page)
    })

    test('enables Assign & Continue only after selections are complete and persists the update', async ({ page }) => {
        const modal = page.getByRole('dialog', { name: MODAL_TITLES.credentials })
        await waitForLoadingToResolve(modal)

        const assignButton = modal.getByRole('button', { name: /Assign & Continue/i })
        await expect(assignButton).toBeDisabled()

        const jiraCard = getCredentialCard(modal, CREDENTIAL_LABELS.jira)
        await jiraCard.getByRole('combobox').click()
        await page.getByRole('option', { name: jiraCredentialName }).click()

        await expect(assignButton).toBeEnabled()

        await assignButton.click()
        await expect(modal).toBeHidden({ timeout: 20000 })

        const currentUrl = new URL(page.url())
        currentUrl.searchParams.set('QuickSetup', 'true')
        await page.goto(currentUrl.toString(), { waitUntil: 'networkidle' })

        const reopenedModal = page.getByRole('dialog', { name: MODAL_TITLES.credentials })
        await expect(reopenedModal).toBeVisible()

        const reopenedJiraCard = getCredentialCard(reopenedModal, CREDENTIAL_LABELS.jira)
        await expect(reopenedJiraCard.getByText(STATUS_CHIP.assigned)).toBeVisible()
        await expect(reopenedJiraCard.getByRole('combobox')).toHaveText(new RegExp(jiraCredentialName))
    })
})
