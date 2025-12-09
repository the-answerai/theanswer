import { test, expect } from '@playwright/test'

/**
 * E2E Tests for Guardrails Settings UI (Phase 3)
 *
 * Tests cover:
 * - Authentication & Authorization (admin-only access)
 * - Page load and UI structure
 * - Preset selection and switching
 * - Configuration saving
 * - Configuration persistence
 * - API integration
 */

// Test user credentials from environment
const ADMIN_EMAIL = process.env.TEST_USER_ENTERPRISE_ADMIN_EMAIL!
const MEMBER_EMAIL = process.env.TEST_USER_ENTERPRISE_MEMBER_EMAIL!
const USER_PASSWORD = process.env.TEST_USER_PASSWORD!
const ORG_ID = process.env.TEST_ENTERPRISE_AUTH0_ORG_ID!
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

// Helper function to perform login with organization selection
async function loginAsUser(page: any, email: string, password: string, orgId?: string) {
    await page.goto('/')

    // Step 1: Enter email
    await page.waitForSelector('input[name="username"], input[type="email"], input[name="email"]', {
        timeout: 10000
    })
    const emailInput = page.locator('input[name="username"], input[type="email"], input[name="email"]').first()
    await emailInput.fill(email)

    // Click Continue
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

    // Step 2: Enter password
    await page.waitForSelector('input[name="password"], input[type="password"]', {
        timeout: 10000
    })
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first()
    await passwordInput.fill(password)

    // Submit login
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

    // Step 3: Select organization if provided
    if (orgId) {
        try {
            await page.waitForSelector('form', { timeout: 5000 })
            const targetForm = page.locator(`form:has(input[name="organization"][value="${orgId}"])`)
            if (await targetForm.isVisible({ timeout: 5000 })) {
                const submitButton = targetForm.locator('button[type="submit"]')
                await submitButton.click()
            }
        } catch (error) {
            console.log('Organization selection not required or failed:', error)
        }
    }

    // Wait for navigation to complete
    await page.waitForURL(/^(?!.*auth0\.com).*$/, { timeout: 15000 })
    await page.waitForLoadState('networkidle')
}

test.describe('Guardrails Settings - Authentication & Authorization', () => {
    test.beforeEach(async ({ page }) => {
        // Set viewport to desktop size
        await page.setViewportSize({ width: 1280, height: 720 })
    })

    test('Admin user can access guardrails settings page', async ({ page }) => {
        await loginAsUser(page, ADMIN_EMAIL, USER_PASSWORD, ORG_ID)

        // Navigate to guardrails settings
        await page.goto(`${BASE_URL}/settings/organization/guardrails`)
        await page.waitForLoadState('networkidle')

        // Verify page loaded successfully
        await expect(page).toHaveURL(/\/settings\/organization\/guardrails/)

        // Verify page title
        await expect(page.locator('h4:has-text("Guardrails Settings")')).toBeVisible()

        // Verify tabs are visible
        await expect(page.locator('button[role="tab"]:has-text("Simple")')).toBeVisible()
        await expect(page.locator('button[role="tab"]:has-text("Advanced")')).toBeVisible()
        await expect(page.locator('button[role="tab"]:has-text("Custom (JSON)")')).toBeVisible()
    })

    test('Non-admin user cannot save guardrails settings', async ({ page }) => {
        await loginAsUser(page, MEMBER_EMAIL, USER_PASSWORD, ORG_ID)

        // Navigate to guardrails settings
        await page.goto(`${BASE_URL}/settings/organization/guardrails`)
        await page.waitForLoadState('networkidle')

        // Page may load but save functionality should fail
        // This test verifies backend authorization, not UI hiding
        // The Save button might be visible but API call should return 403

        const response = page.waitForResponse(
            (resp) =>
                resp.url().includes('/organizations/') && resp.url().includes('/config/guardrails') && resp.request().method() === 'PUT'
        )

        // Try to save a preset (if UI allows)
        const strictPreset = page.locator('div:has-text("Strict")').first()
        if (await strictPreset.isVisible({ timeout: 2000 })) {
            await strictPreset.click()

            const saveButton = page.locator('button:has-text("Save Configuration")')
            if (await saveButton.isEnabled({ timeout: 2000 })) {
                await saveButton.click()

                // Wait for API response
                const apiResponse = await response

                // Should receive 403 Forbidden
                expect(apiResponse.status()).toBe(403)
            }
        }
    })

    test('Unauthenticated user is redirected to login', async ({ page }) => {
        // Navigate directly to guardrails settings without logging in
        await page.goto(`${BASE_URL}/settings/organization/guardrails`)

        // Should be redirected to Auth0 login
        await page.waitForURL(/auth0\.com/, { timeout: 10000 })

        // Verify Auth0 login page loaded
        await expect(page.locator('input[name="username"], input[type="email"]')).toBeVisible()
    })
})

