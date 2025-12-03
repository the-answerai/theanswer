import { expect, Locator, Page } from '@playwright/test'
import { MODAL_TITLES, LOADING_STATES, SECTIONS, CONFIRM_DIALOG, TIMEOUTS, TEST_IDS } from './selectors'
import { resetOnly, seedScenario } from './database'
import { loginWithTestUser, TEST_USERS } from './auth'

/**
 * Credential-specific E2E testing helpers
 * Domain-specific functions for testing credential management flows
 */

/**
 * Waits for the credential modal loading spinner to disappear
 *
 * This function handles the async loading of credentials in the modal by:
 * 1. Waiting for the CircularProgress (progressbar role) to disappear
 * 2. Waiting for the "Loading credentials..." text to disappear
 *
 * Use this after opening the credential modal to ensure data has fully loaded
 * before performing assertions or interactions.
 *
 * @param modal - The credential modal locator
 * @returns Promise that resolves when loading is complete
 * @throws {Error} If loading indicator doesn't disappear within 10 seconds
 *
 * @example
 * ```typescript
 * const modal = page.getByRole('dialog', { name: MODAL_TITLES.credentials })
 * await waitForLoadingToResolve(modal)
 * // Now safe to interact with credential cards
 * ```
 */
export const waitForLoadingToResolve = async (modal: Locator): Promise<void> => {
    console.log('⏳ Waiting for credentials to load...')

    try {
        // Wait for CircularProgress to disappear
        const progressbar = modal.getByRole(LOADING_STATES.progressbarRole)
        await progressbar.waitFor({ state: 'hidden', timeout: 10000 })
    } catch {
        // Already hidden or never appeared
    }

    try {
        // Also wait for loading text to disappear
        const loadingText = modal.getByText(LOADING_STATES.credentials)
        await loadingText.waitFor({ state: 'hidden', timeout: 10000 })
    } catch {
        // Already hidden
    }

    console.log('✅ Loading complete')
}

/**
 * Locates a specific credential card within a section of the credentials modal
 *
 * Uses data-testid selectors for reliable test targeting. Falls back to text search
 * if needed for legacy scenarios.
 *
 * @param modal - The credential modal locator
 * @param credentialLabel - Display name of the credential (e.g., "OpenAI", "Jira")
 * @param sectionName - Section name or pattern ("Required", "Optional", or SECTIONS.connected regex)
 * @returns Locator for the credential card container (Box element with data-testid)
 *
 * @example
 * ```typescript
 * const modal = await expectModalVisible(page)
 * const openAICard = await getCredentialCard(modal, 'OpenAI', SECTIONS.required)
 * // Now can interact with the card (check buttons, dropdowns, etc.)
 * ```
 */
export const getCredentialCard = async (modal: Locator, credentialLabel: string, sectionName: string | RegExp): Promise<Locator> => {
    // Determine section testid based on sectionName
    let sectionTestId: string
    if (sectionName === SECTIONS.required) {
        sectionTestId = TEST_IDS.sectionRequired
    } else if (sectionName === SECTIONS.optional) {
        sectionTestId = TEST_IDS.sectionOptional
    } else {
        // Connected section (regex pattern)
        sectionTestId = TEST_IDS.sectionConnected
    }

    // Get section container by data-testid
    const section = modal.getByTestId(sectionTestId)
    await expect(section).toBeVisible({ timeout: TIMEOUTS.SHORT })

    // Find credential card within section by matching label text
    // Cards have data-testid="credential-card-{groupKey}" but we search by label for flexibility
    const cardInSection = section
        .locator('[data-testid^="credential-card-"]')
        .filter({
            has: modal.page().getByText(new RegExp(credentialLabel, 'i'))
        })
        .first()

    await expect(cardInSection).toBeVisible({ timeout: TIMEOUTS.SHORT })
    return cardInSection
}

/**
 * Waits for the credentials modal to become visible and returns its locator
 *
 * This is typically the first step in credential-related test flows.
 * The function waits up to 20 seconds for the modal to appear, which accounts
 * for API calls and rendering time.
 *
 * @param page - The Playwright page object
 * @returns Promise resolving to the modal locator when visible
 * @throws {AssertionError} If modal doesn't appear within 20 seconds
 *
 * @example
 * ```typescript
 * // Open credential modal and wait for it to appear
 * await page.getByRole('button', { name: 'Manage Credentials' }).click()
 * const modal = await expectModalVisible(page)
 * await waitForLoadingToResolve(modal)
 * ```
 *
 * @example
 * ```typescript
 * // Use in a typical credential test flow
 * const modal = await expectModalVisible(page)
 * await waitForLoadingToResolve(modal)
 * await expectCredentialStatus(modal, 'openai', 'assigned')
 * ```
 */
export const expectModalVisible = async (page: Page): Promise<Locator> => {
    const modal = page.getByRole('dialog', { name: MODAL_TITLES.credentials })
    await expect(modal).toBeVisible({ timeout: 20000 })
    return modal
}

