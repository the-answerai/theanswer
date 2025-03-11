#!/usr/bin/env node

/**
 * Enhanced dev script with dashboard-style logging
 *
 * This script provides a clean status dashboard for your development environment
 * showing only critical information and the status of each component.
 */

// Required modules
const path = require('node:path')
const fs = require('node:fs')
const { spawn } = require('node:child_process')

// Load environment variables from .env file
try {
    // Try to load .env file from monorepo root
    const findRootDir = (startDir) => {
        // Look for package.json that contains "theanswer"
        let currentDir = startDir
        while (currentDir !== '/') {
            try {
                const packageJsonPath = path.join(currentDir, 'package.json')
                if (fs.existsSync(packageJsonPath)) {
                    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
                    if (packageJson.name === 'theanswer') {
                        return currentDir
                    }
                }
            } catch (e) {
                // Ignore errors and continue searching up
            }
            currentDir = path.dirname(currentDir)
        }
        return startDir // Return original directory if root not found
    }

    const rootDir = findRootDir(process.cwd())
    const envPath = path.join(rootDir, '.env')

    if (fs.existsSync(envPath)) {
        console.log(`Loading environment variables from ${envPath}`)
        require('dotenv').config({ path: envPath })
    } else {
        console.log('No .env file found in monorepo root, continuing without it')
    }
} catch (error) {
    console.error('Error loading environment variables:', error.message)
}

// Status indicators
const STATUS = {
    WAITING: '🔄',
    SUCCESS: '✅',
    ERROR: '❌',
    WARNING: '⚠️',
    INFO: 'ℹ️',
    RUNNING: '🟢',
    STOPPED: '🔴'
}

// Define emojis for different events
const EMOJIS = {
    INFO: 'ℹ️',
    SUCCESS: '✅',
    ERROR: '❌',
    WARNING: '⚠️',
    ENV_CHECK: '🔐',
    DB_CONNECTED: '🗃️',
    API_READY: '🚀',
    SERVER_START: '🖥️',
    APP_STARTUP: '🔼',
    LISTEN: '👂',
    SERVER: '🖥️',
    DATABASE: '🗃️',
    LINK: '🔗',
    DOCS: '📚',
    WEB: '🌐',
    WELCOME: '👋'
}

// Tracked services with their status
const SERVICES = [
    { name: 'Database', emoji: EMOJIS.DATABASE, status: STATUS.WAITING, details: 'Waiting for connection', updated: false },
    { name: 'Web Server', emoji: EMOJIS.SERVER, status: STATUS.WAITING, details: 'Starting...', updated: false },
    { name: 'Flowise', emoji: EMOJIS.SERVER, status: STATUS.WAITING, details: 'Starting...', updated: false },
    { name: 'Redis', emoji: '🔄', status: STATUS.WAITING, details: 'Starting...', updated: false },
    { name: 'PostgreSQL', emoji: '🔄', status: STATUS.WAITING, details: 'Starting...', updated: false },
    { name: 'API', emoji: EMOJIS.API_READY, status: STATUS.WAITING, details: 'Starting...', updated: false }
]

// Tracked packages with their statuses
const PACKAGES = [
    { name: 'Logger', status: STATUS.WAITING, updated: false },
    { name: 'Embed', status: STATUS.WAITING, updated: false },
    { name: 'Database', status: STATUS.WAITING, updated: false },
    { name: 'Web', status: STATUS.WAITING, updated: false },
    { name: 'Flowise', status: STATUS.WAITING, updated: false },
    { name: 'UI', status: STATUS.WAITING, updated: false },
    { name: 'Types', status: STATUS.WAITING, updated: false }
]

// Important events to track and display (only critical ones)
const IMPORTANT_EVENTS = []
const MAX_IMPORTANT_EVENTS = 5 // Limit number of displayed events

