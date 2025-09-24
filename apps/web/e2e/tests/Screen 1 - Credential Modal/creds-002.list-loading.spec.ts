import { test, expect } from '@playwright/test'

import { seedScenario, resetDatabase } from '../../helpers/test-db'
import { loginAndOpenCredsModal, waitForLoadingToResolve, expectCredentialStatus, getCredentialCard } from '../../helpers/credentials'
import { MODAL_TITLES, STATUS_CHIP, CREDENTIAL_LABELS } from '../../helpers/selectors'

test.describe('CREDS-002: List Loading', () => {
    test.beforeEach(async ({ page }) => {
        await resetDatabase()
        await seedScenario('user-with-both-credentials')
        
        // Add delay to ensure database changes propagate
        await page.waitForTimeout(2000)
        
        await loginAndOpenCredsModal(page)
    })

    test('credential list, shows Assigned/Setup Required states', async ({ page }) => {
        const modal = page.getByRole('dialog', { name: MODAL_TITLES.credentials })

        await waitForLoadingToResolve(modal)

        await expectCredentialStatus(modal, 'openai', 'assigned')
        await expectCredentialStatus(modal, 'exa', 'assigned')
    })
})
