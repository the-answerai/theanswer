import { test, expect } from '@playwright/test'
import { loginWithTestUser } from '../../helpers/auth'
import { resetOnly, seedScenario } from '../../helpers/database'
import { waitForLoadingToResolve, getCredentialCard, expectModalVisible } from '../../helpers/credentials'
import { MODAL_TITLES, CREDENTIAL_LABELS } from '../../helpers/selectors'

test.describe('Select Credential', () => {
    test.beforeEach(async ({ page }) => {
        console.log('🗑️ Resetting database for clean test state...')
        await resetOnly()

        console.log('🔐 Logging in as admin (creates user and chatflow)...')
        await loginWithTestUser(page, 'admin', true)

        console.log('🌱 Applying credential scenario AFTER login: user-with-openai...')
        await seedScenario('user-with-openai', 'admin')

        await expect(page).toHaveURL(/\/chat\//, { timeout: 20000 })

        await page.goto('/chat', { waitUntil: 'networkidle' })
        await expect(page).not.toHaveURL(/auth0\.com/)
        await expectModalVisible(page)
    })

    test('allows selecting from dropdown', async ({ page }) => {
        const modal = page.getByRole('dialog', { name: MODAL_TITLES.credentials })
        await waitForLoadingToResolve(modal)

        // Step 7: Look for OpenAI card
        console.log('🔍 Looking for OpenAI card...')
        const openaiCard = getCredentialCard(modal, CREDENTIAL_LABELS.openai)
        await expect(openaiCard).toBeVisible()
        console.log('✅ OpenAI card found')

        // Step 8: Click "Use existing (1)" button to expand the dropdown section
        console.log('📂 Clicking "Use existing" button to expand dropdown...')
        const useExistingButton = openaiCard.getByRole('button', { name: /Use existing \(\d+\)/ })
        await expect(useExistingButton).toBeVisible()
        await useExistingButton.click()

        // Step 9: Wait for the dropdown to appear (Collapse animation)
        console.log('⏳ Waiting for dropdown to appear...')
        const dropdown = openaiCard.getByRole('combobox')
        await expect(dropdown).toBeVisible({ timeout: 2000 })
        console.log('✅ Dropdown is now visible')

        // Step 10: Open dropdown to see available options
        console.log('📂 Opening dropdown to view available credentials...')
        await dropdown.click()

        // Wait for options to appear
        const firstOption = page.getByRole('option').first()
        await expect(firstOption).toBeVisible()
        console.log('✅ Dropdown options are visible')

        // Step 11: Select credential from available options
        const selectedCredentialName = await firstOption.textContent()
        console.log(`🎯 Selecting credential: "${selectedCredentialName}"`)
        await firstOption.click()

        // Step 12: Verify dropdown updates with selected value (should be closed now)
        console.log('✅ Verifying dropdown updates with selection...')
        await expect(dropdown).toContainText(selectedCredentialName || 'Selected')
        console.log('✅ Dropdown successfully updated with selected credential')

        // Step 13: Test selection persistence - reopen dropdown and verify selection
        console.log('🔄 Testing selection persistence...')
        await dropdown.click()

        // Verify the previously selected option has aria-selected="true"
        const selectedOption = page.getByRole('option').first()
        await expect(selectedOption).toBeVisible()
        await expect(selectedOption).toHaveAttribute('aria-selected', 'true')
        console.log('✅ Selected option shows aria-selected="true"')

        // Close dropdown
        await page.keyboard.press('Escape')

        // Step 14: Final verification that selection persists after closing
        await expect(dropdown).toContainText(selectedCredentialName || 'Selected')
        console.log('✅ Selection persistence verified successfully')
    })
})