// Links to services
const LINKS = {
    webUrl: null,
    apiUrl: null,
    flowiseUrl: null,
    docsUrl: null,
    uiUrl: null
}

// Default API URLs to use if not detected from logs
const DEFAULT_PORTS = {
    api: 3001,
    flowise: 4000,
    docs: 4242
}

// Welcome message shown state
let welcomeMessageShown = false

// Required environment variables to check
const REQUIRED_ENV_VARS = [
    'DATABASE_URL',
    'AUTH_SECRET',
    'AUTH0_BASE_URL',
    'AUTH0_ISSUER_BASE_URL',
    'AUTH0_CLIENT_ID',
    'AUTH0_CLIENT_SECRET',
    'NEXT_PUBLIC_BASE_URL'
]

// Color helpers
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',

    fg: {
        red: '\x1b[31m',
        green: '\x1b[32m',
        yellow: '\x1b[33m',
        blue: '\x1b[34m',
        magenta: '\x1b[35m',
        cyan: '\x1b[36m',
        white: '\x1b[37m'
    }
}

// Pattern matchers for service status updates
const SERVICE_MATCHERS = [
    {
        service: 'Database',
        patterns: [/Database connected/i, /Prisma Client Generated/i, /Container theanswer-postgres-1\s+Running/i],
        successDetails: 'Connected and running'
    },
    {
        service: 'PostgreSQL',
        patterns: [/Container theanswer-postgres-1\s+Running/i],
        successDetails: 'Container running'
    },
    {
        service: 'Redis',
        patterns: [/Container theanswer-redis-1\s+Running/i],
        successDetails: 'Container running'
    },
    {
        service: 'Web Server',
        patterns: [/ready in/i, /ready - started/i, /compiled client and server/i],
        successDetails: 'Server ready'
    },
    {
        service: 'Flowise',
        patterns: [/Initializing Flowise/i, /API server is running/i, /Server listening/i],
        successDetails: 'Server running'
    },
    {
        service: 'API',
        patterns: [
            /API server is running/i,
            /Server listening/i,
            /Listening on/i,
            /ready.*api/i,
            /api.*ready/i,
            /server ready/i,
            /server started/i,
            /app listening.*port \d+/i
        ],
        successDetails: 'API endpoints available'
    }
]

// Package matchers
const PACKAGE_MATCHERS = [
    {
        package: 'Logger',
        patterns: [/@answers\/logger:(?:dev|build):/i, /Found 0 errors/i]
    },
    {
        package: 'Embed',
        patterns: [/aai-embed:(?:dev|build):/i, /aai-embed-react:(?:dev|build):/i]
    },
    {
        package: 'Database',
        patterns: [/db:(?:dev|build):/i]
    },
    {
        package: 'Web',
        patterns: [/web:(?:dev|build):/i]
    },
    {
        package: 'Flowise',
        patterns: [/flowise:(?:dev|build):/i, /flowise-components:(?:dev|build):/i, /flowise-ui:(?:dev|build):/i]
    },
    {
        package: 'UI',
        patterns: [/ui:(?:dev|build):/i]
    },
    {
        package: 'Types',
        patterns: [/types:(?:dev|build):/i]
    }
]

