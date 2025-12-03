import { test, expect } from '@playwright/test'
import {
    resetOnly,
    seedScenario,
    loginWithTestUser,
    waitForLoadingToResolve,
    getCredentialCard,
    selectCredentialFromDropdown,
    MODAL_TITLES,
    TIMEOUTS,
    SECTIONS
} from '../../helpers'

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
        await expect(userEmail).toBeVisible({ timeout: TIMEOUTS.MEDIUM })
        console.log('✅ User authenticated and visible in UI')

        // Step 4: Ensure we're on /chat/ before seeding so the user exists server-side
        await expect(page).toHaveURL(/\/chat\//, { timeout: TIMEOUTS.LONG })

        // Step 5: Apply scenario to the logged-in user to create an unassigned OpenAI credential
        console.log('🔧 Applying credential scenario: user-with-openai...')
        await seedScenario('user-with-openai')

        // Wait for database operations to complete
        await page.waitForLoadState('networkidle')
        console.log('✅ Scenario prepared for dropdown testing')

        // Step 6: Refresh /chat to ensure modal triggers automatically
        console.log('🚀 Navigating to /chat...')
        await page.goto('/chat', { waitUntil: 'networkidle' })
        await expect(page).not.toHaveURL(/auth0\.com/)

        // Step 7: Wait for modal to appear
        console.log('⏳ Waiting for credentials modal...')
        await page.waitForSelector(`[role="dialog"]`, { timeout: TIMEOUTS.MODAL_APPEAR })

        const modal = page.getByRole('dialog', { name: MODAL_TITLES.credentials })
        await expect(modal).toBeVisible()
        console.log('✅ Credentials modal appeared')

        // Step 6: Wait for loading to resolve
        await waitForLoadingToResolve(modal)

        // Step 7: Look for OpenAI card in Required section (Chat Models are always required)
        console.log('🔍 Looking for OpenAI card in Required section...')
        const openaiCard = await getCredentialCard(modal, 'openai', SECTIONS.required)
        await expect(openaiCard).toBeVisible()
        console.log('✅ OpenAI card found in Required section')

        // Step 8: Check dropdown initial state
        // Note: Modal auto-selects the first available credential if user has one
        console.log('📋 Checking initial dropdown state...')
        const dropdown = openaiCard.getByRole('combobox')
        await expect(dropdown).toBeVisible()

        // Get the current dropdown text (may be auto-selected or placeholder)
        const initialDropdownText = await dropdown.textContent()
        console.log(`📋 Initial dropdown shows: "${initialDropdownText}"`)

        // Step 9: Open dropdown to see available options
        console.log('📂 Opening dropdown to view available credentials...')
        await dropdown.click()

        // Wait for options to appear
        const options = page.getByRole('option')
        await expect(options.first()).toBeVisible({ timeout: TIMEOUTS.SHORT })
        const optionCount = await options.count()
        console.log(`✅ Dropdown has ${optionCount} options available`)

        // Step 10: Find and select an actual credential (not placeholder)
        // Filter out placeholder options like "Or choose existing..."
        let selectedCredentialName: string | null = null
        for (let i = 0; i < optionCount; i++) {
            const optionText = await options.nth(i).textContent()
            // Skip placeholder options
            if (optionText && !optionText.toLowerCase().includes('choose existing') && !optionText.toLowerCase().includes('select')) {
                selectedCredentialName = optionText.trim()
                console.log(`🎯 Selecting credential: "${selectedCredentialName}"`)
                await options.nth(i).click()
                break
            }
        }

        // Ensure we found a real credential to select
        expect(selectedCredentialName).toBeTruthy()
        console.log(`✅ Selected credential: "${selectedCredentialName}"`)

        // Step 11: Verify dropdown updates with selected value (should be closed now)
        console.log('✅ Verifying dropdown updates with selection...')
        // Re-query the dropdown since it may have re-rendered after selection
        const updatedDropdown = openaiCard.getByRole('combobox')
        await expect(updatedDropdown).toBeVisible({ timeout: TIMEOUTS.SHORT })
        await expect(updatedDropdown).toContainText(selectedCredentialName!, { timeout: TIMEOUTS.SHORT })
        console.log('✅ Dropdown successfully updated with selected credential')

        // Step 12: Test selection persistence - reopen dropdown and verify selection
        console.log('🔄 Testing selection persistence...')
        await updatedDropdown.click()

        // Verify the selected option has aria-selected="true"
        const selectedOption = page.getByRole('option', { name: selectedCredentialName! })
        await expect(selectedOption).toBeVisible()
        await expect(selectedOption).toHaveAttribute('aria-selected', 'true')
        console.log('✅ Selected option shows aria-selected="true"')

        // Close dropdown
        await page.keyboard.press('Escape')

        // Step 13: Final verification that selection persists after closing
        await expect(updatedDropdown).toContainText(selectedCredentialName!)
        console.log('✅ Selection persistence verified successfully')
    })
})
