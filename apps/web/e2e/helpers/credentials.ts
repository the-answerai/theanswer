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
    // Find the specific credential heading, then get the closest MuiPaper-root parent (credential card container)
    return modal
        .getByRole('heading', { name: label })
        .locator('xpath=ancestor::div[contains(@class, "MuiPaper-root") and contains(@class, "MuiPaper-elevation1")]')
        .first()
}

export const expectCredentialStatus = async (
    modal: Locator,
    credentialType: keyof typeof CREDENTIAL_LABELS,
    expectedStatus: 'assigned' | 'setupRequired'
): Promise<void> => {
    const card = getCredentialCard(modal, CREDENTIAL_LABELS[credentialType])
    const statusText = expectedStatus === 'assigned' ? 'Assigned' : 'Setup Required'
    await expect(card.getByText(statusText)).toBeVisible()
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
