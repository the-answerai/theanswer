import { test, expect } from '@playwright/test'

import { resetAndSeed } from '../../helpers/database'
import { loginAndOpenCredsModal, waitForLoadingToResolve, getCredentialCard } from '../../helpers/credentials'
import { MODAL_TITLES, CREDENTIAL_LABELS } from '../../helpers/selectors'

test.describe('CREDS-003: Select Credential', () => {
    const jiraCredentials = ['QA Jira Primary', 'QA Jira Secondary']

    test.beforeEach(async ({ page }) => {
        await resetAndSeed({
            chatflow: { name: 'QA CREDS-003 Select Credential' },
            credentials: {
                openai: { assigned: true, name: 'QA OpenAI Assigned' },
                jira: jiraCredentials.map((name) => ({ name }))
            }
        })
        await loginAndOpenCredsModal(page)
    })

    test('allows selecting an existing credential from the dropdown and persists selection', async ({ page }) => {
        const modal = page.getByRole('dialog', { name: MODAL_TITLES.credentials })
        await waitForLoadingToResolve(modal)

        const jiraCard = getCredentialCard(modal, CREDENTIAL_LABELS.jira)
        const dropdown = jiraCard.getByRole('combobox')

        await dropdown.click()
        const option = page.getByRole('option', { name: jiraCredentials[0] })
        await expect(option).toBeVisible()
        await option.click()

        await expect(dropdown).toHaveText(new RegExp(jiraCredentials[0]))

        await dropdown.click()
        await expect(page.getByRole('option', { name: jiraCredentials[0] })).toHaveAttribute('aria-selected', 'true')
        await page.keyboard.press('Escape')

        await expect(dropdown).toHaveText(new RegExp(jiraCredentials[0]))
    })
})
