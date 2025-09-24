import { test, expect } from '@playwright/test'

import { resetAndSeed } from '../../helpers/database'
import { loginAndOpenCredsModal, waitForLoadingToResolve, expectCredentialStatus } from '../../helpers/credentials'
import { MODAL_TITLES, STATUS_CHIP, CREDENTIAL_LABELS } from '../../helpers/selectors'

test.describe('CREDS-002: List Loading', () => {
    test.beforeEach(async ({ page }) => {
        await resetAndSeed({
            chatflow: { name: 'QA CREDS-002 List Loading' },
            credentials: {
                openai: { assigned: true, name: 'QA OpenAI Assigned' },
                exa: { assigned: true, name: 'QA Exa Assigned' },
                jira: { create: false },
                confluence: { create: false }
            }
        })
        await loginAndOpenCredsModal(page)
    })

    test('replaces spinner with credential list and shows Assigned/Setup Required states', async ({ page }) => {
        const modal = page.getByRole('dialog', { name: MODAL_TITLES.credentials })
        const loading = modal.getByTestId('credentials-loading-state')

        await expect(loading).toBeVisible()
        await waitForLoadingToResolve(modal)

        await expect(modal.getByText('Select Credential', { exact: false })).toBeVisible()

        await expectCredentialStatus(modal, 'openai', 'assigned')
        await expectCredentialStatus(modal, 'exa', 'assigned')
        await expectCredentialStatus(modal, 'jira', 'setupRequired')
        await expectCredentialStatus(modal, 'confluence', 'setupRequired')
    })
})