// URL matchers to extract web, API, and UI URLs
const URL_MATCHERS = [
    {
        type: 'webUrl',
        patterns: [
            /Ready on (https?:\/\/[^\s]+)/i,
            /started server on (https?:\/\/[^\s]+)/i,
            /ready - started server on (https?:\/\/[^\s]+)/i,
            /ready in.*?\s(https?:\/\/[^\s]+)/i,
            /Web app running at (https?:\/\/[^\s]+)/i,
            /Web server started at (https?:\/\/[^\s]+)/i,
            /localhost:3000/i
        ]
    },
    {
        type: 'apiUrl',
        patterns: [
            /API server is running on (https?:\/\/[^\s]+)/i,
            /Server listening on (https?:\/\/[^\s]+)/i,
            /Listening on (https?:\/\/[^\s]+)/i,
            /API running at (https?:\/\/[^\s]+)/i,
            /API available at (https?:\/\/[^\s]+)/i,
            /api.*localhost:(\d+)/i,
            /server started.*:(\d+)/i,
            /app listening.*port (\d+)/i,
            /localhost:3001/i
        ]
    },
    {
        type: 'flowiseUrl',
        patterns: [
            /API server is running at (https?:\/\/[^\s]+)/i,
            /Flowise is running at (https?:\/\/[^\s]+)/i,
            /Flowise UI: (https?:\/\/[^\s]+)/i,
            /flowise.*localhost:(\d+)/i,
            /localhost:4000/i
        ]
    },
    {
        type: 'docsUrl',
        patterns: [
            /Documentation site running at (https?:\/\/[^\s]+)/i,
            /Docs available at (https?:\/\/[^\s]+)/i,
            /VitePress site running at (https?:\/\/[^\s]+)/i,
            /docs.*localhost:(\d+)/i,
            /vitepress.*localhost:(\d+)/i,
            /localhost:5173/i
        ]
    },
    {
        type: 'uiUrl',
        patterns: [/Local:\s+(https?:\/\/[^\s]+)/i, /UI available at (https?:\/\/[^\s]+)/i, /ui.*localhost:(\d+)/i]
    }
]

// Patterns to filter out from logs (to suppress noise)
const FILTER_PATTERNS = [
    // Deprecation warnings
    /DeprecationWarning/i,
    /deprecated/i,
    /\[DEP\d+\]/i,
    /Use.*trace-deprecation/i,

    // Engine warnings
    /Unsupported engine/i,
    /WARN.*wanted/i,

    // Other noisy warnings that aren't critical
    /punycode module is deprecated/i,
    /No docs found/i,
    /can't auto-generate a sidebar/i,
    /treating module as external dependency/i,

    // Webpack related noise
    /webpack.Progress/i,
    /Compiled successfully/i,
    /compiled client and server successfully/i,
    /module not found/i,
    /webpack compiled/i,
    /HMR/i,
    /hot module replacement/i,

    // Typescript noise
    /tsc --watch/i,
    /File change detected/i,

    // ESLint noise
    /eslint --cache/i,

    // Pnpm and npm warnings
    /pnpm/i,
    /npm/i,
    /yarn/i,
    /package manager/i,

    // Other warnings that don't indicate real problems
    /Watching for file changes/i,
    /watching directory/i,
    /waiting for file changes/i,
    /to restart at any time/i
]

// Special patterns that indicate important events we should always display
const IMPORTANT_PATTERNS = [
    // Errors and failures (but not webpack errors or common build-time errors)
    /\b(error|failed|crashed|exception)(?!.*(?:webpack|eslint|tsc|node_modules))/i,

    // Database connections
    /Database connected/i,
    /Prisma Schema loaded/i,

    // Container statuses
    /Container .* Running/i,

    // Server starts
    /Server listening/i,
    /Listening on/i,
    /API server is running/i,

    // Actual application errors (not build tool errors)
    /Uncaught exception/i,
    /Unhandled promise rejection/i,
    /EADDRINUSE/i,
    /Cannot find module/i,
    /Unauthorized/i
]

// Initial setup done flag
let initialSetupDone = false

// Keep track of last dashboard display time
let lastDashboardUpdate = 0
const DASHBOARD_REFRESH_RATE = 1000 // Only update dashboard every second maximum

// Terminal width calculation
const getTerminalWidth = () => {
    return process.stdout.columns || 80
}

// Pad a string to a specific length
const padString = (str, length, padChar = ' ') => {
    if (str.length >= length) return str
    return str + padChar.repeat(length - str.length)
}

// Clear the terminal and set cursor to top
function clearTerminal() {
    // Use ANSI escape codes to clear screen and move cursor to top-left
    process.stdout.write('\x1b[2J\x1b[0f')
}

