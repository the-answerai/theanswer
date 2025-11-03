import { expect, Locator, Page } from '@playwright/test'
import { MODAL_TITLES, CREDENTIAL_LABELS, TEST_IDS } from './selectors'

/**
 * Credential-specific E2E testing helpers
 * Domain-specific functions for testing credential management flows
 */

export const waitForLoadingToResolve = async (modal: Locator): Promise<void> => {
    const loadingIndicator = modal.getByTestId(TEST_IDS.credentialsLoading)
    await loadingIndicator.waitFor({ state: 'visible', timeout: 5000 }).catch(() => undefined)
    await loadingIndicator.waitFor({ state: 'hidden', timeout: 20000 })
}

export const getCredentialCard = (modal: Locator, label: RegExp): Locator => {
    // Find the credential heading and traverse up 4 levels to the card container (MuiPaper-root)
    // This ensures we scope to the entire credential card, not just the heading row
    return modal.getByRole('heading', { name: label }).locator('xpath=ancestor::div[4]')
}

export const expectCredentialStatus = async (
    modal: Locator,
    credentialType: keyof typeof CREDENTIAL_LABELS,
    expectedStatus: 'connected' | 'required' | 'assigned' | 'setupRequired'
): Promise<void> => {
    const card = getCredentialCard(modal, CREDENTIAL_LABELS[credentialType])

    if (expectedStatus === 'assigned' || expectedStatus === 'connected') {
        // Connected credentials show a "Connected" status chip
        await expect(card.getByText('Connected', { exact: true })).toBeVisible()
    } else {
        // Unconnected/optional credentials show a "Connect" button (no status text)
        await expect(card.getByRole('button', { name: 'Connect' })).toBeVisible()
    }
}

export const expectModalVisible = async (page: Page): Promise<Locator> => {
    const modal = page.getByRole('dialog', { name: MODAL_TITLES.credentials })
    await expect(modal).toBeVisible({ timeout: 20000 })
    return modal
}

export const expectModalHidden = async (page: Page): Promise<void> => {
    const modal = page.getByRole('dialog', { name: MODAL_TITLES.credentials })
    await expect(modal).toBeHidden({ timeout: 10000 })
}
