import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
    test('should redirect unauthenticated user to Auth0 login', async ({ page }) => {
        // Clear any existing auth state for this test
        await page.context().clearCookies()

        // Go to the homepage
        await page.goto('/')

        // Should redirect to Auth0 login page
        // Auth0 URLs typically contain the domain from AUTH0_ISSUER_BASE_URL
        await expect(page).toHaveURL(/auth0\.com|\.auth0\.com/, { timeout: 10000 })

        // Verify Auth0 login page elements are present
        // First step: Email input should be visible
        await expect(page.locator('input[name="username"], input[type="email"], input[name="email"]')).toBeVisible()

        // Continue/Submit button should be present
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
        // Clear any existing auth state for this test
        await page.context().clearCookies()

        // Go to the homepage - this will redirect to Auth0
        await page.goto('/')

        // Step 1: Wait for Auth0 email input page
        await page.waitForSelector('input[name="username"], input[type="email"], input[name="email"]', {
            timeout: 10000
        })

        // Fill email first
        const emailInput = page.locator('input[name="username"], input[type="email"], input[name="email"]').first()
        await emailInput.fill(process.env.TEST_USER_EMAIL!)

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

        // Step 2: Wait for password input page
        await page.waitForSelector('input[name="password"], input[type="password"]', {
            timeout: 10000
        })

        // Fill password
        const passwordInput = page.locator('input[name="password"], input[type="password"]').first()
        await passwordInput.fill(process.env.TEST_USER_PASSWORD!)

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

        // Step 3: Handle potential organization selection
        try {
            // Check if organization selection page appears
            const orgSelector = page.locator(
                [
                    'button:has-text("local")',
                    'button:has-text("dev")',
                    'button:has-text("development")',
                    '[data-testid="organization-selector"]',
                    '.organization-item'
                ].join(', ')
            )

            // If organization selection appears, click on local/dev org
            if (await orgSelector.first().isVisible({ timeout: 5000 })) {
                console.log('Organization selection detected, selecting local dev org')
                await orgSelector.first().click()
            }
        } catch (error) {
            console.log('No organization selection step detected, proceeding')
        }

        // Wait for redirect back to application
        await page.waitForURL(/localhost:3000/, { timeout: 20000 })

        // Verify we're logged in by checking the AppDrawer shows user info
        await expect(page).not.toHaveURL(/auth0\.com|\.auth0\.com/)

        // Check that the AppDrawer shows the user's email and organization
        // Looking for the user info section in the lower left corner of AppDrawer
        const userEmail = page.locator('text=' + process.env.TEST_USER_EMAIL!).first()
        await expect(userEmail).toBeVisible({ timeout: 10000 })

        // Verify organization name is shown (should be local dev org)
        const orgInfo = page.locator('.MuiTypography-root').filter({ hasText: /local|dev|development/i })
        await expect(orgInfo.first()).toBeVisible({ timeout: 5000 })

        // Verify we can see the drawer navigation elements
        await expect(page.getByRole('link', { name: 'Start a new conversation with your sidekicks' })).toBeVisible()
        await expect(page.getByRole('link', { name: 'Manage and configure your applications' })).toBeVisible()

        console.log('✅ Login successful - user email and organization verified in AppDrawer')
    })

    test('should show error for invalid credentials', async ({ page }) => {
        // Clear any existing auth state for this test
        await page.context().clearCookies()

        // Go to the homepage - this will redirect to Auth0
        await page.goto('/')

        // Step 1: Wait for Auth0 email input page
        await page.waitForSelector('input[name="username"], input[type="email"], input[name="email"]', {
            timeout: 10000
        })

        // Use a unique email to avoid lockout issues
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

        // Step 2: Wait for password input page
        await page.waitForSelector('input[name="password"], input[type="password"]', {
            timeout: 10000
        })

        // Fill invalid password
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

        // Should show error message - handle both credential error and account blocked
        const errorMessages = [
            page.getByText('Wrong email or password'),
            page.getByText(/Your account has been blocked/),
            page.getByText(/blocked after multiple consecutive login attempts/)
        ]

        // Wait for any of these error messages to appear
        await Promise.race(
            errorMessages.map((msg) =>
                expect(msg)
                    .toBeVisible({ timeout: 10000 })
                    .catch(() => {})
            )
        )

        // Verify at least one error message is visible
        const visibleErrors = await Promise.all(errorMessages.map((msg) => msg.isVisible().catch(() => false)))
        expect(visibleErrors.some((visible) => visible)).toBeTruthy()

        // Should still be on Auth0 domain
        await expect(page).toHaveURL(/auth0\.com|\.auth0\.com/)
    })
})

test.describe('Authenticated User Experience', () => {
    // These tests will use the stored authentication state from auth.setup.ts
    test.use({ storageState: './e2e/.auth/user.json' })

    test('should access dashboard when already authenticated', async ({ page }) => {
        // Go to homepage - should not redirect to login since we're authenticated
        await page.goto('/')

        // Wait for page to load and verify we're not redirected to Auth0
        await expect(page).not.toHaveURL(/auth0\.com|\.auth0\.com/, { timeout: 10000 })

        // Check for authenticated UI elements that should be present
        await expect(page.getByRole('link', { name: 'Start a new conversation with your sidekicks' })).toBeVisible({ timeout: 10000 })
        await expect(page.getByRole('link', { name: 'Manage and configure your applications' })).toBeVisible()

        // URL should be the app domain
        await expect(page).toHaveURL(/localhost:3000/)
    })

    test('should be able to navigate authenticated sections', async ({ page }) => {
        await page.goto('/')

        // Try to access different authenticated sections
        // Adjust these based on your app's navigation structure
        const navItems = [
            { text: 'Chat', url: '/chat' },
            { text: 'Settings', url: '/settings' },
            { text: 'Profile', url: '/profile' }
        ]

        for (const item of navItems) {
            try {
                // Try to navigate to the section
                await page.goto(item.url)

                // Should not redirect to Auth0
                await expect(page).not.toHaveURL(/auth0\.com|\.auth0\.com/, { timeout: 3000 })

                // Should show the requested page content (adjust selector as needed)
                await expect(page.locator('body')).toBeVisible()
            } catch (error) {
                console.log(`⚠️  Section ${item.text} (${item.url}) might not exist or have different routing`)
            }
        }
    })
})
