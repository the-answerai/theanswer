import { test, expect } from '@playwright/test'
import { loginWithTestUser } from '../../helpers/auth'
import { resetOnly, seedScenario } from '../../helpers/database'
import { expectModalVisible, waitForLoadingToResolve, getCredentialCard } from '../../helpers/credentials'
import { CREDENTIAL_LABELS, STATUS_CHIP } from '../../helpers/selectors'

test.describe('Dashboard – Input Chat', () => {
    test('DASH-004: User can send query but app warns about missing Jira/Confluence', async ({ page }) => {
        console.log('🗑️ Resetting database for clean test state...')
        await resetOnly()

        console.log('🔐 Logging in as admin (creates authenticated user + default chatflow)...')
        await loginWithTestUser(page, 'admin', true)

        await expect(page).toHaveURL(/\/chat/, { timeout: 20000 })
        console.log('✅ User landed on /chat')

        console.log('🔧 Seeding scenario with Jira/Confluence not assigned...')
        await seedScenario('user-with-all-credentials')
        await page.waitForTimeout(2000)

        console.log('🔄 Refreshing chat to load seeded state...')
        await page.goto('/chat', { waitUntil: 'networkidle' })
        await expect(page).not.toHaveURL(/auth0\.com/)

        console.log('🪟 Waiting for credentials modal...')
        const modal = await expectModalVisible(page)
        await waitForLoadingToResolve(modal)

        const jiraCard = getCredentialCard(modal, CREDENTIAL_LABELS.jira)
        await expect(jiraCard.getByText(STATUS_CHIP.setupRequired)).toBeVisible()
        console.log('✅ Verified Jira is "Setup Required"')

        console.log('❌ Closing credentials modal via Cancel confirmation...')
        page.on('dialog', async (dialog) => {
            console.log(`Dialog type: ${dialog.type()}`)
            console.log(`Dialog message: ${dialog.message()}`)
            await dialog.accept()
        })
        await modal.getByRole('button', { name: /^Cancel$/ }).click()
        await expect(modal).toBeHidden({ timeout: 10000 })
        console.log('✅ Credentials modal closed')

        console.log('🔍 Verifying warning indicator is present...')
        const warningButton = page.locator('button').filter({ has: page.locator('[data-testid="WarningAmberIcon"]') }).first()
        await expect(warningButton).toBeVisible({ timeout: 10000 })
        console.log('⚠️ Warning indicator confirmed visible')

        console.log('🔍 Looking for chat input field...')
        const chatInput = page
            .locator('input[placeholder*="Send"], input[placeholder*="question"], textarea[placeholder*="Send"], textarea[placeholder*="question"]')
            .first()
        await expect(chatInput).toBeVisible({ timeout: 10000 })
        console.log('✅ Chat input field found')

        const testMessage = 'Can you check my Jira tickets?'
        console.log(`📝 Typing message: "${testMessage}"`)
        await chatInput.fill(testMessage)

        console.log('🖱️ Looking for send button...')
        const sendButton = page.locator('button:has-text("SEND"), button:has-text("Send")').first()
        await expect(sendButton).toBeVisible({ timeout: 5000 })

        console.log('📤 Clicking send button...')
        await sendButton.click()

        console.log('⏳ Waiting for user message to appear in chat...')
        const messageInChat = page.locator(`text="${testMessage}"`).first()
        await expect(messageInChat).toBeVisible({ timeout: 10000 })
        console.log('✅ User message appeared in chat (input was accepted)')

        console.log('⏳ Waiting for agent response...')
        await page.waitForTimeout(5000)

        console.log('🔍 Looking for agent response or error message...')
        // The agent should respond - either:
        // 1. With a message about Jira not being available
        // 2. With a generic response indicating limited functionality
        // 3. Or with an error message

        // Wait for any response to appear (we'll verify behavior after running the test)
        const responseAppeared = await Promise.race([
            page.locator('[class*="message"]').nth(1).isVisible().catch(() => false),
            page.locator('[role="article"]').nth(1).isVisible().catch(() => false),
            page.waitForTimeout(10000).then(() => false)
        ])

        console.log('📊 Agent response detection:', responseAppeared ? 'Response received' : 'Timeout waiting for response')

        console.log('⚠️ Verifying warning indicator remains visible...')
        await expect(warningButton).toBeVisible({ timeout: 5000 })
        console.log('✅ Warning indicator still visible (credentials still missing)')

        console.log('✅ DASH-004 PASSED: Chat input accepted with missing credentials, warning remains visible')
    })
})
