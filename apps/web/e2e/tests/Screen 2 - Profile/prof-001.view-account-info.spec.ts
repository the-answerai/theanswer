import { test, expect } from '@playwright/test'
import { loginWithTestUser } from '../../helpers/auth'
import { resetOnly, seedScenario } from '../../helpers/database'
import { PROFILE_SELECTORS } from '../../helpers/selectors'

test.describe('PROF-001: View Account Info - Profile Card with Avatar, Display Name, and Email', () => {
    test.beforeEach(async ({ page }) => {
        console.log('🗑️ Resetting database for clean test state...')
        await resetOnly()

        console.log('🔐 Logging in as admin user...')
        await loginWithTestUser(page, 'admin', true)

        // Verify we're authenticated and on the chat page
        const userEmail = page.locator('text=' + process.env.TEST_USER_ENTERPRISE_ADMIN_EMAIL!).first()
        await expect(userEmail).toBeVisible({ timeout: 10000 })
        await expect(page).toHaveURL(/\/chat\//, { timeout: 20000 })
        console.log('✅ User authenticated and visible in UI')

        console.log('🔧 Applying baseline scenario...')
        await seedScenario('baseline', 'admin')
        await page.waitForTimeout(2000)
    })

    test('should display profile card with avatar, display name, and email accurately', async ({ page }) => {
        console.log('🚀 Navigating to profile page...')
        await page.goto('/profile', { waitUntil: 'networkidle' })
        await expect(page).not.toHaveURL(/auth0\.com/)
        console.log('✅ Successfully navigated to profile page')

        // Wait for page to be fully loaded
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(1000)

        // Verify profile card is visible
        console.log('📋 Verifying profile card visibility...')
        const profileCard = page.locator(PROFILE_SELECTORS.profileCard).first()
        await expect(profileCard).toBeVisible({ timeout: 10000 })
        console.log('✅ Profile card is visible')

        // Verify avatar is visible in profile card
        console.log('🖼️ Verifying avatar in profile card...')
        const avatar = page.locator(PROFILE_SELECTORS.avatar).first()
        await expect(avatar).toBeVisible({ timeout: 10000 })
        console.log('✅ Avatar is visible')

        // Verify display name is visible in profile card
        console.log('👤 Verifying display name in profile card...')
        const displayName = page.locator('h5').filter({ hasText: process.env.TEST_USER_ENTERPRISE_ADMIN_EMAIL! })
        await expect(displayName).toBeVisible({ timeout: 10000 })
        console.log('✅ Display name is visible and accurate')

        // Verify email is visible in profile card
        console.log('📧 Verifying email in profile card...')
        const profileEmail = page.locator('p').filter({ hasText: process.env.TEST_USER_ENTERPRISE_ADMIN_EMAIL! }).first()
        await expect(profileEmail).toBeVisible({ timeout: 10000 })
        console.log('✅ Email is visible and accurate')

        console.log('🎉 PROF-001 Test Passed: Avatar, display name, and email are all visible and accurate')
    })
})
