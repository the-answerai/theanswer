import { test, expect } from '@playwright/test'
import {
    resetOnly,
    seedScenario,
    loginWithTestUser,
    waitForLoadingToResolve,
    getCredentialCard,
    expectModalVisible,
    MODAL_TITLES,
    TIMEOUTS,
    SECTIONS,
    BUTTON_TEXTS,
    ADD_CREDENTIAL_DIALOG
} from '../../helpers'

test.describe('Add New Credential', () => {
    test.beforeEach(async ({ page }) => {
        console.log('🗑️ Resetting database for clean test state...')
        await resetOnly()

        console.log('🔐 Logging in as admin (creates chatflow)...')
        await loginWithTestUser(page, 'admin', true)

        await expect(page).toHaveURL(/\/chat\//, { timeout: TIMEOUTS.LONG })

        console.log('🔧 Applying credential scenario: user-with-openai...')
        await seedScenario('user-with-openai', 'admin')

        await page.goto('/chat', { waitUntil: 'networkidle' })
        await expect(page).not.toHaveURL(/auth0\.com/)
        await expectModalVisible(page)
    })

    test('creates a new Confluence credential', async ({ page }) => {
        const modal = page.getByRole('dialog', { name: MODAL_TITLES.credentials })
        await waitForLoadingToResolve(modal)

        // Get the Confluence credential card from Optional section
        console.log('📋 Getting Confluence credential card...')
        const confluenceCard = await getCredentialCard(modal, 'confluence', SECTIONS.optional)

        // Click "Add" button for unconnected credential
        const addButton = confluenceCard.getByRole('button', { name: BUTTON_TEXTS.add })
        await expect(addButton).toBeVisible()
        console.log('✅ "Add" button visible')
        await addButton.click()

        // Wait for the credential add dialog to appear
        const addDialog = page
            .locator('div[role="dialog"]')
            .filter({ has: page.locator(ADD_CREDENTIAL_DIALOG.formInputs.name) })
            .first()
        await expect(addDialog).toBeVisible()

        // Fill in the credential form with required fields
        const credentialName = `QA Confluence ${Date.now()}`
        await addDialog.locator(ADD_CREDENTIAL_DIALOG.formInputs.name).fill(credentialName)
        await addDialog.locator(ADD_CREDENTIAL_DIALOG.formInputs.accessToken).fill('confluence-token')
        await addDialog.locator(ADD_CREDENTIAL_DIALOG.formInputs.username).fill('confluence-bot@example.com')
        await addDialog.locator(ADD_CREDENTIAL_DIALOG.formInputs.baseURL).fill('https://example.atlassian.net/wiki')

        // Submit the form to create the credential
        await addDialog.getByRole('button', { name: /^Add$/ }).click()

        // Wait for dialog to close after successful creation
        await expect(addDialog).toBeHidden({ timeout: TIMEOUTS.LONG })

        // Open dropdown to verify the newly created credential appears in the list
        const dropdown = confluenceCard.getByRole('combobox')
        await dropdown.click()

        // Verify the newly created credential is available for selection
        const newlyCreatedOption = page.getByRole('option', { name: credentialName })
        await expect(newlyCreatedOption).toBeVisible({ timeout: TIMEOUTS.MEDIUM })
        await newlyCreatedOption.click()

        await expect(dropdown).toHaveText(new RegExp(credentialName))
    })
})
