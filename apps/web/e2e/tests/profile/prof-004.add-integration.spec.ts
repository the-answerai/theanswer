import { test, expect } from '@playwright/test'

test('test', async ({ page }) => {
    await page.getByRole('link', { name: 'View and manage your personal' }).click()
    await page.getByRole('heading', { name: 'Available Integrations' }).click()
    await page.getByText('No integrations are currently').click()
})
