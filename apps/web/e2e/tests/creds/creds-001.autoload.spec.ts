import { test, expect } from '@playwright/test'

import { resetAndSeed } from '../../helpers/database'
import { loginAndOpenCredsModal, expectCredentialStatus, getCredentialCard } from '../../helpers/credentials'
import { MODAL_TITLES, STATUS_CHIP, CREDENTIAL_LABELS } from '../../helpers/selectors'

test.describe('CREDS-001: Popup Auto-load', () => {
    test.beforeEach(async ({ page }) => {
        await resetAndSeed({
            chatflow: { name: 'QA CREDS-001 Autoload' }
        })
        await loginAndOpenCredsModal(page)
    })

    test('shows the credentials modal automatically after login when setup is pending', async ({ page }) => {
        const modal = page.getByRole('dialog', { name: MODAL_TITLES.credentials })
        await expect(modal).toBeVisible()

        await expect(page).toHaveURL(/\/chat\//)

        const setupRequiredChip = modal
            .locator('xpath=//span[contains(@class,"MuiChip-label")][normalize-space()="' + STATUS_CHIP.setupRequired + '"]')
            .first()
        await expect(setupRequiredChip).toBeVisible()

        // Quick sanity check that OpenAI requires setup by default in this seed
        await expectCredentialStatus(modal, 'openai', 'setupRequired')
    })
})
