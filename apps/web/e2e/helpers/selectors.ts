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
    assigned: 'Assigned',
    setupRequired: 'Setup Required'
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
    assignAndContinue: 'Assign & Continue'
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
