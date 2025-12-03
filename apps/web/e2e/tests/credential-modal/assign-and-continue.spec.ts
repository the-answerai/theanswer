import { test, expect } from '@playwright/test'
import {
    resetOnly,
    seedScenario,
    loginWithTestUser,
    waitForLoadingToResolve,
    getCredentialCard,
    expectCredentialInSection,
    MODAL_TITLES,
    BUTTON_TEXTS,
    TIMEOUTS,
    SECTIONS,
    NOTIFICATIONS
} from '../../helpers'

test.describe('Assign & Continue', () => {
    test('assigns credential and continues', async ({ page }) => {
        // Step 1: Clean database for isolated test
        console.log('🗑️ Resetting database for clean test state...')
        await resetOnly()

        // Step 2: Login creates real user + default chatflow (Auth0 handles user creation)
        console.log('🔐 Logging in as admin (creates authenticated user + default chatflow)...')
        await loginWithTestUser(page, 'admin', true)

        // Step 3: Verify we're authenticated
        const userEmail = page.locator('text=' + process.env.TEST_USER_ENTERPRISE_ADMIN_EMAIL!).first()
        await expect(userEmail).toBeVisible({ timeout: TIMEOUTS.MEDIUM })
        console.log('✅ User authenticated and visible in UI')

        // Step 4: Ensure we're on /chat before seeding so the user exists server-side
        await expect(page).toHaveURL(/\/chat\/?/, { timeout: TIMEOUTS.LONG })

        // Step 5: Apply scenario to the logged-in user (OpenAI credential exists but unassigned)
        console.log('🔧 Applying credential scenario: user-with-openai...')
        await seedScenario('user-with-openai')

        // Wait for database operations to complete
        await page.waitForLoadState('networkidle')

        // Step 6: Refresh /chat so modal pulls updated assignments
        console.log('🚀 Navigating to /chat...')
        await page.goto('/chat', { waitUntil: 'networkidle' })
        await expect(page).not.toHaveURL(/auth0\.com/)

        // Step 7: Wait for credentials modal to appear
        console.log('⏳ Waiting for credentials modal...')
        await page.waitForSelector(`[role="dialog"]`, { timeout: TIMEOUTS.MODAL_APPEAR })
        const modal = page.getByRole('dialog', { name: MODAL_TITLES.credentials })
        await expect(modal).toBeVisible()

        // Step 6: Wait for loading to resolve
        await waitForLoadingToResolve(modal)

        // Step 7: Get OpenAI credential card from Required section (Chat Models are always required)
        console.log('📋 Getting OpenAI credential card from Required section...')
        const openaiCard = await getCredentialCard(modal, 'openai', SECTIONS.required)
        await expect(openaiCard).toBeVisible()

        // Step 8: Get Continue button
        // Note: The modal auto-selects the first available credential, so Continue may already be enabled
        console.log('🔍 Getting Continue button...')
        const continueButton = modal.getByRole('button', { name: BUTTON_TEXTS.continue })
        await expect(continueButton).toBeVisible()

        // Step 9: Check dropdown state - modal auto-selects first credential if available
        console.log('📋 Checking dropdown state...')
        const dropdown = openaiCard.getByRole('combobox')
        await expect(dropdown).toBeVisible()

        // The dropdown should show the auto-selected credential (not placeholder)
        // Get the current selection text
        const dropdownText = await dropdown.textContent()
        console.log(`📋 Dropdown shows: "${dropdownText}"`)

        // Step 10: Verify Continue button is enabled (credential auto-selected)
        await expect(continueButton).toBeEnabled()
        console.log('✅ Continue button enabled (credential auto-selected)')

        // Step 13: Click Continue button
        console.log('🚀 Clicking Continue button...')
        await continueButton.click()

        // Step 14: Wait for API call to complete
        await page.waitForResponse((resp) => resp.url().includes('/api/v1/chatflows/') && resp.request().method() === 'PUT').catch(() => {})

        // Step 15: In QuickSetup mode, verify credential moved to Connected section
        // In regular mode, modal may stay open or close depending on remaining required credentials
        const modalStillOpen = await modal.isVisible().catch(() => false)
        if (modalStillOpen) {
            console.log('📋 Modal still open, verifying OpenAI moved to Connected section...')
            await expectCredentialInSection(modal, 'OpenAI', SECTIONS.connected)
            console.log('✅ OpenAI moved to Connected section')
        } else {
            console.log('✅ Modal closed (all required credentials assigned)')
        }

        // Step 16: Verify we're still on chat page
        await expect(page).toHaveURL(/\/chat\/?/)
        console.log('✅ Confirmed user remains on /chat page')

        console.log('🎉 Assign and continue test completed successfully')
    })

    test('closes modal after final assignment', async ({ page }) => {
        // Step 1: Clean database for isolated test
        console.log('🗑️ Resetting database for clean test state...')
        await resetOnly()

        // Step 2: Login creates real user + default chatflow (Auth0 handles user creation)
        console.log('🔐 Logging in as admin (creates authenticated user + default chatflow)...')
        await loginWithTestUser(page, 'admin', true)

        // Step 3: Verify we're authenticated
        const userEmail = page.locator('text=' + process.env.TEST_USER_ENTERPRISE_ADMIN_EMAIL!).first()
        await expect(userEmail).toBeVisible({ timeout: TIMEOUTS.MEDIUM })
        console.log('✅ User authenticated and visible in UI')

        // Step 4: Ensure we're on /chat before seeding so the user exists server-side
        await expect(page).toHaveURL(/\/chat\/?/, { timeout: TIMEOUTS.LONG })

        // Step 5: Apply scenario to the logged-in user (everything assigned except Slack)
        console.log('🔧 Applying credential scenario: user-with-all-but-slack-assigned...')
        await seedScenario('user-with-all-but-slack-assigned')

        // Wait for database operations to complete
        await page.waitForLoadState('networkidle')

        // Step 6: Refresh /chat so modal pulls updated assignments
        console.log('🚀 Navigating to /chat...')
        await page.goto('/chat', { waitUntil: 'networkidle' })
        await expect(page).not.toHaveURL(/auth0\.com/)

        // Step 7: Wait for credentials modal to appear
        console.log('⏳ Waiting for credentials modal...')
        await page.waitForSelector(`[role="dialog"]`, { timeout: TIMEOUTS.MODAL_APPEAR })
        const modal = page.getByRole('dialog', { name: MODAL_TITLES.credentials })
        await expect(modal).toBeVisible()

        // Step 6: Wait for loading to resolve
        await waitForLoadingToResolve(modal)

        // Step 7: Verify Slack credential is in Optional section (unassigned)
        console.log('📋 Getting Slack credential card from Optional section (unassigned)...')
        const slackCard = await getCredentialCard(modal, 'slack', SECTIONS.optional)
        await expect(slackCard).toBeVisible()

        // Step 8: Verify Slack is in Optional section (status shown by section placement)
        await expectCredentialInSection(modal, 'slack', SECTIONS.optional)
        console.log('✅ Slack in Optional section (needs assignment)')

        // Step 9: Get Continue button
        console.log('🔍 Getting Continue button...')
        const continueButton = modal.getByRole('button', { name: BUTTON_TEXTS.continue })
        await expect(continueButton).toBeVisible()

        // Step 10: Open slack credential dropdown
        console.log('🔽 Opening slack credential dropdown...')
        const dropdown = slackCard.getByRole('combobox')
        await expect(dropdown).toBeVisible()
        await dropdown.click()

        // Step 11: Verify dropdown has selectable options available
        console.log('⏳ Waiting for dropdown options to load...')
        await page.waitForSelector('[role="option"]', { timeout: TIMEOUTS.MEDIUM })
        const availableOptions = page.getByRole('option')
        // Should have at least 1 slack credential available
        const optionCount = await availableOptions.count()
        expect(optionCount).toBeGreaterThanOrEqual(1)
        console.log(`✅ Dropdown has ${optionCount} selectable options available`)

        // Step 12: Select an actual credential (not the placeholder)
        const allOptions = page.getByRole('option')
        const optionTexts = await allOptions.allTextContents()

        // Find an option that's not the placeholder
        let selectedCredentialName: string | null = null
        for (let i = 0; i < optionTexts.length; i++) {
            const text = optionTexts[i]
            if (text && !text.includes('choose existing')) {
                selectedCredentialName = text
                console.log(`🎯 Selecting slack credential: ${selectedCredentialName}`)
                await allOptions.nth(i).click()
                break
            }
        }

        if (!selectedCredentialName) {
            throw new Error('No valid credential option found (only placeholder available)')
        }

        // Step 13: Verify dropdown shows selected credential
        await expect(dropdown).toContainText(selectedCredentialName || 'Selected')

        // Step 14: Click Continue button (final credential assignment)
        console.log('🚀 Clicking Continue button (final credential assignment)...')
        await continueButton.click()

        // Step 15: Since this is the final required credential, modal should close
        // Look for success notification to confirm all credentials are configured
        console.log('✅ Verifying credentials saved successfully notification...')
        await expect(page.getByText(NOTIFICATIONS.credentialsSaved)).toBeVisible({ timeout: TIMEOUTS.SHORT })

        // Step 16: Verify modal is now closed (all required credentials configured)
        console.log('🔄 Verifying modal closed after final assignment...')
        await expect(modal).toBeHidden({ timeout: TIMEOUTS.SHORT })

        // Step 17: Verify we're still on chat page
        await expect(page).toHaveURL(/\/chat\/?/)
        console.log('✅ Confirmed user remains on /chat page with modal closed')

        console.log('🎉 Final assignment test completed successfully - modal closed!')
    })
})
