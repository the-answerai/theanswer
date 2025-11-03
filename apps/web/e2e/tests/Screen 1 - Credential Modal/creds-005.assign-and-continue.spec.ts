import { test, expect } from '@playwright/test'
import { loginWithTestUser } from '../../helpers/auth'
import { resetOnly, seedScenario } from '../../helpers/database'
import { waitForLoadingToResolve, getCredentialCard, expectModalVisible } from '../../helpers/credentials'
import { MODAL_TITLES, CREDENTIAL_LABELS, BUTTON_TEXTS } from '../../helpers/selectors'

test.describe('Assign & Continue', () => {
    test.beforeEach(async ({ page }) => {
        console.log('🗑️ Resetting database for clean test state...')
        await resetOnly()
    })

    test('assigns credential and continues', async ({ page }) => {
        console.log('🔐 Logging in as admin (creates user and chatflow)...')
        await loginWithTestUser(page, 'admin', true)

        console.log('🌱 Applying credential scenario AFTER login: user-with-openai...')
        await seedScenario('user-with-openai', 'admin')

        await expect(page).toHaveURL(/\/chat\//, { timeout: 20000 })

        await page.goto('/chat', { waitUntil: 'networkidle' })
        await expect(page).not.toHaveURL(/auth0\.com/)
        await expectModalVisible(page)

        const modal = page.getByRole('dialog', { name: MODAL_TITLES.credentials })
        await waitForLoadingToResolve(modal)

        // Step 7: Get OpenAI credential card
        console.log('📋 Getting OpenAI credential card...')
        const openaiCard = getCredentialCard(modal, CREDENTIAL_LABELS.openai)
        await expect(openaiCard).toBeVisible()

        // Step 8: Get Continue button
        console.log('🔍 Getting Continue button...')
        const continueButton = modal.getByRole('button', { name: BUTTON_TEXTS.continue })
        await expect(continueButton).toBeVisible()

        // Step 9: Click "Use existing" button to expand dropdown section
        console.log('📂 Clicking "Use existing" button to expand dropdown...')
        const useExistingButton = openaiCard.getByRole('button', { name: /Use existing \(\d+\)/ })
        await expect(useExistingButton).toBeVisible()
        await useExistingButton.click()

        // Step 10: Wait for dropdown to appear and open it
        console.log('🔽 Opening credential dropdown...')
        const dropdown = openaiCard.getByRole('combobox')
        await expect(dropdown).toBeVisible({ timeout: 2000 })
        await dropdown.click()

        // Step 11: Wait for options to appear and select credential (skip placeholder)
        const credentialOption = page
            .getByRole('option')
            .filter({ hasNotText: /Select existing/i })
            .first()
        await expect(credentialOption).toBeVisible()

        // Get the credential name for later verification
        const selectedCredentialName = await credentialOption.textContent()
        console.log(`🎯 Selecting credential: ${selectedCredentialName}`)

        await credentialOption.click()

        // Step 12: Verify dropdown shows selected credential
        await expect(dropdown).toContainText(selectedCredentialName || 'Selected')

        // Step 13: Click Continue button
        console.log('🚀 Clicking Continue button...')
        await continueButton.click()

        // Step 14: Wait for save operation to complete
        console.log('⏳ Waiting for credential save to complete...')
        await expect(continueButton).not.toHaveText('Saving...', { timeout: 15000 })
        await expect(continueButton).toHaveText('Continue')

        // Step 15: Verify credential shows as "Connected" after save completes
        console.log('✅ Verifying credential shows as Connected after save...')
        await expect(openaiCard.getByText('Connected', { exact: true })).toBeVisible({ timeout: 5000 })

        // Step 16: Verify the dropdown shows the assigned credential (remains visible)
        await expect(dropdown).toContainText(selectedCredentialName || 'Selected')

        // Step 17: Verify modal remains open (since there may be other credentials to configure)
        console.log('📋 Verifying modal remains open for other credentials...')
        await expect(modal).toBeVisible()

        // Step 18: Verify we're still on chat page
        await expect(page).toHaveURL(/\/chat\/?/)
        console.log('✅ Confirmed user remains on /chat page with modal still open')

        console.log('🎉 CREDS-005 test completed successfully')
    })

    test('closes modal after final assignment', async ({ page }) => {
        console.log('🔐 Logging in as admin (creates user and chatflow)...')
        await loginWithTestUser(page, 'admin', true)

        console.log('🌱 Applying credential scenario AFTER login: user-with-all-but-slack-assigned...')
        await seedScenario('user-with-all-but-slack-assigned', 'admin')

        await expect(page).toHaveURL(/\/chat\//, { timeout: 20000 })

        await page.goto('/chat', { waitUntil: 'networkidle' })
        await expect(page).not.toHaveURL(/auth0\.com/)
        await expectModalVisible(page)

        const modal = page.getByRole('dialog', { name: MODAL_TITLES.credentials })
        await waitForLoadingToResolve(modal)

        // Step 7: Get the unassigned slack credential card
        console.log('📋 Getting slack credential card (only unassigned one)...')
        const slackCard = getCredentialCard(modal, CREDENTIAL_LABELS.slack)
        await expect(slackCard).toBeVisible()

        // Step 8: Verify slack shows "Required" chip initially
        await expect(slackCard.getByText('Required')).toBeVisible()

        // Step 9: Get Continue button
        console.log('🔍 Getting Continue button...')
        const continueButton = modal.getByRole('button', { name: BUTTON_TEXTS.continue })
        await expect(continueButton).toBeVisible()

        // Step 10: Click "Use existing" button to expand dropdown
        console.log('📂 Clicking "Use existing" button to expand dropdown...')
        const useExistingButton = slackCard.getByRole('button', { name: /Use existing \(\d+\)/ })
        await expect(useExistingButton).toBeVisible()
        await useExistingButton.click()

        // Step 11: Open slack credential dropdown
        console.log('🔽 Opening slack credential dropdown...')
        const dropdown = slackCard.getByRole('combobox')
        await expect(dropdown).toBeVisible({ timeout: 2000 })
        await dropdown.click()

        // Step 12: Verify dropdown has selectable options available
        console.log('⏳ Waiting for dropdown options to load...')
        await page.waitForSelector('[role="option"]', { timeout: 10000 })
        const availableOptions = page.getByRole('option')
        await expect(availableOptions).toHaveCount(2) // Placeholder + 1 slack credential
        console.log('✅ Dropdown has selectable options available')

        // Step 13: Select the slack credential (skip placeholder)
        const slackOption = page
            .getByRole('option')
            .filter({ hasNotText: /Select existing/i })
            .first()
        await expect(slackOption).toBeVisible()

        const selectedCredentialName = await slackOption.textContent()
        console.log(`🎯 Selecting slack credential: ${selectedCredentialName}`)

        await slackOption.click()

        // Step 14: Verify dropdown shows selected credential
        await expect(dropdown).toContainText(selectedCredentialName || 'Selected')

        // Step 15: Click Continue button
        console.log('🚀 Clicking Continue button (final credential assignment)...')
        await continueButton.click()

        // Step 16: Wait for modal to close and success notification to appear
        // (Modal closes immediately on final credential assignment)
        console.log('⏳ Waiting for save to complete and modal to close...')
        await expect(page.getByText('Credentials saved successfully!')).toBeVisible({ timeout: 15000 })

        // Step 17: Verify modal is now closed (all credentials configured)
        console.log('🔄 Verifying modal closed after final assignment...')
        await expect(modal).toBeHidden({ timeout: 5000 })

        // Step 18: Verify we're still on chat page
        await expect(page).toHaveURL(/\/chat\/?/)
        console.log('✅ Confirmed user remains on /chat page with modal closed')

        console.log('🎉 CREDS-005 final assignment test completed successfully - modal closed!')
    })
})
