import { test, expect } from '@playwright/test'

test('test', async ({ page }) => {
    await page.getByRole('link', { name: 'View and manage your personal' }).click()
    await page.locator('.MuiBox-root.css-1gomreu').click()
    await page.getByRole('heading', { name: 'Account Information' }).click()
    await page
        .locator('div')
        .filter({ hasText: /^Email Address$/ })
        .click()
    await page.getByText('diego@theanswer.ai', { exact: true }).nth(2).click()
    await page.getByText('Display Name').click()
    await page
        .getByRole('paragraph')
        .filter({ hasText: /^Diego Costa$/ })
        .click()
})