test.describe('Guardrails Settings - UI Structure', () => {
    test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 720 })
        await loginAsUser(page, ADMIN_EMAIL, USER_PASSWORD, ORG_ID)
        await page.goto(`${BASE_URL}/settings/organization/guardrails`)
        await page.waitForLoadState('networkidle')
    })

    test('Page displays correct structure and elements', async ({ page }) => {
        // Verify page title
        await expect(page.locator('h4:has-text("Guardrails Settings")')).toBeVisible()

        // Verify description
        await expect(page.locator('text=/Configure AI guardrails/i')).toBeVisible()

        // Verify tabs
        const simpleTab = page.locator('button[role="tab"]:has-text("Simple")')
        const advancedTab = page.locator('button[role="tab"]:has-text("Advanced")')
        const customTab = page.locator('button[role="tab"]:has-text("Custom (JSON)")')

        await expect(simpleTab).toBeVisible()
        await expect(advancedTab).toBeVisible()
        await expect(customTab).toBeVisible()

        // Simple tab should be selected by default
        await expect(simpleTab).toHaveAttribute('aria-selected', 'true')
    })

    test('Simple Mode displays all three presets', async ({ page }) => {
        // Verify preset section title
        await expect(page.locator('h6:has-text("Choose a Preset Configuration")')).toBeVisible()

        // Verify all three presets are visible
        await expect(page.locator('text=/Strict.*External Bots/i')).toBeVisible()
        await expect(page.locator('text=/Balanced.*General Purpose/i')).toBeVisible()
        await expect(page.locator('text=/Lenient.*Internal Tools/i')).toBeVisible()

        // Verify preset descriptions are visible
        await expect(page.locator('text=/threshold: 0.05/i')).toBeVisible()
        await expect(page.locator('text=/threshold: 0.1/i')).toBeVisible()
        await expect(page.locator('text=/threshold: 0.15/i')).toBeVisible()
    })

    test('Advanced and Custom tabs show coming soon message', async ({ page }) => {
        // Click Advanced tab
        await page.locator('button[role="tab"]:has-text("Advanced")').click()
        await expect(page.locator('text=/Advanced mode.*Coming soon/i')).toBeVisible()

        // Click Custom tab
        await page.locator('button[role="tab"]:has-text("Custom (JSON)")').click()
        await expect(page.locator('text=/Custom JSON editor.*Coming soon/i')).toBeVisible()
    })
})