// Check if required environment variables are present
function checkEnvironmentVariables() {
    let allPresent = true
    const missingVars = []

    for (const envVar of REQUIRED_ENV_VARS) {
        const value = process.env[envVar]

        if (!value) {
            allPresent = false
            missingVars.push(envVar)
        }
    }

    return { allPresent, missingVars }
}

// Check if all critical services are running
function areServicesReady() {
    const criticalServices = ['Web Server', 'API', 'Flowise']
    for (const serviceName of criticalServices) {
        const service = SERVICES.find((s) => s.name === serviceName)
        if (!service || service.status !== STATUS.RUNNING) {
            return false
        }
    }
    return true
}

// Infer default URLs based on available services
function inferDefaultUrls() {
    // Set default API URL if API service is running but no URL was found in logs
    if (!LINKS.apiUrl) {
        const apiService = SERVICES.find((s) => s.name === 'API')
        if (apiService && apiService.status === STATUS.RUNNING) {
            LINKS.apiUrl = `http://localhost:${DEFAULT_PORTS.api}`
        }
    }

    // Set default Flowise URL if Flowise service is running but no URL was found in logs
    if (!LINKS.flowiseUrl) {
        const flowiseService = SERVICES.find((s) => s.name === 'Flowise')
        if (flowiseService && flowiseService.status === STATUS.RUNNING) {
            LINKS.flowiseUrl = `http://localhost:${DEFAULT_PORTS.flowise}`
        }
    }

    // Set default Docs URL if docs aren't found in logs
    if (!LINKS.docsUrl) {
        LINKS.docsUrl = `http://localhost:${DEFAULT_PORTS.docs}`
    }
}

// Update a service's status
function updateServiceStatus(serviceName, isSuccess, details = null) {
    const service = SERVICES.find((s) => s.name === serviceName)
    if (service) {
        const oldStatus = service.status
        const oldDetails = service.details

        service.status = isSuccess ? STATUS.RUNNING : STATUS.ERROR
        if (details) {
            service.details = details
        }

        // Mark as updated if status or details changed
        service.updated = oldStatus !== service.status || oldDetails !== service.details

        // If we're marking API or Flowise as running, make sure we update URLs
        if (isSuccess && (serviceName === 'API' || serviceName === 'Flowise' || serviceName === 'Web Server')) {
            inferDefaultUrls()
        }

        return true
    }
    return false
}

// Update a package's status
function updatePackageStatus(packageName, isSuccess) {
    const pkg = PACKAGES.find((p) => p.name === packageName)
    if (pkg) {
        const oldStatus = pkg.status
        pkg.status = isSuccess ? STATUS.SUCCESS : STATUS.ERROR

        // Mark as updated if status changed
        pkg.updated = oldStatus !== pkg.status

        return true
    }
    return false
}

// Update URL links
function updateUrl(type, url) {
    if (LINKS[type] !== url) {
        LINKS[type] = url
        return true
    }
    return false
}

// Print the welcome message when all services are ready
function printWelcomeMessage() {
    const boxWidth = getTerminalWidth() - 4
    const message = 'Welcome to TheAnswer Development Environment!'

    console.log(`┌${'─'.repeat(boxWidth)}┐`)
    console.log(
        `│ ${colors.bright}${colors.fg.cyan}${EMOJIS.WELCOME} ${message}${colors.reset}${' '.repeat(boxWidth - message.length - 4)}│`
    )
    console.log(`│ ${' '.repeat(boxWidth)}│`)
    console.log(`│ ${colors.fg.green}All services are running and ready for development.${colors.reset}${' '.repeat(boxWidth - 50)}│`)
    console.log(`└${'─'.repeat(boxWidth)}┘`)
}

