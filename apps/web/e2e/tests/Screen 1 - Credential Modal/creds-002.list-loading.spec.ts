import { test, expect } from '@playwright/test'
import { loginWithTestUser } from '../../helpers/auth'
import { resetOnly, seedScenario } from '../../helpers/database'
import { waitForLoadingToResolve, expectCredentialStatus, expectModalVisible } from '../../helpers/credentials'
import { MODAL_TITLES } from '../../helpers/selectors'

test.describe('List Loading', () => {
    test.beforeEach(async ({ page }) => {
        console.log('🗑️ Resetting database for clean test state...')
        await resetOnly()

        console.log('🔐 Logging in as admin (creates user in database)...')
        await loginWithTestUser(page, 'admin', true)

        await expect(page).toHaveURL(/\/chat\//, { timeout: 20000 })

        console.log('🌱 Applying credential scenario AFTER login: user-with-both-credentials...')
        await seedScenario('user-with-both-credentials', 'admin')

        await page.goto('/chat', { waitUntil: 'networkidle' })
        await expect(page).not.toHaveURL(/auth0\.com/)
        await expectModalVisible(page)
    })

    test('shows Connected/Required states', async ({ page }) => {
        const modal = page.getByRole('dialog', { name: MODAL_TITLES.credentials })
        await waitForLoadingToResolve(modal)

        // These should show as "Connected" (assigned to chatflow nodes)
        await expectCredentialStatus(modal, 'openai', 'connected')
        await expectCredentialStatus(modal, 'exa', 'connected')

        // These should show as "Required" (exist but not assigned to nodes)
        await expectCredentialStatus(modal, 'jira', 'required')
        await expectCredentialStatus(modal, 'confluence', 'required')

        console.log('✅ All credential states verified successfully')
    })
})
