import { test, expect } from '@playwright/test'

import { resetAndSeed } from '../../helpers/database'
import { loginAndOpenCredsModal, waitForLoadingToResolve, getCredentialCard } from '../../helpers/credentials'
import { MODAL_TITLES, CREDENTIAL_LABELS, STATUS_CHIP } from '../../helpers/selectors'

test.describe('CREDS-006: Cancel behaviour', () => {
    test.beforeEach(async ({ page }) => {
        await resetAndSeed({
            chatflow: { name: 'QA CREDS-006 Cancel' },
            credentials: {
                openai: { assigned: true, name: 'QA OpenAI Assigned' },
                jira: { create: false }
            }
        })
        await loginAndOpenCredsModal(page)
    })

    test('closes the modal with Cancel and Escape without applying changes', async ({ page }) => {
        const modal = page.getByRole('dialog', { name: MODAL_TITLES.credentials })
        await waitForLoadingToResolve(modal)

        await modal.getByRole('button', { name: /^Cancel$/ }).click()
        await expect(modal).toBeHidden({ timeout: 10000 })

        const quickSetupUrl = new URL(page.url())
        quickSetupUrl.searchParams.set('QuickSetup', 'true')
        await page.goto(quickSetupUrl.toString(), { waitUntil: 'networkidle' })

        const reopenedModal = page.getByRole('dialog', { name: MODAL_TITLES.credentials })
        await expect(reopenedModal).toBeVisible()
        await waitForLoadingToResolve(reopenedModal)

        const jiraCard = getCredentialCard(reopenedModal, CREDENTIAL_LABELS.jira)
        await expect(jiraCard.getByText(STATUS_CHIP.setupRequired)).toBeVisible()

        await page.keyboard.press('Escape')
        await expect(reopenedModal).toBeHidden({ timeout: 10000 })
    })
})
