import { test, expect } from '@playwright/test'
import { resetOnly, seedScenario } from '../../helpers/database'
import { loginWithTestUser } from '../../helpers/auth'
import { waitForLoadingToResolve, getCredentialCard, expectModalVisible } from '../../helpers/credentials'
import { MODAL_TITLES, CREDENTIAL_LABELS } from '../../helpers/selectors'

test.describe('Add New Credential', () => {
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

    test('creates a new Confluence credential', async ({ page }) => {
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
        await dropdown.click()

        const newlyCreatedOption = page.getByRole('option', { name: credentialName })
        await expect(newlyCreatedOption).toBeVisible({ timeout: 10000 })
        await newlyCreatedOption.click()

        await expect(dropdown).toHaveText(new RegExp(credentialName))
    })
})