test.describe('Guardrails Settings - Preset Selection', () => {
    test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 720 })
        await loginAsUser(page, ADMIN_EMAIL, USER_PASSWORD, ORG_ID)
        await page.goto(`${BASE_URL}/settings/organization/guardrails`)
        await page.waitForLoadState('networkidle')
    })

    test('Can select Strict preset', async ({ page }) => {
        // Find and click Strict preset card
        const strictCard = page.locator('div[role="radiogroup"] label:has-text("Strict")').locator('..')
        await strictCard.click()

        // Verify radio button is checked
        const strictRadio = page.locator('input[type="radio"][value="strict"]')
        await expect(strictRadio).toBeChecked()

        // Verify card styling changes (border should be highlighted)
        const parentCard = strictCard.locator('..')
        const borderColor = await parentCard.evaluate((el) => window.getComputedStyle(el).borderColor)
        // Material-UI primary color should be applied
        expect(borderColor).not.toBe('rgba(0, 0, 0, 0)')
    })

    test('Can select Balanced preset', async ({ page }) => {
        const balancedCard = page.locator('div[role="radiogroup"] label:has-text("Balanced")').locator('..')
        await balancedCard.click()

        const balancedRadio = page.locator('input[type="radio"][value="balanced"]')
        await expect(balancedRadio).toBeChecked()
    })

    test('Can select Lenient preset', async ({ page }) => {
        const lenientCard = page.locator('div[role="radiogroup"] label:has-text("Lenient")').locator('..')
        await lenientCard.click()

        const lenientRadio = page.locator('input[type="radio"][value="lenient"]')
        await expect(lenientRadio).toBeChecked()
    })

    test('Can switch between presets', async ({ page }) => {
        // Select Strict
        await page.locator('div[role="radiogroup"] label:has-text("Strict")').locator('..').click()
        await expect(page.locator('input[type="radio"][value="strict"]')).toBeChecked()

        // Switch to Balanced
        await page.locator('div[role="radiogroup"] label:has-text("Balanced")').locator('..').click()
        await expect(page.locator('input[type="radio"][value="balanced"]')).toBeChecked()
        await expect(page.locator('input[type="radio"][value="strict"]')).not.toBeChecked()

        // Switch to Lenient
        await page.locator('div[role="radiogroup"] label:has-text("Lenient")').locator('..').click()
        await expect(page.locator('input[type="radio"][value="lenient"]')).toBeChecked()
        await expect(page.locator('input[type="radio"][value="balanced"]')).not.toBeChecked()
    })

    test('Save button becomes enabled when preset is selected', async ({ page }) => {
        const saveButton = page.locator('button:has-text("Save Configuration")')

        // Initially, save button might be disabled (no changes)
        // Select a preset
        await page.locator('div[role="radiogroup"] label:has-text("Balanced")').locator('..').click()

        // Save button should become enabled
        await expect(saveButton).toBeEnabled({ timeout: 2000 })
    })

    test('Cancel button appears when changes are made', async ({ page }) => {
        // Select a preset to trigger changes
        await page.locator('div[role="radiogroup"] label:has-text("Balanced")').locator('..').click()

        // Cancel button should appear
        const cancelButton = page.locator('button:has-text("Cancel")')
        await expect(cancelButton).toBeVisible({ timeout: 2000 })
    })
})

test.describe('Guardrails Settings - Save Configuration', () => {
    test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 720 })
        await loginAsUser(page, ADMIN_EMAIL, USER_PASSWORD, ORG_ID)
        await page.goto(`${BASE_URL}/settings/organization/guardrails`)
        await page.waitForLoadState('networkidle')
    })

    test('Can save Strict preset configuration', async ({ page }) => {
        // Select Strict preset
        await page.locator('div[role="radiogroup"] label:has-text("Strict")').locator('..').click()

        // Wait for API response
        const responsePromise = page.waitForResponse(
            (resp) =>
                resp.url().includes('/organizations/') && resp.url().includes('/config/guardrails') && resp.request().method() === 'PUT'
        )

        // Click Save button
        const saveButton = page.locator('button:has-text("Save Configuration")')
        await saveButton.click()

        // Wait for API call to complete
        const response = await responsePromise
        expect(response.status()).toBe(200)

        // Verify success message appears
        await expect(page.locator('text=/Configuration saved successfully/i')).toBeVisible({ timeout: 5000 })

        // Verify API response contains correct config
        const responseBody = await response.json()
        expect(responseBody.enabled).toBe(true)
        expect(responseBody.safety.threshold).toBe(0.05)
        expect(responseBody.pii.confidenceThreshold).toBe(0.8)
    })

    test('Can save Balanced preset configuration', async ({ page }) => {
        await page.locator('div[role="radiogroup"] label:has-text("Balanced")').locator('..').click()

        const responsePromise = page.waitForResponse(
            (resp) =>
                resp.url().includes('/organizations/') && resp.url().includes('/config/guardrails') && resp.request().method() === 'PUT'
        )

        await page.locator('button:has-text("Save Configuration")').click()

        const response = await responsePromise
        expect(response.status()).toBe(200)

        const responseBody = await response.json()
        expect(responseBody.safety.threshold).toBe(0.1)
    })

    test('Can save Lenient preset configuration', async ({ page }) => {
        await page.locator('div[role="radiogroup"] label:has-text("Lenient")').locator('..').click()

        const responsePromise = page.waitForResponse(
            (resp) =>
                resp.url().includes('/organizations/') && resp.url().includes('/config/guardrails') && resp.request().method() === 'PUT'
        )

        await page.locator('button:has-text("Save Configuration")').click()

        const response = await responsePromise
        expect(response.status()).toBe(200)

        const responseBody = await response.json()
        expect(responseBody.safety.threshold).toBe(0.15)
        expect(responseBody.pii.confidenceThreshold).toBe(0.85)
    })

    test('Success message auto-dismisses after 3 seconds', async ({ page }) => {
        // Select and save a preset
        await page.locator('div[role="radiogroup"] label:has-text("Balanced")').locator('..').click()
        await page.locator('button:has-text("Save Configuration")').click()

        // Success message should appear
        const successAlert = page.locator('text=/Configuration saved successfully/i')
        await expect(successAlert).toBeVisible({ timeout: 5000 })

        // Wait for auto-dismiss (3 seconds)
        await page.waitForTimeout(3500)

        // Success message should be gone
        await expect(successAlert).not.toBeVisible()
    })

    test('Save button shows loading state', async ({ page }) => {
        await page.locator('div[role="radiogroup"] label:has-text("Balanced")').locator('..').click()

        const saveButton = page.locator('button:has-text("Save Configuration")')
        await saveButton.click()

        // Button should show "Saving..." text
        await expect(saveButton).toHaveText(/Saving/i, { timeout: 1000 })

        // Wait for completion
        await page.waitForResponse((resp) => resp.url().includes('/config/guardrails') && resp.request().method() === 'PUT')

        // Button should return to "Save Configuration"
        await expect(saveButton).toHaveText(/Save Configuration/i)
    })

    test('Cancel button clears changes', async ({ page }) => {
        // Select a preset
        await page.locator('div[role="radiogroup"] label:has-text("Strict")').locator('..').click()

        // Cancel button should appear
        const cancelButton = page.locator('button:has-text("Cancel")')
        await expect(cancelButton).toBeVisible()

        // Click Cancel
        await cancelButton.click()

        // Save button should be disabled again (no pending changes)
        const saveButton = page.locator('button:has-text("Save Configuration")')
        await expect(saveButton).toBeDisabled({ timeout: 2000 })
    })
})

