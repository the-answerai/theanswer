import { test, expect } from '@playwright/test'
import { loginWithTestUser } from '../../helpers/auth'
import { resetOnly, seedScenario } from '../../helpers/database'
import { waitForLoadingToResolve, getCredentialCard } from '../../helpers/credentials'
import { MODAL_TITLES, CREDENTIAL_LABELS, BUTTON_TEXTS } from '../../helpers/selectors'

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
        await expect(userEmail).toBeVisible({ timeout: 10000 })
        console.log('✅ User authenticated and visible in UI')

        // Step 4: Ensure we're on /chat/ before seeding so the user exists server-side
        await expect(page).toHaveURL(/\/chat\//, { timeout: 20000 })

        // Step 5: Apply scenario to the logged-in user (OpenAI credential exists but unassigned)
        console.log('🔧 Applying credential scenario: user-with-openai...')
        await seedScenario('user-with-openai')

        // Optional: allow slight delay for database propagation
        await page.waitForTimeout(2000)

        // Step 6: Refresh /chat so modal pulls updated assignments
        console.log('🚀 Navigating to /chat...')
        await page.goto('/chat', { waitUntil: 'networkidle' })
        await expect(page).not.toHaveURL(/auth0\.com/)

        // Step 7: Wait for credentials modal to appear
        console.log('⏳ Waiting for credentials modal...')
        await page.waitForSelector(`[role="dialog"]`, { timeout: 10000 })
        const modal = page.getByRole('dialog', { name: MODAL_TITLES.credentials })
        await expect(modal).toBeVisible()

        // Step 6: Wait for loading to resolve
        await waitForLoadingToResolve(modal)

        // Step 7: Get OpenAI credential card
        console.log('📋 Getting OpenAI credential card...')
        const openaiCard = getCredentialCard(modal, CREDENTIAL_LABELS.openai)
        await expect(openaiCard).toBeVisible()

        // Step 8: Get Assign & Continue button
        console.log('🔍 Getting Assign & Continue button...')
        const assignButton = modal.getByRole('button', { name: BUTTON_TEXTS.assignAndContinue })
        await expect(assignButton).toBeVisible()

        // Step 9: Check dropdown initial state (should be closed with placeholder)
        console.log('📋 Checking dropdown initial state...')
        const dropdown = openaiCard.getByRole('combobox')
        await expect(dropdown).toBeVisible()
        await expect(openaiCard.getByText('Select Credential').first()).toBeVisible()

        // Step 10: Open dropdown to see available options
        console.log('🔽 Opening credential dropdown...')
        await dropdown.click()

        // Step 11: Wait for options to appear and select first option
        const firstOption = page.getByRole('option').first()
        await expect(firstOption).toBeVisible()

        // Get the credential name for later verification
        const selectedCredentialName = await firstOption.textContent()
        console.log(`🎯 Selecting credential: ${selectedCredentialName}`)

        await firstOption.click()

        // Step 12: Verify dropdown shows selected credential
        await expect(dropdown).toContainText(selectedCredentialName || 'Selected')

        // Step 13: Click Assign & Continue button
        console.log('🚀 Clicking Assign & Continue button...')
        await assignButton.click()

        // Step 14: Verify credential shows as "Assigned" after clicking
        console.log('✅ Verifying credential shows as Assigned after button click...')
        await expect(openaiCard.getByText('Assigned')).toBeVisible({ timeout: 5000 })

        // Step 15: Verify the dropdown shows the assigned credential (remains visible)
        await expect(dropdown).toContainText(selectedCredentialName || 'Selected')

        // Step 16: Verify modal remains open (since there may be other credentials to configure)
        console.log('📋 Verifying modal remains open for other credentials...')
        await expect(modal).toBeVisible()

        // Step 17: Verify we're still on chat page
        await expect(page).toHaveURL(/\/chat\/?/)
        console.log('✅ Confirmed user remains on /chat page with modal still open')

        console.log('🎉 CREDS-005 test completed successfully')
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
        await expect(userEmail).toBeVisible({ timeout: 10000 })
        console.log('✅ User authenticated and visible in UI')

        // Step 4: Ensure we're on /chat/ before seeding so the user exists server-side
        await expect(page).toHaveURL(/\/chat\//, { timeout: 20000 })

        // Step 5: Apply scenario to the logged-in user (everything assigned except Slack)
        console.log('🔧 Applying credential scenario: user-with-all-but-slack-assigned...')
        await seedScenario('user-with-all-but-slack-assigned')

        // Optional: allow slight delay for database propagation
        await page.waitForTimeout(2000)

        // Step 6: Refresh /chat so modal pulls updated assignments
        console.log('🚀 Navigating to /chat...')
        await page.goto('/chat', { waitUntil: 'networkidle' })
        await expect(page).not.toHaveURL(/auth0\.com/)

        // Step 7: Wait for credentials modal to appear
        console.log('⏳ Waiting for credentials modal...')
        await page.waitForSelector(`[role="dialog"]`, { timeout: 10000 })
        const modal = page.getByRole('dialog', { name: MODAL_TITLES.credentials })
        await expect(modal).toBeVisible()

        // Step 6: Wait for loading to resolve
        await waitForLoadingToResolve(modal)

        // Step 7: Get the unassigned slack credential card
        console.log('📋 Getting slack credential card (only unassigned one)...')
        const slackCard = getCredentialCard(modal, CREDENTIAL_LABELS.slack)
        await expect(slackCard).toBeVisible()

        // Step 8: Verify slack shows "Setup Required" status initially
        await expect(slackCard.getByText('Setup Required')).toBeVisible()

        // Step 9: Get Assign & Continue button
        console.log('🔍 Getting Assign & Continue button...')
        const assignButton = modal.getByRole('button', { name: BUTTON_TEXTS.assignAndContinue })
        await expect(assignButton).toBeVisible()

        // Step 10: Open slack credential dropdown
        console.log('🔽 Opening slack credential dropdown...')
        const dropdown = slackCard.getByRole('combobox')
        await expect(dropdown).toBeVisible()
        await dropdown.click()

        // Step 11: Verify dropdown has selectable options available
        console.log('⏳ Waiting for dropdown options to load...')
        await page.waitForSelector('[role="option"]', { timeout: 10000 })
        const availableOptions = page.getByRole('option')
        await expect(availableOptions).toHaveCount(1) // Should have exactly 1 slack credential available
        console.log('✅ Dropdown has selectable options available')

        // Step 12: Select the first available credential option
        const firstOption = page.getByRole('option').first()
        await expect(firstOption).toBeVisible()

        const selectedCredentialName = await firstOption.textContent()
        console.log(`🎯 Selecting slack credential: ${selectedCredentialName}`)

        await firstOption.click()

        // Step 13: Verify dropdown shows selected credential
        await expect(dropdown).toContainText(selectedCredentialName || 'Selected')

        // Step 14: Click Assign & Continue button
        console.log('🚀 Clicking Assign & Continue button (final credential assignment)...')
        await assignButton.click()

        // Step 15: Since this is the final credential, modal should close immediately
        // Look for success notification instead of "Assigned" text in the closed modal
        console.log('✅ Verifying credentials saved successfully notification...')
        await expect(page.getByText('Credentials saved successfully!')).toBeVisible({ timeout: 5000 })

        // Step 16: Verify modal is now closed (all credentials configured)
        console.log('🔄 Verifying modal closed after final assignment...')
        await expect(modal).toBeHidden({ timeout: 5000 })

        // Step 17: Verify we're still on chat page
        await expect(page).toHaveURL(/\/chat\/?/)
        console.log('✅ Confirmed user remains on /chat page with modal closed')

        console.log('🎉 CREDS-005 final assignment test completed successfully - modal closed!')
    })
})
