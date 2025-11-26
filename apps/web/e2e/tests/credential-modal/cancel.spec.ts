import { test, expect } from '@playwright/test'
import {
    resetOnly,
    seedScenario,
    loginWithTestUser,
    waitForLoadingToResolve,
    expectConfirmDialogVisible,
    confirmDialogAction,
    MODAL_TITLES,
    TIMEOUTS
} from '../../helpers'

test.describe('Cancel behaviour', () => {
    test.beforeEach(async ({ page }) => {
        console.log('🗑️ Resetting database for clean test state...')
        await resetOnly()

        console.log('🔐 Logging in as admin (creates default chatflow with credential requirements)...')
        await loginWithTestUser(page, 'admin', true)

        await expect(page).toHaveURL(/\/chat\/?/, { timeout: TIMEOUTS.LONG })

        // Seed baseline scenario - this creates orphaned credentials (not visible to user)
        // The user's chatflow (created during login) has credential requirements but no credentials available
        console.log('🔧 Applying baseline scenario (creates orphaned credentials)...')
        await seedScenario('baseline', 'admin')

        // Navigate to /chat to trigger the modal
        // The modal should show required credentials with NO dropdown options (user has no credentials)
        await page.goto('/chat', { waitUntil: 'networkidle' })
        await expect(page).not.toHaveURL(/auth0\.com/)

        // Wait for modal to appear
        await page.waitForSelector(`[role="dialog"]`, { timeout: TIMEOUTS.MODAL_APPEAR })
        const modalCheck = page.getByRole('dialog', { name: MODAL_TITLES.credentials })
        await expect(modalCheck).toBeVisible({ timeout: TIMEOUTS.LONG })
    })

    test('shows confirmation dialog when skipping with missing required credentials', async ({ page }) => {
        const modal = page.getByRole('dialog', { name: MODAL_TITLES.credentials })
        await waitForLoadingToResolve(modal)

        // Verify the Required section exists
        console.log('🔍 Checking for Required section...')
        const requiredSection = modal.getByTestId('credential-section-required')
        await expect(requiredSection).toBeVisible({ timeout: TIMEOUTS.SHORT })
        console.log('✅ Required section visible')

        // Verify at least one credential card is shown in Required section
        const credentialCards = requiredSection.locator('[data-testid^="credential-card-"]')
        const cardCount = await credentialCards.count()
        expect(cardCount).toBeGreaterThan(0)
        console.log(`✅ Found ${cardCount} credential card(s) in Required section`)

        // Clear any auto-selected credentials by selecting "Or choose existing..." option
        // This ensures we have unassigned required credentials to trigger the confirmation dialog
        console.log('🔄 Clearing auto-selected credentials...')
        const firstCard = credentialCards.first()
        const dropdown = firstCard.getByRole('combobox')

        // Check if dropdown exists and has a selection
        if (await dropdown.isVisible().catch(() => false)) {
            await dropdown.click()
            // Select the empty option "Or choose existing..."
            const emptyOption = page.getByRole('option', { name: /Or choose existing/i })
            if (await emptyOption.isVisible().catch(() => false)) {
                await emptyOption.click()
                console.log('✅ Cleared credential selection')
            } else {
                // Close dropdown if empty option not found
                await page.keyboard.press('Escape')
            }
        }

        // Verify Continue button is DISABLED (no credentials are assigned)
        console.log('📋 Verifying Continue button is disabled...')
        const continueButton = modal.getByRole('button', { name: /(Continue|Next)/i })
        await expect(continueButton).toBeVisible()
        await expect(continueButton).toBeDisabled()
        console.log('✅ Continue button is disabled (as expected with missing required credentials)')

        // Click Skip button - should show confirmation dialog
        console.log('🖱️ Clicking skip button...')
        const skipButton = modal.getByRole('button', { name: /(Cancel|I'll finish this later|Skip)/i })
        await expect(skipButton).toBeVisible()
        await skipButton.click()

        // Verify confirmation dialog appears
        // The dialog title is "Required credentials missing" when clicking Cancel/Skip
        console.log('🔍 Checking for confirmation dialog...')
        const confirmDialog = await expectConfirmDialogVisible(page, 'Required credentials missing')
        console.log('✅ Confirmation dialog appeared')

        // Verify the confirmation dialog has the correct message about workflow not working properly
        await expect(confirmDialog.getByText(/will not work properly without required credentials/i)).toBeVisible()
        console.log('✅ Confirmation dialog shows appropriate warning message')

        // Verify the confirmation dialog has "Close Anyway" and "Continue Setup" buttons
        const closeAnywayButton = confirmDialog.getByRole('button', { name: /Close Anyway/i })
        const continueSetupButton = confirmDialog.getByRole('button', { name: /Continue Setup/i })
        await expect(closeAnywayButton).toBeVisible()
        await expect(continueSetupButton).toBeVisible()
        console.log('✅ Confirmation dialog has both action buttons')

        // Test: Click "Continue setup" - should dismiss confirmation and keep modal open
        console.log('🖱️ Clicking "Continue setup" button...')
        await confirmDialogAction(confirmDialog, 'cancel')

        // Verify confirmation dialog is closed
        await expect(confirmDialog).toBeHidden({ timeout: TIMEOUTS.SHORT })
        console.log('✅ Confirmation dialog dismissed')

        // Verify credentials modal is still visible
        await expect(modal).toBeVisible()
        console.log('✅ Credentials modal remains open after canceling skip')

        // Test: Click Skip again and this time confirm
        console.log('🖱️ Clicking skip button again...')
        await skipButton.click()

        // Wait for confirmation dialog to appear again
        const confirmDialog2 = await expectConfirmDialogVisible(page, 'Required credentials missing')

        // Click "Close Anyway"
        console.log('🖱️ Clicking "Close Anyway" button...')
        await confirmDialogAction(confirmDialog2, 'confirm')

        // Verify both dialogs are now closed
        await expect(confirmDialog2).toBeHidden({ timeout: TIMEOUTS.SHORT })
        await expect(modal).toBeHidden({ timeout: TIMEOUTS.MEDIUM })
        console.log('✅ Both dialogs closed after confirming skip')
    })

    test('shows confirmation dialog when clicking X to close with missing required credentials', async ({ page }) => {
        const modal = page.getByRole('dialog', { name: MODAL_TITLES.credentials })
        await waitForLoadingToResolve(modal)

        // Verify the Required section exists
        const requiredSection = modal.getByTestId('credential-section-required')
        await expect(requiredSection).toBeVisible({ timeout: TIMEOUTS.SHORT })

        // Clear any auto-selected credentials first
        console.log('🔄 Clearing auto-selected credentials...')
        const credentialCards = requiredSection.locator('[data-testid^="credential-card-"]')
        const firstCard = credentialCards.first()
        const dropdown = firstCard.getByRole('combobox')

        if (await dropdown.isVisible().catch(() => false)) {
            await dropdown.click()
            const emptyOption = page.getByRole('option', { name: /Or choose existing/i })
            if (await emptyOption.isVisible().catch(() => false)) {
                await emptyOption.click()
                console.log('✅ Cleared credential selection')
            } else {
                await page.keyboard.press('Escape')
            }
        }

        // Find the close button (X) in the modal header
        // The IconButton contains an IconX svg from @tabler/icons-react
        console.log('🔍 Looking for close button (X)...')
        // Look for the IconButton in DialogTitle that contains the X icon
        // Use multiple selectors to find the close button reliably
        const closeButton = modal
            .locator('button')
            .filter({ has: page.locator('svg.tabler-icon-x, svg[class*="icon-x"]') })
            .first()
        // Fallback: if tabler icon classes don't work, find button with size='small' near the title
        const closeButtonFallback = modal.locator('.MuiDialogTitle-root button').last()
        const buttonToUse = (await closeButton.isVisible().catch(() => false)) ? closeButton : closeButtonFallback
        await expect(buttonToUse).toBeVisible({ timeout: TIMEOUTS.SHORT })
        console.log('✅ Close button found')

        // Click the close button
        console.log('🖱️ Clicking close button (X)...')
        await buttonToUse.click()

        // Verify confirmation dialog appears with "Required credentials missing" title
        console.log('🔍 Checking for confirmation dialog...')
        const confirmDialog = await expectConfirmDialogVisible(page, 'Required credentials missing')
        console.log('✅ Confirmation dialog appeared with correct title')

        // Verify the confirmation dialog message
        await expect(confirmDialog.getByText(/will not work properly without required credentials/i)).toBeVisible()
        console.log('✅ Confirmation dialog shows appropriate warning message')

        // Click "Continue setup" to cancel the close
        console.log('🖱️ Clicking "Continue setup" to cancel close...')
        await confirmDialogAction(confirmDialog, 'cancel')

        // Verify credentials modal is still visible
        await expect(modal).toBeVisible()
        console.log('✅ Credentials modal remains open after canceling close')

        // Click close button again and confirm this time
        console.log('🖱️ Clicking close button (X) again...')
        await buttonToUse.click()

        // Wait for confirmation dialog
        const confirmDialog2 = await expectConfirmDialogVisible(page, 'Required credentials missing')

        // Click "Close anyway"
        console.log('🖱️ Clicking "Close anyway" button...')
        await confirmDialogAction(confirmDialog2, 'confirm')

        // Verify both dialogs are now closed
        await expect(confirmDialog2).toBeHidden({ timeout: TIMEOUTS.SHORT })
        await expect(modal).toBeHidden({ timeout: TIMEOUTS.MEDIUM })
        console.log('✅ Both dialogs closed after confirming close')
    })
})