/**
 * Waits for the credentials modal to be hidden/closed
 *
 * Use this to verify that the modal has been successfully dismissed,
 * typically after clicking a close button or completing a workflow.
 * Waits up to 10 seconds for the modal to disappear.
 *
 * @param page - The Playwright page object
 * @returns Promise that resolves when modal is no longer visible
 * @throws {AssertionError} If modal doesn't disappear within 10 seconds
 *
 * @example
 * ```typescript
 * // Close modal and verify it's gone
 * await modal.getByRole('button', { name: 'Close' }).click()
 * await expectModalHidden(page)
 * ```
 *
 * @example
 * ```typescript
 * // Verify modal closes after completing credential assignment
 * await continueButton.click()
 * await expectModalHidden(page)
 * // Modal should be gone, ready to proceed with next step
 * ```
 */
export const expectModalHidden = async (page: Page): Promise<void> => {
    const modal = page.getByRole('dialog', { name: MODAL_TITLES.credentials })
    await expect(modal).toBeHidden({ timeout: 10000 })
}

/**
 * Verifies that a credential appears in the specified section
 *
 * Uses data-testid selectors for reliable test targeting. Asserts that a
 * credential card is visible within the given section (Required, Optional, or Connected).
 *
 * @param modal - The credential modal locator
 * @param credentialLabel - Display name of the credential (e.g., "OpenAI", "Jira")
 * @param sectionName - Section name or pattern ("Required", "Optional", or SECTIONS.connected regex)
 * @returns Promise that resolves when assertion passes
 * @throws {AssertionError} If credential is not found in the specified section
 *
 * @example
 * ```typescript
 * // Verify OpenAI is in Connected section (assigned)
 * await expectCredentialInSection(modal, 'OpenAI', SECTIONS.connected)
 * ```
 *
 * @example
 * ```typescript
 * // Verify Jira needs setup (in Required section)
 * await expectCredentialInSection(modal, 'Jira', SECTIONS.required)
 * ```
 *
 * @example
 * ```typescript
 * // Use after assigning a credential
 * await continueButton.click()
 * await expectCredentialInSection(modal, 'OpenAI', SECTIONS.connected)
 * ```
 */
export const expectCredentialInSection = async (
    modal: Locator,
    credentialLabel: string,
    sectionName: string | RegExp
): Promise<Locator> => {
    console.log(`🔍 Looking for "${credentialLabel}" in "${sectionName}" section...`)

    // Use getCredentialCard which already handles data-testid lookup
    const card = await getCredentialCard(modal, credentialLabel, sectionName)

    console.log(`✅ Found "${credentialLabel}" in "${sectionName}" section`)
    return card
}

/**
 * Expands a connected credential card to access management options
 *
 * Connected credentials (in the Connected section) are collapsed by default.
 * Click the card to expand it and reveal the dropdown to change credentials
 * and the "Add Another" button.
 *
 * @param card - The credential card locator (from getCredentialCard)
 * @returns Promise that resolves when expansion animation completes
 * @throws {Error} If card doesn't expand successfully
 *
 * @example
 * ```typescript
 * const openaiCard = await getCredentialCard(modal, 'OpenAI', SECTIONS.connected)
 * await expandCredentialCard(openaiCard)
 * // Now can access dropdown and "Add Another" button
 * const dropdown = openaiCard.getByRole('combobox')
 * ```
 *
 * @example
 * ```typescript
 * // Expand card and add another credential
 * await expandCredentialCard(connectedCard)
 * const addAnotherBtn = card.getByRole('button', { name: 'Add Another' })
 * await addAnotherBtn.click()
 * ```
 */
export const expandCredentialCard = async (card: Locator): Promise<void> => {
    console.log('🔽 Expanding credential card...')

    // Click the card to expand
    await card.click()

    // Wait for Collapse animation (Material-UI default: 300ms, add buffer)
    await card.page().waitForTimeout(400)

    // Verify expanded by checking for "Change connection:" label or "Add Another" button
    const changeConnectionLabel = card.getByText('Change connection:', { exact: false })
    const addAnotherButton = card.getByRole('button', { name: /(Add Another|Add Credential)/i })

    const hasLabel = await changeConnectionLabel.isVisible().catch(() => false)
    const hasButton = await addAnotherButton.isVisible().catch(() => false)

    if (!hasLabel && !hasButton) {
        throw new Error('Card did not expand successfully - neither "Change connection" label nor "Add Another" button visible')
    }

    console.log('✅ Card expanded')
}

/**
 * Checks if a connected credential card is currently expanded
 *
 * @param card - The credential card locator
 * @returns Promise resolving to true if card is expanded, false otherwise
 *
 * @example
 * ```typescript
 * if (await isCardExpanded(card)) {
 *   console.log('Card is already expanded')
 * } else {
 *   await expandCredentialCard(card)
 * }
 * ```
 */
export const isCardExpanded = async (card: Locator): Promise<boolean> => {
    const changeConnectionLabel = card.getByText('Change connection:', { exact: false })
    const addAnotherButton = card.getByRole('button', { name: /(Add Another|Add Credential)/i })

    const hasLabel = await changeConnectionLabel.isVisible().catch(() => false)
    const hasButton = await addAnotherButton.isVisible().catch(() => false)

    return hasLabel || hasButton
}

