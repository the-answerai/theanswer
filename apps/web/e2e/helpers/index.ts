/**
 * E2E Test Helpers - Centralized Exports
 *
 * This barrel file provides a single import point for all E2E testing utilities.
 *
 * @example
 * import {
 *   setupCredentialTest,
 *   loginWithTestUser,
 *   TEST_USERS,
 *   MODAL_TITLES,
 *   TIMEOUTS
 * } from '../../helpers'
 */

// Database helpers
export { resetOnly, seedScenario, resetAndSeed, resetDatabase } from './database'
export type { SeedPayload, CredentialSeedConfig, CredentialSeedEntry } from './database'

// Authentication helpers
export {
    loginWithTestUser,
    loginAsUser,
    TEST_USERS,
    fillEmailStep,
    fillPasswordStep,
    handleOrganizationSelection,
    waitForAuthRedirect
} from './auth'
export type { TestUser } from './auth'

// Credential modal helpers
export {
    expectModalVisible,
    expectModalHidden,
    waitForLoadingToResolve,
    getCredentialCard,
    expandCredentialCard,
    isCardExpanded,
    expectCredentialInSection,
    setupCredentialTest,
    selectCredentialFromDropdown,
    expectConfirmDialogVisible,
    confirmDialogAction
} from './credentials'

// Selectors & constants
export {
    MODAL_TITLES,
    LOADING_STATES,
    SECTIONS,
    CREDENTIAL_LABELS,
    BUTTON_TEXTS,
    CONFIRM_DIALOG,
    FORM_SELECTORS,
    AUTH_SELECTORS,
    TIMEOUTS,
    ADD_CREDENTIAL_DIALOG,
    NOTIFICATIONS,
    DROPDOWN,
    TEST_IDS
} from './selectors'

// Test data utilities (for parallel execution support)
export { deterministicId, prefixedName, isTestEntity, getTestPrefix } from './testData'
