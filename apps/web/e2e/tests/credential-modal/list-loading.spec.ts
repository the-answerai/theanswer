import { test, expect } from '@playwright/test'
import {
    resetOnly,
    seedScenario,
    loginWithTestUser,
    waitForLoadingToResolve,
    expectCredentialInSection,
    MODAL_TITLES,
    TIMEOUTS,
    SECTIONS
} from '../../helpers'

test.describe('List Loading', () => {
    test('shows Assigned/Setup Required states', async ({ page }) => {
        // Step 1: Clean database for isolated test
        console.log('🗑️ Resetting database for clean test state...')
        await resetOnly()

        // Step 2: Login using proven approach from auth.spec.ts (creates user + default chatflow)
        console.log('🔐 Starting fresh login...')
        await loginWithTestUser(page, 'admin', true)

        // Step 3: Verify we're authenticated and can see user content
        const userEmail = page.locator('text=' + process.env.TEST_USER_ENTERPRISE_ADMIN_EMAIL!).first()
        await expect(userEmail).toBeVisible({ timeout: TIMEOUTS.MEDIUM })
        console.log('✅ User authenticated and visible in UI')

        // Step 4: Ensure we're on /chat/ before seeding so the user exists server-side
        await expect(page).toHaveURL(/\/chat\//, { timeout: TIMEOUTS.LONG })

        // Step 5: Apply baseline scenario (no credentials) to test Required section
        console.log('🔧 Applying credential scenario: baseline...')
        await seedScenario('baseline')

        // Wait for database operations to complete
        await page.waitForLoadState('networkidle')

        // Step 6: Navigate to chat - modal should appear automatically
        console.log('🚀 Navigating to /chat...')
        await page.goto('/chat', { waitUntil: 'networkidle' })
        await expect(page).not.toHaveURL(/auth0\.com/)

        // Step 7: Wait for modal to appear
        console.log('⏳ Waiting for credentials modal...')
        await page.waitForSelector(`[role="dialog"]`, { timeout: TIMEOUTS.MODAL_APPEAR })

        const modal = page.getByRole('dialog', { name: MODAL_TITLES.credentials })
        await expect(modal).toBeVisible()
        console.log('✅ Credentials modal appeared')

        // Step 7: Wait for loading to resolve and test credential states
        await waitForLoadingToResolve(modal)

        // With baseline scenario (no credentials), OpenAI should be in Required section (needs setup)
        // OpenAI is Required (Chat Model category = isCore: true)
        await expectCredentialInSection(modal, 'openai', SECTIONS.required)
        console.log('✅ OpenAI in Required section (Chat Model - needs setup)')

        // Other credentials should be in Optional section
        // Exa is Optional (Tool category = isCore: false)
        await expectCredentialInSection(modal, 'exa', SECTIONS.optional)
        console.log('✅ Exa in Optional section (Tool)')

        // Jira is Optional (MCP Server category = isCore: false)
        await expectCredentialInSection(modal, 'jira', SECTIONS.optional)
        console.log('✅ Jira in Optional section (MCP Server)')

        // Confluence is Optional (MCP Server category = isCore: false)
        await expectCredentialInSection(modal, 'confluence', SECTIONS.optional)
        console.log('✅ Confluence in Optional section (MCP Server)')

        console.log('✅ All credential sections verified successfully')
    })
})