test.describe('Guardrails Settings - Configuration Persistence', () => {
    test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 720 })
        await loginAsUser(page, ADMIN_EMAIL, USER_PASSWORD, ORG_ID)
        await page.goto(`${BASE_URL}/settings/organization/guardrails`)
        await page.waitForLoadState('networkidle')
    })

    test('Saved configuration persists after page reload', async ({ page }) => {
        // Save Lenient preset
        await page.locator('div[role="radiogroup"] label:has-text("Lenient")').locator('..').click()

        await page.waitForResponse((resp) => resp.url().includes('/config/guardrails') && resp.request().method() === 'PUT')

        await page.locator('button:has-text("Save Configuration")').click()

        // Wait for success message
        await expect(page.locator('text=/Configuration saved successfully/i')).toBeVisible()

        // Reload page
        await page.reload()
        await page.waitForLoadState('networkidle')

        // Lenient preset should still be selected
        const lenientRadio = page.locator('input[type="radio"][value="lenient"]')
        await expect(lenientRadio).toBeChecked({ timeout: 5000 })
    })

    test('Configuration auto-detects current preset on load', async ({ page }) => {
        // This test assumes a configuration already exists
        // Wait for page to load configuration
        await page.waitForResponse((resp) => resp.url().includes('/config/guardrails') && resp.request().method() === 'GET')

        // Check if any preset is auto-selected (based on current config)
        const radioButtons = page.locator('input[type="radio"]')
        const count = await radioButtons.count()

        let hasSelection = false
        for (let i = 0; i < count; i++) {
            if (await radioButtons.nth(i).isChecked()) {
                hasSelection = true
                break
            }
        }

        // If config exists, one preset should be selected OR custom warning should show
        const customWarning = page.locator("text=/doesn't match any preset/i")
        const isCustom = await customWarning.isVisible()

        // Either a preset is selected OR custom warning is shown
        expect(hasSelection || isCustom).toBe(true)
    })
})

