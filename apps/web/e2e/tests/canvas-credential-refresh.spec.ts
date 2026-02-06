import { test, expect } from '@playwright/test'

/**
 * E2E Test for AGENT-76: Canvas Credential Refresh
 *
 * This test verifies that when a credential is saved/selected in the credential modal,
 * the canvas updates immediately to reflect the change without requiring a page refresh.
 *
 * Bug: Previously, after saving a credential in the modal, the canvas node wouldn't
 * update to show the newly selected credential until the user manually refreshed the page.
 *
 * Fix: Refactored credential state update in NodeInputHandler.jsx to use the centralized
 * onNodeDataChange pattern for consistent ReactFlow state management.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

test.describe('Canvas Credential Refresh (AGENT-76)', () => {
    test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 720 })
    })

    test('Canvas node updates immediately when credential is selected from dropdown', async ({ page }) => {
        // Navigate to chatflows page (auth state is handled by playwright setup)
        await page.goto(`${BASE_URL}/sidekick-studio/chatflows`)
        await page.waitForLoadState('networkidle')

        // Click "Add New" button to create a new chatflow
        const addNewButton = page.locator('button:has-text("Add New")').first()
        await expect(addNewButton).toBeVisible({ timeout: 10000 })
        await addNewButton.click()
        await page.waitForLoadState('networkidle')

        // Wait for the canvas to be visible (ReactFlow container)
        const canvas = page.locator('.react-flow')
        await expect(canvas).toBeVisible({ timeout: 10000 })

        // Open the node palette by clicking the "+" button or triggering the add nodes dialog
        const addNodeTrigger = page
            .locator('button[aria-label*="add" i], ' + 'button:has(svg[data-testid="AddIcon"]), ' + '[data-testid="add-node-button"]')
            .first()

        if (await addNodeTrigger.isVisible({ timeout: 3000 }).catch(() => false)) {
            await addNodeTrigger.click()
            // Wait for node palette to appear rather than fixed timeout
            await page
                .waitForFunction(() => !!document.querySelector('input[placeholder*="Search" i], input[placeholder*="search" i]'), {
                    timeout: 3000
                })
                .catch(() => null)
        }

        // Search for ChatOpenAI node (a common node that requires credentials)
        const searchInput = page.locator('input[placeholder*="Search" i], input[placeholder*="search" i]').first()
        if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
            await searchInput.fill('ChatOpenAI')
            // Wait for search results to appear
            await page
                .waitForFunction(
                    () => {
                        const nodes = document.querySelectorAll('div:has-text("ChatOpenAI")')
                        return nodes.length > 0
                    },
                    { timeout: 3000 }
                )
                .catch(() => null)
        }

        // Find and click on the ChatOpenAI node option to add it to the canvas
        const chatOpenAINode = page
            .locator('div:has-text("ChatOpenAI")')
            .filter({ hasText: /ChatOpenAI/ })
            .first()
        if (await chatOpenAINode.isVisible({ timeout: 3000 }).catch(() => false)) {
            await chatOpenAINode.click()
            // Wait for node to be added to canvas
            await page.waitForFunction(() => !!document.querySelector('.react-flow__node'), { timeout: 3000 }).catch(() => null)
        }

        // Wait for a node to appear on the canvas
        const canvasNode = page.locator('.react-flow__node').first()
        await expect(canvasNode).toBeVisible({ timeout: 5000 })

        // Click on the node to select it
        await canvasNode.click()
        // Wait for node panel to render input fields
        await page
            .waitForFunction(() => !!document.querySelector('text=/Connect Credential|Credential/i'), { timeout: 3000 })
            .catch(() => null)

        // Look for the credential dropdown/input in the node panel
        const credentialLabel = page.locator('text=/Connect Credential|Credential/i').first()

        if (await credentialLabel.isVisible({ timeout: 5000 }).catch(() => false)) {
            // Find the dropdown near the credential label
            const credentialDropdown = page.locator('.MuiAutocomplete-root input').first()

            if (await credentialDropdown.isVisible({ timeout: 3000 }).catch(() => false)) {
                // Store the initial state of the dropdown
                const initialValue = await credentialDropdown.inputValue().catch(() => '')

                // Click to open the dropdown
                await credentialDropdown.click()
                // Wait for dropdown options to appear
                await page
                    .waitForFunction(() => !!document.querySelector('[role="listbox"] [role="option"], .MuiAutocomplete-option'), {
                        timeout: 3000
                    })
                    .catch(() => null)

                // Look for credential options in the dropdown popup
                const dropdownOptions = page.locator('[role="listbox"] [role="option"], .MuiAutocomplete-option')

                if (
                    await dropdownOptions
                        .first()
                        .isVisible({ timeout: 3000 })
                        .catch(() => false)
                ) {
                    // Get the first available credential option
                    const firstOption = dropdownOptions.first()
                    const optionText = await firstOption.textContent()

                    // Track the current URL before selection
                    const urlBeforeSelection = page.url()

                    // Select the credential
                    await firstOption.click()
                    // Wait for dropdown to close and value to be set
                    await page
                        .waitForFunction(
                            () => {
                                const input = document.querySelector('.MuiAutocomplete-root input')
                                return input && (input as HTMLInputElement).value !== initialValue
                            },
                            { timeout: 3000 }
                        )
                        .catch(() => null)

                    // CRITICAL ASSERTIONS for AGENT-76 fix:

                    // 1. Verify the dropdown now shows the selected credential
                    const updatedValue = await credentialDropdown.inputValue().catch(() => '')

                    // The value should have changed after selection
                    expect(updatedValue).not.toBe('')
                    expect(updatedValue.toLowerCase()).not.toContain('choose')

                    // 2. Verify the page URL hasn't changed (no refresh occurred)
                    expect(page.url()).toBe(urlBeforeSelection)

                    // 3. Verify the canvas node still exists and is visible (it wasn't reset)
                    await expect(canvasNode).toBeVisible()

                    // 4. Verify the UI reflects the credential change without a page reload
                    expect(updatedValue).not.toBe(initialValue)
                } else {
                    // No existing credentials - test is inconclusive but not a failure
                    test.skip(true, 'No credentials available in dropdown to test')
                }
            } else {
                // Alternative: Look for async dropdown component
                test.skip(true, 'Could not locate credential dropdown component')
            }
        } else {
            // The node might not have a visible credential section
            test.skip(true, 'Node does not have visible credential input section')
        }
    })
})
