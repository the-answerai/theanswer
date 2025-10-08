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

export const PROFILE_SELECTORS = {
    // Profile page sections
    accountInformation: 'Account Information',
    organization: 'Organization',
    subscriptionStatus: 'Subscription Status',
    availableIntegrations: 'Available Integrations',

    // Profile card elements
    avatar: '[data-testid="user-avatar"], .MuiAvatar-root, [class*="avatar"]',
    displayName: 'h5',
    userEmail: 'p',

    // Account Information fields
    emailAddressLabel: 'Email Address',
    displayNameLabel: 'Display Name',

    // Role badges
    roleBadges: '[data-testid="role-badge"], .MuiChip-root, [class*="role"], [class*="badge"]',

    // Profile cards
    profileCard: '[class*="gradient"], [class*="profile-card"], .MuiCard-root',
    infoCards: '.MuiCard-root, [class*="card"]'
} as const

export const PROFILE_LABELS = {
    emailAddress: 'Email Address',
    displayName: 'Display Name',
    organization: 'Organization',
    subscriptionStatus: 'Subscription Status',
    freePlan: 'Free Plan',
    upgradePlan: 'Upgrade Plan'
} as const