// Print the main dashboard
function printDashboard() {
    // Don't update too frequently to avoid flickering
    const now = Date.now()
    if (now - lastDashboardUpdate < DASHBOARD_REFRESH_RATE && initialSetupDone) {
        return
    }
    lastDashboardUpdate = now

    // Clear screen and display fresh content
    clearTerminal()

    // Print header
    console.log(`${colors.bright}${colors.fg.cyan}THEANSWER DEVELOPMENT DASHBOARD${colors.reset}`)
    console.log(`${colors.dim}${new Date().toLocaleTimeString()}${colors.reset}`)
    console.log('═'.repeat(getTerminalWidth()))

    // Print services and packages side by side in a more compact format
    const termWidth = getTerminalWidth()
    const halfWidth = Math.floor(termWidth / 2) - 2

    // Headers
    console.log(
        `${colors.bright}${colors.fg.blue}SERVICES${colors.reset}${' '.repeat(halfWidth - 5)}${colors.bright}${colors.fg.blue}PACKAGES${
            colors.reset
        }`
    )

    // Services and Packages side by side, with better formatting
    const servicesChunks = []
    for (let i = 0; i < SERVICES.length; i++) {
        const service = SERVICES[i]
        const statusColor =
            service.status === STATUS.RUNNING ? colors.fg.green : service.status === STATUS.ERROR ? colors.fg.red : colors.fg.yellow

        servicesChunks.push(`${service.status} ${statusColor}${service.name}${colors.reset}`)
    }

    const packagesChunks = []
    for (let i = 0; i < PACKAGES.length; i++) {
        const pkg = PACKAGES[i]
        const statusColor = pkg.status === STATUS.SUCCESS ? colors.fg.green : pkg.status === STATUS.ERROR ? colors.fg.red : colors.fg.yellow

        packagesChunks.push(`${pkg.status} ${statusColor}${pkg.name}${colors.reset}`)
    }

    // Print services and packages side by side
    const maxLines = Math.max(servicesChunks.length, packagesChunks.length)
    for (let i = 0; i < maxLines; i++) {
        const serviceOutput = i < servicesChunks.length ? servicesChunks[i] : ''
        const packageOutput = i < packagesChunks.length ? packagesChunks[i] : ''

        console.log(`${padString(serviceOutput, halfWidth)}${packageOutput}`)
    }

    // Display welcome message if all services are ready and it hasn't been shown yet
    if (areServicesReady() && !welcomeMessageShown) {
        welcomeMessageShown = true
        console.log('\n')
        printWelcomeMessage()
    }

    // Ensure URLs are inferred if they weren't found in logs but services are running
    inferDefaultUrls()

    // Print URLs section with better formatting
    const hasUrls = LINKS.webUrl || LINKS.apiUrl || LINKS.flowiseUrl || LINKS.uiUrl || LINKS.docsUrl
    if (hasUrls) {
        console.log(`\n${'─'.repeat(getTerminalWidth())}`)
        console.log(`${colors.bright}${colors.fg.blue}AVAILABLE ENDPOINTS${colors.reset}`)

        if (LINKS.webUrl) {
            console.log(`${EMOJIS.WEB} ${colors.fg.cyan}Web App:${colors.reset}    ${colors.bright}${LINKS.webUrl}${colors.reset}`)
        }

        if (LINKS.apiUrl) {
            console.log(`${EMOJIS.API_READY} ${colors.fg.cyan}API:${colors.reset}        ${colors.bright}${LINKS.apiUrl}${colors.reset}`)
        }

        if (LINKS.flowiseUrl) {
            console.log(`${EMOJIS.SERVER} ${colors.fg.cyan}Flowise:${colors.reset}    ${colors.bright}${LINKS.flowiseUrl}${colors.reset}`)
        }

        if (LINKS.uiUrl) {
            console.log(`${EMOJIS.INFO} ${colors.fg.cyan}UI:${colors.reset}         ${colors.bright}${LINKS.uiUrl}${colors.reset}`)
        }

        if (LINKS.docsUrl) {
            console.log(`${EMOJIS.DOCS} ${colors.fg.cyan}Docs:${colors.reset}       ${colors.bright}${LINKS.docsUrl}${colors.reset}`)
        }
    }

    // Show missing environment variables if any
    const { allPresent, missingVars } = checkEnvironmentVariables()
    if (!allPresent) {
        console.log(`\n${'─'.repeat(getTerminalWidth())}`)
        console.log(
            `${STATUS.WARNING} ${colors.fg.yellow}${colors.bright}Missing environment variables:${colors.reset} ${missingVars.join(', ')}`
        )
    }

    // Show the latest important events
    if (IMPORTANT_EVENTS.length > 0) {
        console.log(`\n${'─'.repeat(getTerminalWidth())}`)
        console.log(`${colors.bright}${colors.fg.blue}IMPORTANT EVENTS${colors.reset}`)

        // Show only the latest few events
        const eventsToShow = IMPORTANT_EVENTS.slice(-MAX_IMPORTANT_EVENTS)
        for (const event of eventsToShow) {
            console.log(event)
        }
    }

    // First-time info
    if (!initialSetupDone) {
        initialSetupDone = true
        console.log(`\n${'─'.repeat(getTerminalWidth())}`)
        console.log(`${colors.dim}(Press Ctrl+C to stop the development server)${colors.reset}`)
    }
}

