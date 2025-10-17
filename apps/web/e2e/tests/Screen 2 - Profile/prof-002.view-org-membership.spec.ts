import { test, expect } from '@playwright/test'
import { loginWithTestUser } from '../../helpers/auth'
import { resetOnly } from '../../helpers/database'
import { PROFILE_SELECTORS } from '../../helpers/selectors'

test.describe('PROF-002: View Org Membership - Organization Name and Membership Info', () => {
    test.setTimeout(60000) // 60 seconds timeout for these tests

    test.beforeEach(async ({ page, context }) => {
        console.log('🗑️ Resetting database for clean test state...')
        await resetOnly()

        // Clear all browser state for a completely fresh start
        console.log('🧹 Clearing all browser state...')
        await context.clearCookies()
        await context.clearPermissions()
        await page.goto('about:blank')

        console.log('🔐 Logging in as admin user...')
        await loginWithTestUser(page, 'admin', true)

        // Verify we're authenticated and on the chat page
        const userEmail = page.locator('text=' + process.env.TEST_USER_ENTERPRISE_ADMIN_EMAIL!).first()
        await expect(userEmail).toBeVisible({ timeout: 10000 })
        await expect(page).toHaveURL(/\/chat\//, { timeout: 20000 })
        console.log('✅ User authenticated and visible in UI')
    })

    test('should display organization name and membership information accurately', async ({ page }) => {
        console.log('🚀 Navigating to profile page...')
        await page.goto('/profile', { waitUntil: 'domcontentloaded' })
        await expect(page).not.toHaveURL(/auth0\.com/)
        console.log('✅ Successfully navigated to profile page')

        // Verify profile card is visible (this waits for content to load)
        console.log('📋 Verifying profile card visibility...')
        const profileCard = page.locator(PROFILE_SELECTORS.profileCard).first()
        await expect(profileCard).toBeVisible({ timeout: 15000 })
        console.log('✅ Profile card is visible')

        // Verify organization name is visible
        console.log('🏢 Verifying organization name...')
        const expectedOrgName = process.env.TEST_ENTERPRISE_ORG_NAME!
        const orgName = page.locator('text=' + expectedOrgName).first()
        await expect(orgName).toBeVisible({ timeout: 10000 })
        console.log(`✅ Organization name "${expectedOrgName}" is visible`)

        // Verify organization membership section is present
        console.log('👥 Verifying organization membership section...')
        // Looking for text that indicates membership or organization details
        // This could be "Organization Member", "Admin", "Member", etc.
        const membershipInfo = page.locator(PROFILE_SELECTORS.profileCard).locator('text=/Organization|Member|Admin|Role/i').first()
        await expect(membershipInfo).toBeVisible({ timeout: 10000 })
        console.log('✅ Organization membership information is visible')

        console.log('🎉 PROF-002 Test Passed: Organization name and membership info are displayed correctly')
    })
})