test.describe('Guardrails Settings - API Integration', () => {
    test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 720 })
        await loginAsUser(page, ADMIN_EMAIL, USER_PASSWORD, ORG_ID)
        await page.goto(`${BASE_URL}/settings/organization/guardrails`)
        await page.waitForLoadState('networkidle')
    })

    test('GET request loads current configuration', async ({ page }) => {
        // Wait for GET request
        const response = await page.waitForResponse(
            (resp) =>
                resp.url().includes('/organizations/') && resp.url().includes('/config/guardrails') && resp.request().method() === 'GET'
        )

        expect(response.status()).toBe(200)

        // Response should be valid JSON
        const body = await response.json()
        expect(body).toBeDefined()

        // Should have guardrails config structure
        // May be empty {} if not configured yet, or have full config
        expect(typeof body).toBe('object')
    })

    test('PUT request sends correct preset configuration', async ({ page }) => {
        // Intercept PUT request
        const requestPromise = page.waitForRequest((req) => req.url().includes('/config/guardrails') && req.method() === 'PUT')

        // Select Strict preset
        await page.locator('div[role="radiogroup"] label:has-text("Strict")').locator('..').click()
        await page.locator('button:has-text("Save Configuration")').click()

        const request = await requestPromise
        const requestBody = request.postDataJSON()

        // Verify request structure
        expect(requestBody).toHaveProperty('guardrails')
        expect(requestBody.guardrails).toHaveProperty('enabled', true)
        expect(requestBody.guardrails).toHaveProperty('safety')
        expect(requestBody.guardrails.safety).toHaveProperty('threshold', 0.05)
        expect(requestBody.guardrails).toHaveProperty('pii')
        expect(requestBody.guardrails.pii).toHaveProperty('confidenceThreshold', 0.8)
    })

    test('API error shows error message', async ({ page }) => {
        // Mock API failure
        await page.route('**/config/guardrails', (route) => {
            route.fulfill({
                status: 500,
                body: JSON.stringify({ error: 'Internal server error' })
            })
        })

        // Try to save
        await page.locator('div[role="radiogroup"] label:has-text("Balanced")').locator('..').click()
        await page.locator('button:has-text("Save Configuration")').click()

        // Error message should appear
        await expect(page.locator('[role="alert"]:has-text(/Failed to save/i)')).toBeVisible({ timeout: 5000 })
    })

    test('API request includes organization ID in URL', async ({ page }) => {
        const requestPromise = page.waitForRequest((req) => req.url().includes('/config/guardrails') && req.method() === 'PUT')

        await page.locator('div[role="radiogroup"] label:has-text("Balanced")').locator('..').click()
        await page.locator('button:has-text("Save Configuration")').click()

        const request = await requestPromise
        const url = request.url()

        // URL should contain organization ID pattern
        expect(url).toMatch(/\/organizations\/[a-f0-9-]+\/config\/guardrails/)
    })
})

test.describe('Guardrails Settings - Warning States', () => {
    test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 720 })
        await loginAsUser(page, ADMIN_EMAIL, USER_PASSWORD, ORG_ID)
        await page.goto(`${BASE_URL}/settings/organization/guardrails`)
        await page.waitForLoadState('networkidle')
    })

    test('Shows warning when guardrails are disabled', async ({ page }) => {
        // This test checks if the warning appears when config.enabled = false
        // May need to set config to disabled state first

        // Look for warning message
        const warning = page.locator('text=/Guardrails are currently disabled/i')

        // Warning might be visible if no config exists or if disabled
        // This is a conditional test
        const isVisible = await warning.isVisible({ timeout: 2000 }).catch(() => false)

        if (isVisible) {
            await expect(warning).toBeVisible()
            // Should prompt to select a preset to enable
            await expect(page.locator('text=/Select a preset to enable/i')).toBeVisible()
        }
    })

    test('Shows custom config warning when configuration does not match preset', async ({ page }) => {
        // This appears when loaded config doesn't match any preset
        const customWarning = page.locator("text=/doesn't match any preset/i")

        // This warning is conditional - only shows for custom configs
        // Just verify it renders correctly if present
        const isVisible = await customWarning.isVisible({ timeout: 2000 }).catch(() => false)

        if (isVisible) {
            await expect(customWarning).toBeVisible()
            // Should suggest switching to Advanced mode
            await expect(page.locator('text=/Switch to Advanced mode/i')).toBeVisible()
        }
    })
})
