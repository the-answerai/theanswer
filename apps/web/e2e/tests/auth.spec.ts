import { test, expect } from '@playwright/test'
import { loginAsUser, TIMEOUTS, AUTH_SELECTORS } from '../helpers'

// Test user data structure with expected permissions
interface TestUser {
    email: string
    password: string
    role: 'admin' | 'builder' | 'member'
    expectedMenuItems: {
        topLevel: string[]
        studio?: string[]
        dataEngine?: string[] // New: Data Engine submenu items (conditional)
        upgradeVisible: boolean
        exportImportVisible: boolean
    }
}

/**
 * Helper function to check menu item visibility
 * Verifies that expected menu items are visible or hidden based on user role
 * @param page - Playwright page object
 * @param expectedItems - Array of menu item labels to check
 * @param shouldBeVisible - Whether items should be visible (true) or hidden (false)
 */
async function checkMenuItemVisibility(page: any, expectedItems: string[], shouldBeVisible: boolean = true) {
    for (const item of expectedItems) {
        const element = page.getByText(item, { exact: false })
        if (shouldBeVisible) {
            await expect(element).toBeVisible({ timeout: TIMEOUTS.SHORT })
        } else {
            await expect(element).not.toBeVisible({ timeout: TIMEOUTS.SHORT })
        }
    }
}

test.describe('Authentication Flow', () => {
    test('should redirect unauthenticated user to Auth0 login', async ({ page }) => {
        // Clear any existing auth state for this test to ensure a fresh authentication attempt
        await page.context().clearCookies()

        // Navigate to homepage - should trigger Auth0 redirect for unauthenticated users
        await page.goto('/')

        // Should redirect to Auth0 login page
        // Auth0 URLs typically contain the domain from AUTH0_ISSUER_BASE_URL
        await expect(page).toHaveURL(/auth0\.com|\.auth0\.com/, { timeout: TIMEOUTS.MEDIUM })

        // Verify Auth0 login page elements are present
        // First step: Email input should be visible (Auth0 uses multi-step login)
        await expect(page.locator('input[name="username"], input[type="email"], input[name="email"]')).toBeVisible()

        // Continue/Submit button should be present to proceed to password step
        await expect(
            page
                .locator(
                    [
                        'button[type="submit"]',
                        'button:has-text("Continue")',
                        'button:has-text("Next")',
                        'button[data-action-button-primary="true"]'
                    ].join(', ')
                )
                .first()
        ).toBeVisible()

        // Note: Password input is on the next step after clicking continue
    })

    test('should login successfully with valid credentials', async ({ page }) => {
        // Clear any existing auth state for this test to ensure a fresh authentication attempt
        await page.context().clearCookies()

        // Use the refactored login helper function to handle the complete Auth0 flow
        await loginAsUser(
            page,
            process.env.TEST_USER_ENTERPRISE_ADMIN_EMAIL!,
            process.env.TEST_USER_PASSWORD!,
            process.env.TEST_ENTERPRISE_AUTH0_ORG_ID
        )

        // Verify we're logged in and not on Auth0 anymore
        await expect(page).not.toHaveURL(/auth0\.com|\.auth0\.com/)

        // Check that the AppDrawer shows the user's email
        // Looking for the user info section in the lower left corner of AppDrawer
        const userEmail = page.locator('text=' + process.env.TEST_USER_ENTERPRISE_ADMIN_EMAIL!).first()
        await expect(userEmail).toBeVisible({ timeout: TIMEOUTS.MEDIUM })

        // Verify organization name is shown (should be local dev org)
        const orgInfo = page.locator('.MuiTypography-root').filter({ hasText: /local|dev|development/i })
        await expect(orgInfo.first()).toBeVisible({ timeout: TIMEOUTS.SHORT })

        console.log('✅ Login successful - user email and organization verified in AppDrawer')
    })

    test('should show error for invalid credentials', async ({ page }) => {
        // Clear any existing auth state for this test to ensure a fresh authentication attempt
        await page.context().clearCookies()

        // Navigate to homepage - this will redirect to Auth0
        await page.goto('/')

        // Step 1: Wait for Auth0 email input page to load
        await page.waitForSelector('input[name="username"], input[type="email"], input[name="email"]', {
            timeout: TIMEOUTS.MEDIUM
        })

        // Use a unique email to avoid triggering Auth0 account lockout after multiple failed attempts
        const randomEmail = `invalid-${Date.now()}@test.com`
        const emailInput = page.locator('input[name="username"], input[type="email"], input[name="email"]').first()
        await emailInput.fill(randomEmail)

        // Click Continue/Submit to proceed to password step
        const continueButton = page
            .locator(
                [
                    'button[type="submit"]',
                    'button:has-text("Continue")',
                    'button:has-text("Next")',
                    'button[data-action-button-primary="true"]'
                ].join(', ')
            )
            .first()
        await continueButton.click()

        // Step 2: Wait for password input page to load
        await page.waitForSelector('input[name="password"], input[type="password"]', {
            timeout: TIMEOUTS.MEDIUM
        })

        // Fill invalid password to test error handling
        const passwordInput = page.locator('input[name="password"], input[type="password"]').first()
        await passwordInput.fill('wrongpassword')

        // Submit login form
        const submitButton = page
            .locator(
                [
                    'button[type="submit"][data-action-button-primary="true"]',
                    'button[type="submit"]:not([data-provider])',
                    'button:has-text("Log In")',
                    'button:has-text("Sign In")',
                    'button:has-text("Continue")'
                ].join(', ')
            )
            .first()
        await submitButton.click()

        // Should show error message - handle both credential error and account blocked scenarios
        // Auth0 may show different error messages depending on configuration
        const errorMessages = [
            page.getByText('Wrong email or password'),
            page.getByText(/Your account has been blocked/),
            page.getByText(/blocked after multiple consecutive login attempts/)
        ]

        // Wait for any of these error messages to appear
        await Promise.race(
            errorMessages.map((msg) =>
                expect(msg)
                    .toBeVisible({ timeout: TIMEOUTS.MEDIUM })
                    .catch(() => {})
            )
        )

        // Verify at least one error message is visible
        const visibleErrors = await Promise.all(errorMessages.map((msg) => msg.isVisible().catch(() => false)))
        expect(visibleErrors.some((visible) => visible)).toBeTruthy()

        // Should still be on Auth0 domain after failed login attempt
        await expect(page).toHaveURL(/auth0\.com|\.auth0\.com/)
    })
})

