/**
 * UI selectors and constants for E2E testing
 * Centralized location for all UI-related test constants
 */

export const MODAL_TITLES = {
    credentials: 'Manage Credentials',
    sidekickSetup: 'Set up your AI assistant'
} as const

export const LOADING_STATES = {
    credentials: 'Loading credentials...',
    general: 'Loading...'
} as const

export const STATUS_CHIP = {
    connected: 'Connected',
    required: 'Required',
    // Legacy support (deprecated - use 'connected' instead)
    assigned: 'Connected',
    setupRequired: 'Setup Required'
} as const

export const CREDENTIAL_LABELS = {
    openai: /Open\s+AI\s+api/i,
    exa: /Exa\s+search\s+api/i,
    jira: /Jira\s+api/i,
    confluence: /Confluence\s+cloud\s+api/i,
    github: /Github\s+api/i,
    contentful: /Contentful\s+management\s+api/i,
    slack: /Slack\s+api/i
} as const

export const TEST_IDS = {
    credentialsLoading: 'credentials-loading-state',
    credentialCard: 'credential-card',
    statusChip: 'status-chip'
} as const

export const BUTTON_TEXTS = {
    continue: 'Continue',
    next: 'Next',
    logIn: 'Log In',
    signIn: 'Sign In',
    submit: 'Submit',
    connect: 'Connect',
    useExisting: /Use existing \(\d+\)/,
    createNew: 'Create new',
    closeAnyway: 'Close anyway',
    // Legacy support (deprecated)
    assignAndContinue: 'Continue'
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
