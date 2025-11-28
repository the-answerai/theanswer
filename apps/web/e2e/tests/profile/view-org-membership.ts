import { test, expect } from '@playwright/test'

test('test', async ({ page }) => {
    await page.goto('http://localhost:3000/chat/')
    await page.getByRole('link', { name: 'View and manage your personal' }).click()
    await page.getByRole('heading', { name: 'Organization' }).click()
    await page.getByRole('heading', { name: 'local-dev' }).click()
    await page.getByText('Organization Member').click()
})
