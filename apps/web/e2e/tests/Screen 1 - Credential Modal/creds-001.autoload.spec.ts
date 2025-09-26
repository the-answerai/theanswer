import { test, expect } from '@playwright/test'

import { resetAndSeed } from '../../helpers/database'
import { waitForLoadingToResolve } from '../../helpers/credentials'
import { loginWithTestUser } from '../../helpers/auth'
import { MODAL_TITLES } from '../../helpers/selectors'

test.describe('Popup Auto-load', () => {
    test.beforeEach(async ({ page }) => {
        // Seed with the default SK Sidekick Chatflow that contains credentials requiring setup
        await resetAndSeed({
            chatflow: { 
                name: 'SK - Chief Sidekick Chatflow'
            }
        })
    })

    test('shows the credentials modal after login', async ({ page }) => {
        // Step 1: Login with enterprise member user
        await loginWithTestUser(page, 'member')
        
        // Step 2: Verify automatic redirect to /chat/
        await expect(page).toHaveURL(/\/chat\//, { timeout: 20000 })
        
        // Step 3: Wait for the credentials modal to appear automatically (give it up to 10 seconds for Firefox)
        const modal = page.getByRole('dialog', { name: MODAL_TITLES.credentials })
        await expect(modal).toBeVisible({ timeout: 10000 })
        
        // Step 4: Wait for modal loading state to resolve
        await waitForLoadingToResolve(modal)
        
        // Step 5: Verify modal title is correct
        await expect(modal.getByRole('heading', { name: MODAL_TITLES.credentials })).toBeVisible()
        
        // Step 6: Verify at least one credential shows "Setup Required" status
        await expect(modal.getByText('Setup Required').first()).toBeVisible()
    })
})
