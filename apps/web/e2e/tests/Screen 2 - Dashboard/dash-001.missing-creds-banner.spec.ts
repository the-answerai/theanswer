import { test, expect } from '@playwright/test'
import { loginWithTestUser } from '../../helpers/auth'
import { resetOnly, seedScenario } from '../../helpers/database'
import { expectModalVisible, waitForLoadingToResolve, getCredentialCard } from '../../helpers/credentials'
import { CREDENTIAL_LABELS, STATUS_CHIP } from '../../helpers/selectors'

test.describe.serial('Dashboard – Missing Credentials UX', () => {
    test('DASH-001 shows Jira warning banner when credential is not configured', async ({ page }) => {
        console.log('🗑️ Resetting database for clean test state...')
        await resetOnly()

        console.log('🔐 Logging in as admin (creates authenticated user + default chatflow)...')
        await loginWithTestUser(page, 'admin', true)

        await expect(page).toHaveURL(/\/chat/, { timeout: 20000 })
        console.log('✅ User landed on /chat')

        console.log('🔧 Seeding scenario with Jira left unconfigured...')
        await seedScenario('user-with-all-credentials')
        await page.waitForTimeout(2000)

        console.log('🔄 Refreshing chat to load seeded state...')
        await page.goto('/chat', { waitUntil: 'networkidle' })
        await expect(page).not.toHaveURL(/auth0\.com/)

        console.log('🪟 Waiting for credentials modal...')
        const modal = await expectModalVisible(page)
        await waitForLoadingToResolve(modal)

        const initialJiraCard = getCredentialCard(modal, CREDENTIAL_LABELS.jira)
        await expect(initialJiraCard.getByText(STATUS_CHIP.setupRequired)).toBeVisible()
        console.log('✅ Credentials modal finished loading Jira card')

        console.log('❌ Closing credentials modal via Cancel confirmation...')
        page.on('dialog', async (dialog) => {
            console.log(`Dialog type: ${dialog.type()}`)
            console.log(`Dialog message: ${dialog.message()}`)
            await dialog.accept()
        })
        await modal.getByRole('button', { name: /^Cancel$/ }).click()
        await expect(modal).toBeHidden({ timeout: 10000 })
        console.log('✅ Credentials modal closed')

        const warningButton = page.locator('button').filter({ has: page.locator('[data-testid="WarningAmberIcon"]') }).first()
        await expect(warningButton).toBeVisible({ timeout: 10000 })
        console.log('⚠️ Warning indicator is visible')

        await warningButton.hover()
        await expect(page.getByRole('tooltip', { name: 'Configuration required - Missing credentials' })).toBeVisible()
        console.log('✅ Tooltip confirms missing credentials message')
    })

    test('DASH-002 clicking warning badge reopens Jira credential modal', async ({ page }) => {
        console.log('♻️ Reusing seeded dashboard state (no reset)...')

        console.log('🔐 Logging in as admin without reseeding...')
        await loginWithTestUser(page, 'admin', true)

        await expect(page).toHaveURL(/\/chat/, { timeout: 20000 })
        console.log('✅ User landed on /chat')

        console.log('🪟 Waiting for auto-triggered credentials modal...')
        const modal = await expectModalVisible(page)
        await waitForLoadingToResolve(modal)

        const jiraCardBeforeClose = getCredentialCard(modal, CREDENTIAL_LABELS.jira)
        await expect(jiraCardBeforeClose.getByText(STATUS_CHIP.setupRequired)).toBeVisible()
        console.log('✅ Credentials modal fully loaded before closing')

        console.log('❌ Closing modal so we can use dashboard CTA...')
        page.on('dialog', async (dialog) => {
            await dialog.accept()
        })
        await modal.getByRole('button', { name: /^Cancel$/ }).click()
        await expect(modal).toBeHidden({ timeout: 10000 })

        const warningButton = page.locator('button').filter({ has: page.locator('[data-testid="WarningAmberIcon"]') }).first()
        await expect(warningButton).toBeVisible({ timeout: 10000 })
        console.log('⚠️ Warning indicator ready for interaction')

        console.log('🟡 Clicking warning badge to reopen credentials modal...')
        await warningButton.click()

        const reopenedModal = await expectModalVisible(page)
        await waitForLoadingToResolve(reopenedModal)

        const jiraCard = getCredentialCard(reopenedModal, CREDENTIAL_LABELS.jira)
        await expect(jiraCard.getByText(STATUS_CHIP.setupRequired)).toBeVisible()
        console.log('✅ Credentials modal reopened and highlights Jira setup requirement')
    })
})
