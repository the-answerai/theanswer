import { test, expect } from '@playwright/test'

import { resetAndSeed } from '../../helpers/database'
import { loginAndOpenCredsModal, waitForLoadingToResolve, getCredentialCard } from '../../helpers/credentials'
import { MODAL_TITLES, CREDENTIAL_LABELS } from '../../helpers/selectors'

test.describe('CREDS-004: Add New Credential', () => {
    test.beforeEach(async ({ page }) => {
        await resetAndSeed({
            chatflow: { name: 'QA CREDS-004 Add Credential' },
            credentials: {
                openai: { assigned: true, name: 'QA OpenAI Assigned' },
                confluence: { create: false }
            }
        })
        await loginAndOpenCredsModal(page)
    })

    test('creates a new Confluence credential through the modal workflow', async ({ page }) => {
        const modal = page.getByRole('dialog', { name: MODAL_TITLES.credentials })
        await waitForLoadingToResolve(modal)

        const confluenceCard = getCredentialCard(modal, CREDENTIAL_LABELS.confluence)
        const addButton = confluenceCard.getByRole('button', { name: /Add New/i })
        await addButton.click()

        const addDialog = page
            .locator('div[role="dialog"]')
            .filter({ has: page.locator('#credName') })
            .first()
        await expect(addDialog).toBeVisible()

        const credentialName = `QA Confluence ${Date.now()}`
        await addDialog.locator('#credName').fill(credentialName)
        await addDialog.locator('#accessToken').fill('confluence-token')
        await addDialog.locator('#username').fill('confluence-bot@example.com')
        await addDialog.locator('#baseURL').fill('https://example.atlassian.net/wiki')

        await addDialog.getByRole('button', { name: /^Add$/ }).click()
        await expect(addDialog).toBeHidden({ timeout: 20000 })

        const dropdown = confluenceCard.getByRole('combobox')
        await expect(dropdown).toHaveText(new RegExp(credentialName))
    })
})
