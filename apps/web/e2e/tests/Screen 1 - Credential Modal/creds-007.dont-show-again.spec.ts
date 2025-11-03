import { test, expect } from '@playwright/test'
import { loginWithTestUser } from '../../helpers/auth'
import { resetOnly, seedScenario } from '../../helpers/database'
import { waitForLoadingToResolve, expectModalVisible } from '../../helpers/credentials'
import { MODAL_TITLES } from '../../helpers/selectors'

test.describe("Don't show this again functionality", () => {
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

    test('prevents modal from appearing when "Don\'t show this again" is checked', async ({ page }) => {
        const modal = page.getByRole('dialog', { name: MODAL_TITLES.credentials })
        await waitForLoadingToResolve(modal)

        // Step 1: Find and check the "Don't show this again" checkbox
        console.log('✅ Looking for "Don\'t show this again" checkbox...')
        const dontShowCheckbox = modal.getByRole('checkbox', { name: /Don't show this again/i })
        await expect(dontShowCheckbox).toBeVisible()

        // Verify it's initially unchecked
        await expect(dontShowCheckbox).not.toBeChecked()
        console.log('✅ Checkbox is initially unchecked')

        // Step 2: Check the checkbox
        console.log('📋 Checking "Don\'t show this again" checkbox...')
        await dontShowCheckbox.check()
        await expect(dontShowCheckbox).toBeChecked()
        console.log('✅ Checkbox is now checked')

        // Step 3: Close the modal using Cancel button
        console.log('🔽 Closing modal with Cancel button...')
        await modal.getByRole('button', { name: /^Cancel$/ }).click()

        // Handle the confirmation dialog
        const confirmDialog = page.getByRole('dialog', { name: /Close without saving/i })
        await expect(confirmDialog).toBeVisible({ timeout: 5000 })
        await confirmDialog.getByRole('button', { name: /Close anyway/i }).click()

        // Verify modal closes
        await expect(modal).toBeHidden({ timeout: 10000 })
        console.log('✅ Modal closed successfully')

        // Step 4: Navigate to a new chat to trigger modal auto-appear (if it would appear)
        console.log('🔄 Navigating to /chat again to check if modal appears...')
        await page.goto('/chat', { waitUntil: 'networkidle' })
        await expect(page).not.toHaveURL(/auth0\.com/)

        // Step 5: Wait a bit and verify modal does NOT appear
        console.log('⏳ Waiting to ensure modal does not auto-appear...')
        await page.waitForTimeout(3000) // Wait 3 seconds

        const modalAfterReload = page.getByRole('dialog', { name: MODAL_TITLES.credentials })
        await expect(modalAfterReload).toBeHidden()
        console.log('✅ Modal did NOT appear - "Don\'t show this again" is working!')
    })

    test('allows re-enabling modal by unchecking "Don\'t show this again"', async ({ page }) => {
        const modal = page.getByRole('dialog', { name: MODAL_TITLES.credentials })
        await waitForLoadingToResolve(modal)

        // Step 1: Check the "Don't show this again" checkbox
        console.log('📋 Checking "Don\'t show this again" checkbox...')
        const dontShowCheckbox = modal.getByRole('checkbox', { name: /Don't show this again/i })
        await dontShowCheckbox.check()
        await expect(dontShowCheckbox).toBeChecked()

        // Step 2: Close the modal
        console.log('🔽 Closing modal...')
        await modal.getByRole('button', { name: /^Cancel$/ }).click()
        const confirmDialog = page.getByRole('dialog', { name: /Close without saving/i })
        await expect(confirmDialog).toBeVisible({ timeout: 5000 })
        await confirmDialog.getByRole('button', { name: /Close anyway/i }).click()
        await expect(modal).toBeHidden({ timeout: 10000 })

        // Step 3: Manually open the modal using QuickSetup parameter
        console.log('📂 Manually opening modal via QuickSetup parameter...')
        const quickSetupUrl = new URL(page.url())
        quickSetupUrl.searchParams.set('QuickSetup', 'true')
        await page.goto(quickSetupUrl.toString(), { waitUntil: 'networkidle' })

        const reopenedModal = page.getByRole('dialog', { name: MODAL_TITLES.credentials })
        await expect(reopenedModal).toBeVisible()
        await waitForLoadingToResolve(reopenedModal)
        console.log('✅ Modal opened manually')

        // Step 4: Verify checkbox is still checked (preference persisted)
        const reopenedCheckbox = reopenedModal.getByRole('checkbox', { name: /Don't show this again/i })
        await expect(reopenedCheckbox).toBeChecked()
        console.log('✅ Checkbox state persisted - still checked')

        // Step 5: Uncheck the "Don't show this again" checkbox
        console.log('📋 Unchecking "Don\'t show this again" to re-enable auto-appear...')
        await reopenedCheckbox.uncheck()
        await expect(reopenedCheckbox).not.toBeChecked()

        // Step 6: Close the modal
        console.log('🔽 Closing modal after unchecking...')
        await reopenedModal.getByRole('button', { name: /^Cancel$/ }).click()
        const confirmDialog2 = page.getByRole('dialog', { name: /Close without saving/i })
        await expect(confirmDialog2).toBeVisible({ timeout: 5000 })
        await confirmDialog2.getByRole('button', { name: /Close anyway/i }).click()
        await expect(reopenedModal).toBeHidden({ timeout: 10000 })

        // Step 7: Navigate to /chat again - modal SHOULD appear now
        console.log('🔄 Navigating to /chat to verify modal auto-appears again...')
        await page.goto('/chat', { waitUntil: 'networkidle' })
        await expect(page).not.toHaveURL(/auth0\.com/)

        // Step 8: Verify modal appears automatically
        console.log('⏳ Waiting for modal to auto-appear...')
        const modalAfterUnchecking = page.getByRole('dialog', { name: MODAL_TITLES.credentials })
        await expect(modalAfterUnchecking).toBeVisible({ timeout: 10000 })
        console.log('✅ Modal auto-appeared - "Don\'t show this again" was successfully disabled!')
    })
})
