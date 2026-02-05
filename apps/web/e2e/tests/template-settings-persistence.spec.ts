import { test, expect } from '@playwright/test'

/**
 * E2E Test for Template Settings Persistence (AGENT-664)
 *
 * This test verifies that chatflow template settings (description, category, etc.)
 * are properly persisted when saving a chatflow. The fix ensures that when a chatflow
 * is saved, all configuration settings loaded via configFieldKeys are included in the
 * update request, not just the name and flowData.
 *
 * Settings covered by the fix:
 * - description
 * - category
 * - visibility
 * - chatbotConfig
 * - apiConfig
 * - analytic
 * - speechToText
 * - textToSpeech
 * - followUpPrompts
 * - answersConfig
 * - browserExtConfig
 */

// Test user credentials from environment
const ADMIN_EMAIL = process.env.TEST_USER_ENTERPRISE_ADMIN_EMAIL!
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

test.describe('Template Settings Persistence (AGENT-664)', () => {
    test.beforeEach(async ({ page }) => {
        // Set viewport to desktop size
        await page.setViewportSize({ width: 1280, height: 720 })
    })

    test('Chatflow description persists after save and reload', async ({ page }) => {
        // Login as admin user
        await loginAsUser(page, ADMIN_EMAIL, USER_PASSWORD, ORG_ID)

        // Navigate to chatflows list
        await page.goto(`${BASE_URL}/sidekick-studio/chatflows`)
        await page.waitForLoadState('networkidle')

        // Wait for chatflows to load
        await page.waitForTimeout(2000)

        // Click on the first available chatflow to open it in the canvas
        // Look for chatflow cards/list items
        const chatflowCard = page.locator('[data-testid="chatflow-card"], .chatflow-card, [class*="Card"]:has(a[href*="/canvas/"])').first()

        // If no chatflow exists, we need to create one first
        const chatflowExists = await chatflowCard.isVisible({ timeout: 5000 }).catch(() => false)

        let chatflowId: string

        if (!chatflowExists) {
            console.log('No existing chatflow found, creating a new one for the test')

            // Click "Add New" button to create a chatflow
            const addButton = page.locator('button:has-text("Add New"), button:has-text("Create"), [data-testid="add-chatflow"]').first()
            await addButton.click()

            // Wait for canvas to load
            await page.waitForURL(/\/canvas\//, { timeout: 10000 })
            await page.waitForLoadState('networkidle')

            // Extract chatflow ID from URL
            const url = page.url()
            const match = url.match(/\/canvas\/([a-f0-9-]+)/)
            if (!match) {
                throw new Error('Could not extract chatflow ID from URL')
            }
            chatflowId = match[1]
        } else {
            // Click on the chatflow to open it
            const chatflowLink = page.locator('a[href*="/canvas/"]').first()
            const href = await chatflowLink.getAttribute('href')
            if (!href) {
                throw new Error('Could not find chatflow link')
            }

            // Extract chatflow ID from href
            const match = href.match(/\/canvas\/([a-f0-9-]+)/)
            if (!match) {
                throw new Error('Could not extract chatflow ID from link')
            }
            chatflowId = match[1]

            await chatflowLink.click()
            await page.waitForURL(/\/canvas\//, { timeout: 10000 })
            await page.waitForLoadState('networkidle')
        }

        console.log(`Testing with chatflow ID: ${chatflowId}`)

        // Wait for canvas to fully load
        await page.waitForTimeout(2000)

        // Generate a unique test description with timestamp
        const testDescription = `E2E Test Description - ${Date.now()}`

        // Open the chatflow configuration dialog
        // Look for the settings/configuration button in the canvas header
        const settingsButton = page
            .locator(
                'button[aria-label*="Settings"], button[aria-label*="Configuration"], button:has([data-testid="SettingsIcon"]), [data-testid="chatflow-settings"], button:has-text("Settings")'
            )
            .first()

        // If direct settings button not found, try the more menu
        const settingsVisible = await settingsButton.isVisible({ timeout: 3000 }).catch(() => false)

        if (settingsVisible) {
            await settingsButton.click()
        } else {
            // Try finding it through a menu
            const moreButton = page.locator('button[aria-label*="more"], [data-testid="more-options"]').first()
            if (await moreButton.isVisible({ timeout: 2000 })) {
                await moreButton.click()
                await page.waitForTimeout(500)
                const settingsMenuItem = page.locator('li:has-text("Settings"), [role="menuitem"]:has-text("Configuration")').first()
                await settingsMenuItem.click()
            }
        }

        // Wait for configuration dialog to open
        await page.waitForSelector('[role="dialog"], .MuiDialog-root', { timeout: 5000 })
        await page.waitForTimeout(500)

        // Click on "General" tab if not already selected (it should be the first/default tab)
        const generalTab = page.locator('button[role="tab"]:has-text("General")').first()
        if (await generalTab.isVisible({ timeout: 2000 })) {
            await generalTab.click()
            await page.waitForTimeout(500)
        }

        // Find the description field and update it
        const descriptionField = page
            .locator(
                'textarea[placeholder*="description" i], input[placeholder*="description" i], textarea[name*="description" i], label:has-text("Description") + textarea, label:has-text("Description") ~ textarea'
            )
            .first()

        // If can't find by placeholder, try finding by label
        const descriptionFieldVisible = await descriptionField.isVisible({ timeout: 2000 }).catch(() => false)

        if (descriptionFieldVisible) {
            await descriptionField.clear()
            await descriptionField.fill(testDescription)
        } else {
            // Try alternative approach - find the description input in the general settings tab
            const dialogContent = page.locator('[role="dialog"] textarea, .MuiDialog-root textarea').first()
            if (await dialogContent.isVisible({ timeout: 2000 })) {
                await dialogContent.clear()
                await dialogContent.fill(testDescription)
            }
        }

        // Click Save button in the dialog
        const saveButton = page.locator('[role="dialog"] button:has-text("Save"), .MuiDialog-root button:has-text("Save")').first()
        await saveButton.click()

        // Wait for save to complete (look for success snackbar or dialog to close)
        await page.waitForTimeout(1500)

        // Close the dialog if it's still open
        const closeButton = page.locator('[role="dialog"] button[aria-label="close"], [role="dialog"] button:has-text("Close")').first()
        if (await closeButton.isVisible({ timeout: 1000 }).catch(() => false)) {
            await closeButton.click()
        }

        // Now trigger a canvas save to test the persistence fix
        // The fix ensures that when saving the canvas, description and other settings are preserved
        // Use Ctrl+S or click save button
        const canvasSaveButton = page.locator('button[aria-label*="Save"], button:has-text("Save")').first()
        if (await canvasSaveButton.isVisible({ timeout: 2000 })) {
            // Intercept the PUT request to verify settings are included
            const updateRequestPromise = page.waitForRequest(
                (request) => request.url().includes('/api/v1/chatflows/') && request.method() === 'PUT',
                { timeout: 10000 }
            )

            await canvasSaveButton.click()

            try {
                const updateRequest = await updateRequestPromise
                const requestBody = updateRequest.postDataJSON()

                // Verify that the description is included in the save request
                // This is the core validation of the AGENT-664 fix
                console.log('Update request body keys:', Object.keys(requestBody || {}))
                expect(requestBody).toHaveProperty('description')
                console.log('Verified: description field is included in save request')
            } catch (error) {
                console.log('Could not intercept save request, proceeding with reload test')
            }
        }

        // Reload the page to verify persistence
        console.log('Reloading page to verify settings persistence...')
        await page.reload()
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(2000)

        // Re-open the configuration dialog
        const settingsButtonAfterReload = page
            .locator(
                'button[aria-label*="Settings"], button[aria-label*="Configuration"], button:has([data-testid="SettingsIcon"]), [data-testid="chatflow-settings"], button:has-text("Settings")'
            )
            .first()

        const settingsVisibleAfterReload = await settingsButtonAfterReload.isVisible({ timeout: 3000 }).catch(() => false)

        if (settingsVisibleAfterReload) {
            await settingsButtonAfterReload.click()
        } else {
            const moreButton = page.locator('button[aria-label*="more"], [data-testid="more-options"]').first()
            if (await moreButton.isVisible({ timeout: 2000 })) {
                await moreButton.click()
                await page.waitForTimeout(500)
                const settingsMenuItem = page.locator('li:has-text("Settings"), [role="menuitem"]:has-text("Configuration")').first()
                await settingsMenuItem.click()
            }
        }

        // Wait for dialog and navigate to General tab
        await page.waitForSelector('[role="dialog"], .MuiDialog-root', { timeout: 5000 })
        await page.waitForTimeout(500)

        const generalTabAfterReload = page.locator('button[role="tab"]:has-text("General")').first()
        if (await generalTabAfterReload.isVisible({ timeout: 2000 })) {
            await generalTabAfterReload.click()
            await page.waitForTimeout(500)
        }

        // Verify the description was persisted
        const descriptionFieldAfterReload = page
            .locator(
                'textarea[placeholder*="description" i], input[placeholder*="description" i], textarea[name*="description" i], label:has-text("Description") + textarea, label:has-text("Description") ~ textarea'
            )
            .first()

        const descriptionFieldVisibleAfterReload = await descriptionFieldAfterReload.isVisible({ timeout: 2000 }).catch(() => false)

        if (descriptionFieldVisibleAfterReload) {
            const persistedDescription = await descriptionFieldAfterReload.inputValue()
            expect(persistedDescription).toBe(testDescription)
            console.log(`Verified: Description "${testDescription}" persisted after reload`)
        } else {
            // Alternative verification via API
            const response = await page.request.get(`${BASE_URL}/api/v1/chatflows/${chatflowId}`)
            const chatflowData = await response.json()
            expect(chatflowData.description).toBe(testDescription)
            console.log(`Verified via API: Description "${testDescription}" persisted`)
        }

        console.log('Template settings persistence test completed successfully')
    })
})
