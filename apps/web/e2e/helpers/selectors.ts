/**
 * UI selectors and constants for E2E testing
 * Centralized location for all UI-related test constants
 */

export const MODAL_TITLES = {
    credentials: /(Manage Credentials|Setup Required Credentials)/,
    sidekickSetup: 'Set up your AI assistant'
} as const

export const LOADING_STATES = {
    credentials: 'Loading credentials...',
    general: 'Loading...',
    progressbarRole: 'progressbar'
} as const

export const SECTIONS = {
    required: 'Required',
    optional: 'Optional',
    connected: /Connected \(\d+\)/
} as const

export const CREDENTIAL_LABELS = {
    openai: /OpenAIApi/i,
    exa: /exaSearchApi/i,
    jira: /JiraApi/i,
    confluence: /confluenceCloudApi/i,
    github: /githubApi/i,
    contentful: /contentfulManagementApi/i,
    slack: /slackApi/i
} as const

export const BUTTON_TEXTS = {
    continue: 'Continue',
    saving: 'Saving...',
    next: 'Next',
    logIn: 'Log In',
    signIn: 'Sign In',
    submit: 'Submit',
    cancel: 'Cancel',
    finishLater: "I'll finish this later",
    add: 'Add',
    addAnother: 'Add Another',
    addCredential: 'Add Credential',
    /** @deprecated - use 'continue' instead */
    assignAndContinue: 'Assign & Continue'
} as const

export const CONFIRM_DIALOG = {
    skipTitle: 'Skip credential setup?',
    cancelTitle: 'Required credentials missing',
    confirmButtons: /(Skip anyway|Close anyway)/,
    cancelButton: 'Continue setup'
} as const

export const FORM_SELECTORS = {
    email: 'input[name="username"], input[type="email"], input[name="email"]',
    password: 'input[name="password"], input[type="password"]',
    organization: 'input[name="organization"]'
} as const

export const AUTH_SELECTORS = {
    continueButton: [
        'button[type="submit"]',
        'button:has-text("Continue")',
        'button:has-text("Next")',
        'button[data-action-button-primary="true"]'
    ].join(', '),
    submitButton: [
        'button[type="submit"][data-action-button-primary="true"]',
        'button[type="submit"]:not([data-provider])',
        'button:has-text("Log In")',
        'button:has-text("Sign In")',
        'button:has-text("Continue")'
    ].join(', ')
} as const

/**
 * Centralized timeout constants for E2E tests
 * Use these instead of hardcoded values to maintain consistency across all tests
 */
export const TIMEOUTS = {
    /** Short wait for quick UI updates (5 seconds) */
    SHORT: 5_000,
    /** Medium wait for standard operations (10 seconds) */
    MEDIUM: 10_000,
    /** Long wait for complex operations (20 seconds) */
    LONG: 20_000,
    /** Wait for Auth0 authentication redirects (15 seconds) */
    AUTH_REDIRECT: 15_000,
    /** Wait for modal visibility and animations (10 seconds) */
    MODAL_APPEAR: 10_000,
    /** Wait for full page loads with all resources (30 seconds) */
    PAGE_LOAD: 30_000,
    /** Wait for network idle state in navigation (30 seconds) */
    NETWORK_IDLE: 30_000
} as const

/**
 * Selectors for the Add Credential dialog form
 */
export const ADD_CREDENTIAL_DIALOG = {
    formInputs: {
        name: '#credName',
        accessToken: '#accessToken',
        username: '#username',
        baseURL: '#baseURL'
    },
    submitButton: 'button[type="submit"]'
} as const

/**
 * Toast notification messages
 */
export const NOTIFICATIONS = {
    credentialsSaved: 'Credentials saved successfully!',
    credentialsUpdated: 'Credentials updated successfully!'
} as const

/**
 * Dropdown placeholder text
 */
export const DROPDOWN = {
    placeholder: 'Or choose existing...',
    loading: 'Loading...'
} as const

/**
 * Data-testid selectors for credential modal
 * These provide reliable test targeting for UI elements
 */
export const TEST_IDS = {
    // Section containers
    sectionRequired: 'credential-section-required',
    sectionOptional: 'credential-section-optional',
    sectionConnected: 'credential-section-connected',

    // Action buttons
    continueButton: 'credential-modal-continue',
    skipButton: 'credential-modal-skip',

    // Dynamic selectors (use with template literals or as functions)
    credentialCard: (groupKey: string) => `credential-card-${groupKey}`,
    credentialDropdown: (groupKey: string) => `credential-dropdown-${groupKey}`,
    credentialAddButton: (groupKey: string) => `credential-add-${groupKey}`,
    credentialChangeDropdown: (groupKey: string) => `credential-change-${groupKey}`
} as const