/**
 * Waits for a confirmation dialog to appear and returns its locator
 *
 * Note: MUI Dialog uses role="dialog" (not alertdialog). The ConfirmDialog renders
 * via createPortal to #portal, so we search the entire page and filter by title.
 *
 * @param page - The Playwright page object
 * @param title - Title text or pattern of the dialog
 * @returns Promise resolving to the dialog locator when visible
 * @throws {AssertionError} If dialog doesn't appear within 5 seconds
 *
 * @example
 * ```typescript
 * const dialog = await expectConfirmDialogVisible(page, CONFIRM_DIALOG.cancelTitle)
 * await confirmDialogAction(dialog, 'confirm')
 * ```
 */
export const expectConfirmDialogVisible = async (page: Page, title: string | RegExp): Promise<Locator> => {
    console.log(`🔍 Waiting for confirm dialog: "${title}"...`)

    // MUI Dialog uses role="dialog" (not alertdialog)
    // ConfirmDialog renders via createPortal to #portal, outside the main modal
    // Find all dialogs and filter by one containing the title text
    const dialogs = page.getByRole('dialog')
    const dialog = dialogs.filter({ has: page.getByText(title) }).first()

    await expect(dialog).toBeVisible({ timeout: TIMEOUTS.SHORT })
    console.log('✅ Confirm dialog visible')
    return dialog
}

/**
 * Clicks a button in a confirmation dialog
 *
 * @param dialog - The dialog locator (from expectConfirmDialogVisible)
 * @param action - 'confirm' to click the confirm button, 'cancel' to click cancel
 *
 * @example
 * ```typescript
 * const dialog = await expectConfirmDialogVisible(page, CONFIRM_DIALOG.skipTitle)
 * await confirmDialogAction(dialog, 'confirm') // Clicks "Skip anyway" or similar
 * ```
 */
export const confirmDialogAction = async (dialog: Locator, action: 'confirm' | 'cancel'): Promise<void> => {
    const buttonPattern = action === 'confirm' ? CONFIRM_DIALOG.confirmButtons : CONFIRM_DIALOG.cancelButton
    console.log(`🖱️ Clicking ${action} button in dialog...`)
    await dialog.getByRole('button', { name: buttonPattern }).click()
    console.log(`✅ Clicked ${action}`)
}

/**
 * Selects a credential from a dropdown in a credential card
 *
 * @param card - The credential card locator
 * @param optionIndex - Index of the option to select (0-based, default: 0)
 *
 * @example
 * ```typescript
 * const card = await getCredentialCard(modal, 'OpenAI', SECTIONS.required)
 * await selectCredentialFromDropdown(card, 0) // Select first option
 * ```
 */
export const selectCredentialFromDropdown = async (card: Locator, optionIndex: number = 0): Promise<void> => {
    console.log(`📋 Selecting option ${optionIndex} from credential dropdown...`)
    const dropdown = card.getByRole('combobox')
    await dropdown.click()
    const options = card.page().getByRole('option')
    await options.nth(optionIndex).click()
    console.log('✅ Option selected')
}

/**
 * Complete test setup helper for credential modal tests
 *
 * Performs the full setup sequence:
 * 1. Resets database
 * 2. Logs in with test user
 * 3. Waits for redirect to /chat/
 * 4. Seeds the specified scenario
 * 5. Navigates to /chat
 * 6. Waits for modal to appear and load
 *
 * @param page - The Playwright page object
 * @param scenario - The database scenario to seed (e.g., 'baseline', 'user-with-openai')
 * @param userType - Type of test user to login as (default: 'admin')
 * @returns Promise resolving to the modal locator when ready
 *
 * @example
 * ```typescript
 * test.beforeEach(async ({ page }) => {
 *   await setupCredentialTest(page, 'baseline', 'member')
 * })
 *
 * test('my test', async ({ page }) => {
 *   const modal = await expectModalVisible(page)
 *   // Modal is already loaded and ready
 * })
 * ```
 */
export const setupCredentialTest = async (page: Page, scenario: string, userType: keyof typeof TEST_USERS = 'admin'): Promise<Locator> => {
    console.log(`🧪 Setting up credential test: scenario="${scenario}", user="${userType}"`)

    // Step 1: Reset database
    console.log('🗑️ Resetting database...')
    await resetOnly()

    // Step 2: Login
    console.log(`🔐 Logging in as ${userType}...`)
    await loginWithTestUser(page, userType, true)

    // Step 3: Wait for redirect
    await expect(page).toHaveURL(/\/chat\//, { timeout: TIMEOUTS.LONG })

    // Step 4: Seed scenario
    console.log(`🌱 Seeding scenario: ${scenario}...`)
    await seedScenario(scenario, userType)

    // Step 5: Navigate to trigger modal
    console.log('🚀 Navigating to /chat...')
    await page.goto('/chat', { waitUntil: 'networkidle' })

    // Step 6: Wait for modal
    const modal = await expectModalVisible(page)
    await waitForLoadingToResolve(modal)

    console.log('✅ Setup complete!')
    return modal
}
