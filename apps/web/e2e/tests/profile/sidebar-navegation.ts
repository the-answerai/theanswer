import { test, expect } from '@playwright/test'

test('test', async ({ page }) => {
    await page.getByRole('link', { name: 'View and manage your personal' }).click()
    await page.getByRole('link', { name: 'Start a conversation with AI' }).click()
    await page.getByRole('link', { name: 'View and manage your personal' }).click()
    await page
        .locator('div')
        .filter({ hasText: /^Profile$/ })
        .nth(1)
        .click()
    await page.getByRole('button', { name: 'Build and customize your own' }).click()
    await page.getByRole('link', { name: 'Create conversation flows and' }).click()
})