// Check if a line contains an important pattern we should display
function isImportantEvent(line) {
    return IMPORTANT_PATTERNS.some((pattern) => pattern.test(line))
}

// Check if a line should be filtered (noisy or non-critical)
function shouldFilter(line) {
    return FILTER_PATTERNS.some((pattern) => pattern.test(line))
}

// Extract URLs from log lines
function extractUrls(line) {
    for (const matcher of URL_MATCHERS) {
        for (const pattern of matcher.patterns) {
            const match = line.match(pattern)
            if (match?.[1]) {
                // Some patterns might extract just a port number
                const isPort = !match[1].includes('://')
                if (isPort) {
                    const port = match[1]
                    updateUrl(matcher.type, `http://localhost:${port}`)
                } else {
                    updateUrl(matcher.type, match[1])
                }
                return true
            }
        }
    }

    // Additional explicit checks for common port mentions
    if (line.includes('localhost:3000') || line.includes('127.0.0.1:3000')) {
        updateUrl('webUrl', 'http://localhost:3000')
        return true
    }

    if (line.includes('localhost:3001') || line.includes('127.0.0.1:3001')) {
        updateUrl('apiUrl', 'http://localhost:3001')
        return true
    }

    if (line.includes('localhost:4000') || line.includes('127.0.0.1:4000')) {
        updateUrl('flowiseUrl', 'http://localhost:4000')
        return true
    }

    if (line.includes('localhost:5173') || line.includes('127.0.0.1:5173')) {
        updateUrl('docsUrl', 'http://localhost:5173')
        return true
    }

    return false
}

