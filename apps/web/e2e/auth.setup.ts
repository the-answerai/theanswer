import { test as setup, expect } from '@playwright/test'

const authFile = './e2e/.auth/user.json'

setup('authenticate', async ({ page }) => {
    // Validate environment variables
    if (!process.env.TEST_USER_EMAIL || !process.env.TEST_USER_PASSWORD) {
        throw new Error('TEST_USER_EMAIL and TEST_USER_PASSWORD must be set in .env.test file')
    }

    console.log('🔐 Starting authentication setup...')

    // Go to the homepage - this should redirect to Auth0 login if not authenticated
    await page.goto('/')

    // Wait for either Auth0 login page or already authenticated content
    try {
        // Check if we're already on an authenticated page
        await page.waitForSelector('body', { timeout: 5000 })
        const bodyText = await page.textContent('body')

        if (bodyText?.includes('Dashboard') || bodyText?.includes('Chat') || bodyText?.includes('Welcome')) {
            console.log('ℹ️  Already authenticated, skipping login')
            await page.context().storageState({ path: authFile })
            return
        }
    } catch (error) {
        // Continue with login process
    }

    console.log('🌐 Waiting for Auth0 login page...')

    // Wait for Auth0 login page to load - be flexible with selectors
    await page.waitForSelector(
        [
            'input[name="username"]',
            'input[type="email"]',
            'input[name="email"]',
            'input[placeholder*="email" i]',
            'input[placeholder*="username" i]'
        ].join(', '),
        { timeout: 15000 }
    )

    // Step 1: Fill email and continue
    console.log('📧 Filling email...')
    const emailInput = page
        .locator(
            [
                'input[name="username"]',
                'input[type="email"]',
                'input[name="email"]',
                'input[placeholder*="email" i]',
                'input[placeholder*="username" i]'
            ].join(', ')
        )
        .first()
    await emailInput.fill(process.env.TEST_USER_EMAIL!)

    // Click Continue/Submit to proceed to password step
    console.log('⏭️  Proceeding to password step...')
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

    // Step 2: Wait for password input page and fill password
    console.log('🔑 Waiting for password page and filling password...')
    await page.waitForSelector(['input[name="password"]', 'input[type="password"]', 'input[placeholder*="password" i]'].join(', '), {
        timeout: 10000
    })

    const passwordInput = page
        .locator(['input[name="password"]', 'input[type="password"]', 'input[placeholder*="password" i]'].join(', '))
        .first()
    await passwordInput.fill(process.env.TEST_USER_PASSWORD!)

    // Submit the login form
    console.log('🚀 Submitting login form...')
    const submitButton = page
        .locator(
            [
                'button[type="submit"][data-action-button-primary="true"]',
                'button[type="submit"]:not([data-provider])',
                'button[type="submit"]',
                'button:has-text("Log In")',
                'button:has-text("Sign In")',
                'button:has-text("Continue")',
                'input[type="submit"]'
            ].join(', ')
        )
        .first()
    await submitButton.click()

    // Step 3: Handle potential organization selection
    console.log('🏢 Checking for organization selection...')
    try {
        const orgSelector = page.locator(
            [
                'button:has-text("local")',
                'button:has-text("dev")',
                'button:has-text("development")',
                '[data-testid="organization-selector"]',
                '.organization-item'
            ].join(', ')
        )

        if (await orgSelector.first().isVisible({ timeout: 5000 })) {
            console.log('🎯 Organization selection detected, selecting local dev org')
            await orgSelector.first().click()
        }
    } catch (error) {
        console.log('ℹ️  No organization selection step detected, proceeding')
    }

    // Wait for redirect back to the application after successful login
    console.log('⏳ Waiting for redirect back to application...')
    await page.waitForURL(/localhost:3000/, { timeout: 20000 })

    // Verify we're actually logged in by checking for user-specific content
    console.log('✅ Verifying successful authentication...')
    await expect(page.locator('body')).toContainText(['Dashboard', 'Welcome', 'Chat', 'Chatflows', 'Settings', 'Profile'], {
        timeout: 15000
    })

    // Ensure we're not on Auth0 anymore
    await expect(page).not.toHaveURL(/auth0\.com|\.auth0\.com/)

    // Save authentication state
    await page.context().storageState({ path: authFile })

    console.log('✅ Authentication setup completed successfully')
})