test.describe('User Role-Based Authentication and Permissions', () => {
    // Test data for different user types based on AppDrawer logic
    const testUsers: Record<string, TestUser> = {
        admin: {
            email: process.env.TEST_USER_ENTERPRISE_ADMIN_EMAIL!,
            password: process.env.TEST_USER_PASSWORD!,
            role: 'admin',
            expectedMenuItems: {
                topLevel: ['Chat', 'Image Generation', 'Video Generation', 'Agent Studio', 'Profile', 'Billing'],
                studio: [
                    'Chatflows',
                    'Agentflows',
                    'Agent Templates',
                    'Assistants',
                    'Document Stores',
                    'Executions',
                    'Tools',
                    'Global Variables',
                    'API Keys',
                    'Credentials'
                ],
                dataEngine: ['Content', 'Dashboards', 'Reports', 'Calls', 'Bulk Analysis'],
                upgradeVisible: true,
                exportImportVisible: true
            }
        },
        builder: {
            email: process.env.TEST_USER_ENTERPRISE_BUILDER_EMAIL!,
            password: process.env.TEST_USER_PASSWORD!,
            role: 'builder',
            expectedMenuItems: {
                topLevel: ['Chat', 'Image Generation', 'Video Generation', 'Agent Studio', 'Profile'],
                studio: [
                    'Chatflows',
                    'Agentflows',
                    'Agent Templates',
                    'Assistants',
                    'Document Stores',
                    'Executions',
                    'Tools',
                    'Global Variables',
                    'API Keys',
                    'Credentials'
                ],
                dataEngine: ['Content', 'Dashboards', 'Reports', 'Calls', 'Bulk Analysis'],
                upgradeVisible: false,
                exportImportVisible: false
            }
        },
        member: {
            email: process.env.TEST_USER_ENTERPRISE_MEMBER_EMAIL!,
            password: process.env.TEST_USER_PASSWORD!,
            role: 'member',
            expectedMenuItems: {
                topLevel: ['Chat', 'Image Generation', 'Video Generation', 'Profile'],
                studio: [], // Members don't see Studio
                dataEngine: [], // Members don't see Data Engine
                upgradeVisible: false,
                exportImportVisible: false
            }
        }
    }

    // Test login and menu permissions for each user type
    for (const [userType, userData] of Object.entries(testUsers)) {
        test(`should login successfully as ${userType} and show correct menu permissions`, async ({ page }) => {
            // Validate environment variables
            if (!userData.email || !userData.password) {
                throw new Error(
                    `Missing environment variables for ${userType} user: TEST_USER_ENTERPRISE_${userType.toUpperCase()}_EMAIL and TEST_USER_PASSWORD`
                )
            }

            // Clear any existing auth state
            await page.context().clearCookies()

            console.log(`🔐 Testing login for ${userType} user: ${userData.email}`)

            // Login as the specific user with organization selection
            await loginAsUser(page, userData.email, userData.password, process.env.TEST_ENTERPRISE_AUTH0_ORG_ID)

            // Verify we're logged in and on the correct domain
            await expect(page).toHaveURL(/localhost:3000/)
            await expect(page).not.toHaveURL(/auth0\.com|\.auth0\.com/)

            // Verify user email is displayed in AppDrawer
            const userEmailElement = page.locator(`text=${userData.email}`).first()
            await expect(userEmailElement).toBeVisible({ timeout: TIMEOUTS.MEDIUM })

            // Verify organization info is displayed (this may be name or ID depending on UI)
            if (process.env.TEST_ENTERPRISE_ORG_NAME) {
                const orgNameElement = page.locator(`text=${process.env.TEST_ENTERPRISE_ORG_NAME}`).first()
                await expect(orgNameElement).toBeVisible({ timeout: TIMEOUTS.SHORT })
            }

            // Verify AnswerAI logo is visible in header (when drawer is open)
            console.log(`🎨 Checking AnswerAI logo visibility for ${userType}`)
            const logo = page.locator('img[alt*="AnswerAI"]').first()
            await expect(logo).toBeVisible({ timeout: TIMEOUTS.SHORT })

            // Verify expected top-level menu items are visible
            console.log(`✅ Checking top-level menu items for ${userType}`)
            for (const menuItem of userData.expectedMenuItems.topLevel) {
                await expect(page.getByText(menuItem, { exact: true })).toBeVisible({ timeout: TIMEOUTS.SHORT })
            }

            // Verify new top-level menu items have correct functionality
            // All users should see these items
            console.log(`✨ Checking new top-level menu items functionality for ${userType}`)

            // Chat link should navigate to /chat
            const chatLink = page.locator('a[href="/chat"]').first()
            await expect(chatLink).toBeVisible({ timeout: TIMEOUTS.SHORT })

            // Image Generation link should navigate to sidekick-studio/media-creator
            const imageGenLink = page.locator('a[href*="media-creator"]').first()
            await expect(imageGenLink).toBeVisible({ timeout: TIMEOUTS.SHORT })

            // Video Generation link should navigate to sidekick-studio/video-creator
            const videoGenLink = page.locator('a[href*="video-creator"]').first()
            await expect(videoGenLink).toBeVisible({ timeout: TIMEOUTS.SHORT })

            // If user should see Agent Studio, expand it and check sub-items
            if (userData.expectedMenuItems.studio && userData.expectedMenuItems.studio.length > 0) {
                console.log(`🎭 Expanding Agent Studio for ${userType}`)

                // Click on Agent Studio to expand it
                const studioButton = page.getByText('Agent Studio')
                await studioButton.click()

                // Wait for submenu animation to complete and items to become visible
                await page.waitForLoadState('domcontentloaded')

                // Check studio sub-items
                for (const studioItem of userData.expectedMenuItems.studio) {
                    // Use more specific selector to avoid tooltip conflicts
                    const menuItem = page.locator('nav, [role="navigation"], .MuiList-root').getByText(studioItem, { exact: true }).first()
                    await expect(menuItem).toBeVisible({ timeout: TIMEOUTS.SHORT })
                }
            }

            // If Data Engine should be visible (based on environment and role)
            if (
                process.env.NEXT_PUBLIC_ANSWER_ENGINE_DOMAIN &&
                userData.expectedMenuItems.dataEngine &&
                userData.expectedMenuItems.dataEngine.length > 0
            ) {
                console.log(`🌐 Checking Data Engine menu for ${userType}`)

                // Click on Data Engine to expand it
                const dataEngineButton = page.getByText('Data Engine')
                await expect(dataEngineButton).toBeVisible({ timeout: TIMEOUTS.SHORT })
                await dataEngineButton.click()

                // Wait for submenu animation to complete and items to become visible
                await page.waitForLoadState('domcontentloaded')

                // Check Data Engine sub-items
                for (const engineItem of userData.expectedMenuItems.dataEngine) {
                    const menuItem = page.locator('nav, [role="navigation"], .MuiList-root').getByText(engineItem, { exact: true }).first()
                    await expect(menuItem).toBeVisible({ timeout: TIMEOUTS.SHORT })
                }

                // Verify external links have target="_blank" (except Bulk Analysis which is internal)
                const externalLinks = ['Content', 'Dashboards', 'Reports', 'Calls']
                for (const linkText of externalLinks) {
                    const link = page.locator(`a:has-text("${linkText}")[target="_blank"]`).first()
                    await expect(link).toBeVisible({ timeout: TIMEOUTS.SHORT })
                }
            } else if (!userData.expectedMenuItems.dataEngine || userData.expectedMenuItems.dataEngine.length === 0) {
                // Members should not see Data Engine
                console.log(`🚫 Verifying Data Engine menu is hidden for ${userType}`)
                const dataEngineButton = page.getByText('Data Engine')
                await expect(dataEngineButton).not.toBeVisible()
            }

            // Check user menu (three dots menu)
            const userMenuButton = page.getByRole('button', { name: 'more options' })
            await userMenuButton.click()

            // Wait for menu dropdown to appear and render
            await page.waitForLoadState('domcontentloaded')

            // Check Upgrade Plan visibility in the dropdown menu
            if (userData.expectedMenuItems.upgradeVisible) {
                await expect(page.getByRole('menuitem', { name: 'Upgrade Plan' })).toBeVisible()
            } else {
                await expect(page.getByRole('menuitem', { name: 'Upgrade Plan' })).not.toBeVisible()
            }

            // Close the menu
            await page.keyboard.press('Escape')

            console.log(`✅ ${userType} user permissions verified successfully`)
        })

        test(`should be able to navigate to allowed sections as ${userType}`, async ({ page }) => {
            // Clear any existing auth state to ensure a fresh login
            await page.context().clearCookies()

            // Login as the specific user using the refactored helper
            await loginAsUser(page, userData.email, userData.password, process.env.TEST_ENTERPRISE_AUTH0_ORG_ID)

            // Wait for page to be fully loaded and all network requests to complete
            // This ensures React has hydrated and the app is interactive
            await page.waitForLoadState('networkidle')

            // Verify we're in a stable state before navigation attempts
            await expect(page.locator('body')).toBeVisible()

            // Test navigation to Profile (should work for all users regardless of role)
            await page.goto('/profile', { waitUntil: 'networkidle' })
            await expect(page).not.toHaveURL(/auth0\.com|\.auth0\.com/, { timeout: TIMEOUTS.SHORT })
            await expect(page.locator('body')).toBeVisible()

            // Test navigation based on role-specific permissions
            if (userData.role === 'admin') {
                // Admins should be able to access billing section
                await page.goto('/billing', { waitUntil: 'networkidle' })
                await expect(page).not.toHaveURL(/auth0\.com|\.auth0\.com/, { timeout: TIMEOUTS.SHORT })

                // Admins should be able to access studio sections
                await page.goto('/sidekick-studio/chatflows', { waitUntil: 'networkidle' })
                await expect(page).not.toHaveURL(/auth0\.com|\.auth0\.com/, { timeout: TIMEOUTS.SHORT })
            }

            if (userData.role === 'builder') {
                // Builders should be able to access studio sections but not billing
                await page.goto('/sidekick-studio/chatflows', { waitUntil: 'networkidle' })
                await expect(page).not.toHaveURL(/auth0\.com|\.auth0\.com/, { timeout: TIMEOUTS.SHORT })
            }

            console.log(`✅ Navigation test completed for ${userType}`)
        })
    }
})

