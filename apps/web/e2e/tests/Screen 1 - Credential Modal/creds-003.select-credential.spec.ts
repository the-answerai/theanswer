import { test, expect } from '@playwright/test'
import { loginWithTestUser } from '../../helpers/auth'
import { resetOnly, seedScenario } from '../../helpers/database'
import { waitForLoadingToResolve, getCredentialCard } from '../../helpers/credentials'
import { MODAL_TITLES, CREDENTIAL_LABELS } from '../../helpers/selectors'

test.describe('Select Credential', () => {
    test('allows selecting from dropdown', async ({ page }) => {
        // Step 1: Clean database for isolated test
        console.log('🗑️ Resetting database for clean test state...')
        await resetOnly()

        // Step 2: Login creates real user + default chatflow (Auth0 handles user creation)
        console.log('🔐 Logging in as admin (creates authenticated user + default chatflow)...')
        await loginWithTestUser(page, 'admin', true)

        // Step 3: Verify we're authenticated and can see user content
        const userEmail = page.locator('text=' + process.env.TEST_USER_ENTERPRISE_ADMIN_EMAIL!).first()
        await expect(userEmail).toBeVisible({ timeout: 10000 })
        console.log('✅ User authenticated and visible in UI')

        // Step 4: Ensure we're on /chat/ before seeding so the user exists server-side
        await expect(page).toHaveURL(/\/chat\//, { timeout: 20000 })

        // Step 5: Apply scenario to the logged-in user to create an unassigned OpenAI credential
        console.log('🔧 Applying credential scenario: user-with-openai...')
        await seedScenario('user-with-openai')

        // Optional: allow slight delay for database propagation
        await page.waitForTimeout(2000)
        console.log('✅ Scenario prepared for dropdown testing')

        // Step 6: Refresh /chat to ensure modal triggers automatically
        console.log('🚀 Navigating to /chat...')
        await page.goto('/chat', { waitUntil: 'networkidle' })
        await expect(page).not.toHaveURL(/auth0\.com/)

        // Step 6: Wait for modal to appear
        console.log('⏳ Waiting for credentials modal...')
        await page.waitForSelector(`[role="dialog"]`, { timeout: 10000 })

        const modal = page.getByRole('dialog', { name: MODAL_TITLES.credentials })
        await expect(modal).toBeVisible()
        console.log('✅ Credentials modal appeared')

        // Step 6: Wait for loading to resolve
        await waitForLoadingToResolve(modal)

        // Step 7: Look for OpenAI card
        console.log('🔍 Looking for OpenAI card...')
        const openaiCard = getCredentialCard(modal, CREDENTIAL_LABELS.openai)
        await expect(openaiCard).toBeVisible()
        console.log('✅ OpenAI card found')

        // Step 8: Check dropdown initial state (should be closed with placeholder)
        console.log('📋 Checking initial dropdown state...')
        const dropdown = openaiCard.getByRole('combobox')
        await expect(dropdown).toBeVisible()

        // Step 9: Verify dropdown shows placeholder (unassigned state)
        console.log('🔍 Verifying dropdown shows placeholder...')
        // The placeholder text is in a sibling element, not inside the combobox itself
        await expect(openaiCard.getByText('Select Credential').first()).toBeVisible()
        console.log('✅ Dropdown shows placeholder - credential is unassigned')

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