// Process a log line for status updates
function processLogLine(line) {
    // Skip lines that match our filter patterns
    if (shouldFilter(line)) {
        return
    }

    // Check for service status updates
    for (const matcher of SERVICE_MATCHERS) {
        if (matcher.patterns.some((pattern) => pattern.test(line))) {
            updateServiceStatus(matcher.service, true, matcher.successDetails)
        }
    }

    // Check for package status updates
    for (const matcher of PACKAGE_MATCHERS) {
        if (matcher.patterns.some((pattern) => pattern.test(line))) {
            updatePackageStatus(matcher.package, true)
        }
    }

    // Extract URLs
    extractUrls(line)

    // Special case for docs site URLs (often in a different format)
    if (line.match(/VitePress.*?http/i) || line.match(/docs.*?ready/i)) {
        const urlMatch = line.match(/(https?:\/\/[^\s]+)/i)
        if (urlMatch?.[1]) {
            updateUrl('docsUrl', urlMatch[1])
        }
    }

    // Special case for common server indicators
    if (line.includes('ready') || line.includes('started') || line.includes('listening')) {
        if (line.includes('api') || line.includes('API') || line.includes('server')) {
            inferDefaultUrls()
        }
    }

    // Check if this is an important event to display
    if (isImportantEvent(line)) {
        let formattedLine = line

        // Add emojis and colors for specific types of events
        if (line.match(/error|Error:|ERROR|Failed|Could not/i)) {
            formattedLine = `${STATUS.ERROR} ${colors.fg.red}${line}${colors.reset}`
        } else if (line.match(/warn|warning/i)) {
            formattedLine = `${STATUS.WARNING} ${colors.fg.yellow}${line}${colors.reset}`
        } else if (line.match(/success|ready|connected|listening|running|started/i)) {
            formattedLine = `${STATUS.SUCCESS} ${colors.fg.green}${line}${colors.reset}`
        }

        // Add to important events
        IMPORTANT_EVENTS.push(formattedLine)

        // Refresh the display
        printDashboard()
    }
}

// Set up auto-refresh of dashboard at regular intervals
function setupAutoRefresh() {
    return setInterval(() => {
        printDashboard()
    }, 2000) // Refresh every 2 seconds
}

// Main function to run the development server with dashboard logging
function runDevWithDashboardLogging() {
    // Initial dashboard
    printDashboard()

    // Set up auto-refresh
    const refreshInterval = setupAutoRefresh()

    // Get command and arguments from package.json or use defaults
    const devCommand = 'pnpm'
    const devArgs = ['run', 'dev:original']

    // Pass all loaded environment variables to the child process
    console.log('Starting development server... (this dashboard will automatically update)')

    // Set environment variables to suppress warnings
    const enhancedEnv = {
        ...process.env,
        // Suppress Node.js warnings (including deprecation warnings)
        NODE_NO_WARNINGS: '1',
        // Set Node options to hide experimental warnings
        NODE_OPTIONS: '--no-warnings'
    }

    // Spawn the original dev command
    const devProcess = spawn(devCommand, devArgs, {
        cwd: process.cwd(),
        env: enhancedEnv, // Use enhanced environment with warning suppressions
        stdio: ['inherit', 'pipe', 'pipe']
    })

    // Handle stdout
    devProcess.stdout.on('data', (data) => {
        const lines = data.toString().split('\n')

        for (const line of lines) {
            if (line.trim()) {
                processLogLine(line)
            }
        }
    })

    // Handle stderr
    devProcess.stderr.on('data', (data) => {
        const lines = data.toString().split('\n')

        for (const line of lines) {
            if (line.trim()) {
                // Skip filtered lines
                if (shouldFilter(line)) {
                    continue
                }

                // Mark as error and process
                const errorLine = `ERROR: ${line}`
                processLogLine(errorLine)
            }
        }
    })

    // Handle process exit
    devProcess.on('close', (code) => {
        if (code === 0) {
            IMPORTANT_EVENTS.push(`${STATUS.SUCCESS} ${colors.fg.green}Development server stopped successfully${colors.reset}`)
        } else {
            IMPORTANT_EVENTS.push(`${STATUS.ERROR} ${colors.fg.red}Development server exited with code ${code}${colors.reset}`)
        }

        // Final dashboard update
        printDashboard()

        // Clear the refresh interval
        clearInterval(refreshInterval)
    })

    // Handle SIGINT (Ctrl+C)
    process.on('SIGINT', () => {
        IMPORTANT_EVENTS.push(`${STATUS.INFO} ${colors.fg.cyan}Shutting down development server...${colors.reset}`)
        printDashboard()

        // Clear the refresh interval
        clearInterval(refreshInterval)

        devProcess.kill('SIGINT')
    })
}

// Run the script
runDevWithDashboardLogging()
