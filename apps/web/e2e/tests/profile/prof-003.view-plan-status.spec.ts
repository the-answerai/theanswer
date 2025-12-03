import { test, expect } from '@playwright/test'

test('test', async ({ page }) => {
    await page.goto('http://localhost:3000/chat/')
    await page.getByRole('link', { name: 'View and manage your personal' }).click()
    await page.getByRole('heading', { name: 'Subscription Status' }).click()
    await page.getByText('Free Plan').click()
    await page.getByText('Upgrade to premium for').click()
})