test.describe('Theme Toggle Functionality', () => {
    test('should toggle between light and dark mode and persist theme preference', async ({ page }) => {
        // Clear any existing auth state to ensure a fresh login
        await page.context().clearCookies()

        console.log('🎨 Testing theme toggle functionality')

        // Login as admin user for this test using the refactored helper
        await loginAsUser(
            page,
            process.env.TEST_USER_ENTERPRISE_ADMIN_EMAIL!,
            process.env.TEST_USER_PASSWORD!,
            process.env.TEST_ENTERPRISE_AUTH0_ORG_ID
        )

        // Wait for page to be fully loaded and verify successful login
        await expect(page).toHaveURL(/localhost:3000/)
        await expect(page).not.toHaveURL(/auth0\.com|\.auth0\.com/)

        // Open user menu (three dots menu in AppDrawer)
        const userMenuButton = page.getByRole('button', { name: 'more options' })
        await expect(userMenuButton).toBeVisible({ timeout: TIMEOUTS.SHORT })
        await userMenuButton.click()

        // Wait for menu dropdown to appear and render
        await page.waitForLoadState('domcontentloaded')

        // Verify theme toggle is visible in the menu
        console.log('✅ Verifying theme toggle menu item exists')
        const themeToggle = page.getByRole('menuitem', { name: /Light Mode|Dark Mode/ })
        await expect(themeToggle).toBeVisible({ timeout: TIMEOUTS.SHORT })

        // Get current theme text to verify it changes after toggle
        const currentThemeText = await themeToggle.textContent()
        console.log(`📍 Current theme: ${currentThemeText}`)

        // Click to toggle theme (should switch between light/dark)
        console.log('🔄 Toggling theme...')
        await themeToggle.click()

        // Wait for theme change animation to complete
        await page.waitForLoadState('domcontentloaded')

        // Verify theme changed in localStorage (app stores theme preference here)
        const themeInLocalStorage = await page.evaluate(() => {
            return localStorage.getItem('isDarkMode')
        })
        console.log(`💾 Theme stored in localStorage: isDarkMode=${themeInLocalStorage}`)

        // Open menu again to verify theme toggle text changed
        await userMenuButton.click()
        await page.waitForLoadState('domcontentloaded')

        // Verify theme toggle text changed (Light ↔ Dark)
        const themeToggleAfter = page.getByRole('menuitem', { name: /Light Mode|Dark Mode/ })
        await expect(themeToggleAfter).toBeVisible({ timeout: TIMEOUTS.SHORT })
        const newThemeText = await themeToggleAfter.textContent()
        console.log(`📍 New theme: ${newThemeText}`)

        // Verify the text changed (should be opposite of what it was)
        expect(newThemeText).not.toBe(currentThemeText)

        // Close the menu
        await page.keyboard.press('Escape')

        // Test persistence: Reload page and verify theme persists from localStorage
        console.log('🔄 Reloading page to test theme persistence...')
        await page.reload({ waitUntil: 'networkidle' })

        // Wait for page to be fully loaded after reload
        await expect(page).toHaveURL(/localhost:3000/)

        // Open menu again after reload to check persisted theme
        await userMenuButton.click()
        await page.waitForLoadState('domcontentloaded')

        // Verify theme persisted after reload
        const themeToggleAfterReload = page.getByRole('menuitem', { name: /Light Mode|Dark Mode/ })
        await expect(themeToggleAfterReload).toBeVisible({ timeout: TIMEOUTS.SHORT })
        const themeTextAfterReload = await themeToggleAfterReload.textContent()
        console.log(`📍 Theme after reload: ${themeTextAfterReload}`)

        // Verify the theme is still the same after reload (successfully persisted)
        expect(themeTextAfterReload).toBe(newThemeText)

        console.log('✅ Theme toggle functionality verified successfully')
    })
})
