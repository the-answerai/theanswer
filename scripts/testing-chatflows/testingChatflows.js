/**
 * Chatflow Testing Script
 *
 * This script tests chatflows by making API requests to each chatflow ID listed in a JS file.
 * All chatflows must use the conversation format (multi-turn with optional files).
 *
 * IMPORTANT: This script maintains conversation context across turns within the same chatflow
 * by using sessionId. Each turn in a conversation will remember previous interactions.
 *
 * Required Environment Variables:
 * -----------------------------
 * TESTING_CHATFLOWS_API_URL - Base URL for the API (e.g., https://prod.studio.theanswer.ai/) [Takes precedence]
 * API_HOST - Backup/fallback base URL for the API (used if TESTING_CHATFLOWS_API_URL is not set)
 * TESTING_CHATFLOWS_AUTH_TOKEN - Bearer token for authentication
 * TESTING_CHATFLOWS_REQUEST_DELAY_MS - Delay between requests in milliseconds (e.g., 50)
 *
 * Command Line Options:
 * -------------------
 * --file, -f: Path to JS file (default: ./chatflows.js)
 * --all, -a: Run all chatflows without interactive selection
 * --ids, -i: Comma-separated list of chatflow IDs/names to run (bypasses interactive selection)
 * --no-delay: Disable delay between requests
 * --retries, -r: Number of retry attempts (default: 2)
 * --timeout, -t: Request timeout in milliseconds (default: 30000)
 * --output, -o: Save results to JSON file
 * --verbose, -v: Enable detailed logging (includes session IDs)
 * --no-error-detection: Disable error detection in responses
 * --help, -h: Show help
 *
 * JS File Format:
 * --------------
 * module.exports = [
 *   {
 *     id: '...',
 *     internalName: '...',
 *     conversation: [
 *       {
 *         input: 'First message',
 *         files: [
 *           { path: './assets/image.png', type: 'image/png' }
 *         ]
 *       },
 *       {
 *         input: 'Follow-up message',
 *         files: []
 *       }
 *     ]
 *   }
 * ]
 *
 * Interactive Selection:
 * ---------------------
 * By default, the script will show an interactive menu to select which chatflows to run:
 * - Run all chatflows
 * - Select specific chatflows (checkbox interface with arrow keys)
 * - Run a single chatflow (list interface with arrow keys)
 *
 * After selection, you'll be prompted to choose output verbosity:
 * - Summary mode: Clean, minimal output with just success/failure status
 * - Verbose mode: Detailed responses, session IDs, and full error information
 *
 * Use --all flag to bypass interactive selection and run all chatflows
 * Use --ids flag to specify chatflow IDs/names to run (comma-separated)
 * Use --verbose flag to force verbose output mode
 */

const fs = require('fs')
const path = require('path')
const axios = require('axios')
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const inquirer = require('inquirer')
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') })

// Error detection configuration
const ERROR_DETECTION_CONFIG = {
    // Critical error patterns (case-insensitive)
    critical: [
        'internal server error',
        'internal error',
        'server error',
        'fatal error',
        'critical error',
        'system error',
        'database error',
        'connection error',
        'timeout error',
        'out of memory',
        'memory error',
        'stack overflow',
        'segmentation fault',
        'null pointer',
        'access denied',
        'unauthorized',
        'forbidden',
        'authentication failed',
        'permission denied'
    ],
    // Warning patterns (case-insensitive)
    warnings: [
        'warning',
        'deprecated',
        'invalid',
        'not found',
        'missing',
        'failed',
        'error',
        'exception',
        'unable to',
        'cannot',
        'could not',
        'unavailable',
        'maintenance',
        'temporary',
        'retry',
        'timeout',
        'rate limit',
        'quota exceeded',
        'api limit',
        'service unavailable',
        'bad request',
        'malformed',
        'invalid format',
        'parse error',
        'syntax error'
    ],
    // Suspicious patterns that might indicate issues
    suspicious: [
        'please try again',
        'something went wrong',
        'an error occurred',
        'unexpected',
        'unknown error',
        'please contact',
        'support',
        'technical issue',
        'maintenance mode',
        'service down',
        'temporarily unavailable',
        'please wait',
        'loading',
        'processing',
        'placeholder',
        'todo',
        'fixme',
        'hack',
        'workaround',
        'temp',
        'debug',
        'test',
        'lorem ipsum'
    ],
    // HTML/XML error indicators
    markup: [
        '<error',
        '<exception',
        '<fault',
        'error code',
        'error message',
        'stack trace',
        'backtrace',
        'line number',
        'file not found',
        '404',
        '500',
        '502',
        '503',
        '504'
    ]
}

// Parse command line arguments
const argv = yargs(hideBin(process.argv))
    .option('file', {
        alias: 'f',
        description: 'Path to JS file (module.exports = [...])',
        type: 'string',
        default: path.join(__dirname, 'chatflows.js')
    })
    .option('all', {
        alias: 'a',
        description: 'Run all chatflows without interactive selection',
        type: 'boolean',
        default: false
    })
    .option('ids', {
        alias: 'i',
        description: 'Comma-separated list of chatflow IDs to run (bypasses interactive selection)',
        type: 'string'
    })
    .option('no-delay', {
        description: 'Disable delay between requests',
        type: 'boolean',
        default: false
    })
    .option('retries', {
        alias: 'r',
        description: 'Number of retries for failed requests',
        type: 'number',
        default: 2
    })
    .option('timeout', {
        alias: 't',
        description: 'Request timeout in milliseconds',
        type: 'number',
        default: 30000
    })
    .option('output', {
        alias: 'o',
        description: 'Output file path for results',
        type: 'string'
    })
    .option('verbose', {
        alias: 'v',
        description: 'Run with verbose logging',
        type: 'boolean',
        default: false
    })
    .option('no-error-detection', {
        description: 'Disable error detection in responses',
        type: 'boolean',
        default: false
    })
    .help()
    .alias('help', 'h').argv

// Utility function to create delay
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Utility function to format duration
const formatDuration = (ms) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    return `${minutes}m ${seconds % 60}s`
}

// Utility function to extract UUID from URL or string
const extractUUID = (input) => {
    // UUID regex pattern
    const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
    const match = input.match(uuidPattern)
    return match ? match[0] : input
}

// Function to detect potential errors in response text
function detectErrors(responseText) {
    if (!responseText || typeof responseText !== 'string' || argv['no-error-detection']) {
        return {
            hasIssues: false,
            critical: [],
            warnings: [],
            suspicious: [],
            markup: []
        }
    }

    const lowerText = responseText.toLowerCase()
    const detected = {
        critical: [],
        warnings: [],
        suspicious: [],
        markup: []
    }

    // Check each category
    Object.keys(ERROR_DETECTION_CONFIG).forEach((category) => {
        ERROR_DETECTION_CONFIG[category].forEach((pattern) => {
            if (lowerText.includes(pattern.toLowerCase())) {
                detected[category].push(pattern)
            }
        })
    })

    const hasIssues = Object.values(detected).some((arr) => arr.length > 0)

    return {
        hasIssues,
        ...detected,
        totalIssues: Object.values(detected).reduce((sum, arr) => sum + arr.length, 0)
    }
}

// Function to format error detection results for display
function formatErrorDetection(errorInfo) {
    if (!errorInfo.hasIssues) {
        return ''
    }

    const parts = []

    if (errorInfo.critical.length > 0) {
        parts.push(`🚨 CRITICAL: ${errorInfo.critical.join(', ')}`)
    }

    if (errorInfo.warnings.length > 0) {
        parts.push(`⚠️  WARNINGS: ${errorInfo.warnings.join(', ')}`)
    }

    if (errorInfo.suspicious.length > 0) {
        parts.push(`🔍 SUSPICIOUS: ${errorInfo.suspicious.join(', ')}`)
    }

    if (errorInfo.markup.length > 0) {
        parts.push(`📄 MARKUP: ${errorInfo.markup.join(', ')}`)
    }

    return parts.join('\n  ')
}

// Function to get error detection summary icon
function getErrorSummaryIcon(errorInfo) {
    if (!errorInfo.hasIssues) return ''
    if (errorInfo.critical.length > 0) return '🚨'
    if (errorInfo.warnings.length > 0) return '⚠️'
    if (errorInfo.suspicious.length > 0) return '🔍'
    if (errorInfo.markup.length > 0) return '📄'
    return '⚠️'
}

// Function to read and encode file as base64
function readFileAsBase64(filePath) {
    try {
        // Resolve path relative to current working directory
        const fullPath = path.resolve(process.cwd(), filePath)
        if (!fs.existsSync(fullPath)) {
            throw new Error(`File not found: ${fullPath}`)
        }
        const fileBuffer = fs.readFileSync(fullPath)
        return fileBuffer.toString('base64')
    } catch (error) {
        throw new Error(`Failed to read file ${filePath}: ${error.message}`)
    }
}

// Function to process files array and encode them
function processFiles(files) {
    if (!files || !Array.isArray(files) || files.length === 0) {
        return []
    }

    return files.map((file) => {
        if (!file.path) {
            throw new Error('File object must have a path property')
        }

        const fileName = path.basename(file.path)
        const base64Data = readFileAsBase64(file.path)
        const mimeType = file.type || 'application/octet-stream'

        // Format as data URI expected by the API
        const dataUri = `data:${mimeType};base64,${base64Data}`

        return {
            type: 'file',
            name: fileName,
            data: dataUri,
            mime: mimeType
        }
    })
}

// Function to get base URL with fallback logic
function getBaseUrl() {
    // TESTING_CHATFLOWS_API_URL takes precedence over API_HOST
    const apiUrl = process.env.TESTING_CHATFLOWS_API_URL || process.env.API_HOST

    if (!apiUrl) {
        throw new Error('Neither TESTING_CHATFLOWS_API_URL nor API_HOST environment variable is set')
    }

    return apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl
}

// Function to interactively select chatflows
async function selectChatflows(chatflowsData) {
    console.log('\n🎯 Chatflow Selection\n')

    // Create choices with enhanced display
    const choices = chatflowsData.map((cf, index) => {
        const chatflowId = extractUUID(cf.id)
        const internalName = cf.internalName || 'Unnamed'
        const turnCount = cf.conversation?.length || 0

        return {
            name: `${internalName} (${chatflowId}) - ${turnCount} turns`,
            value: index,
            short: internalName
        }
    })

    const answers = await inquirer.prompt([
        {
            type: 'list',
            name: 'selectionMode',
            message: 'How would you like to select chatflows?',
            choices: [
                { name: '🚀 Run all chatflows', value: 'all' },
                { name: '🎯 Select specific chatflows', value: 'select' },
                { name: '📝 Run a single chatflow', value: 'single' }
            ]
        }
    ])

    let selectedChatflows

    switch (answers.selectionMode) {
        case 'all':
            selectedChatflows = chatflowsData
            break

        case 'single': {
            const singleAnswer = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'selectedChatflow',
                    message: 'Select a chatflow to run:',
                    choices: choices,
                    pageSize: Math.min(choices.length, 15)
                }
            ])
            selectedChatflows = [chatflowsData[singleAnswer.selectedChatflow]]
            break
        }

        case 'select': {
            const multipleAnswer = await inquirer.prompt([
                {
                    type: 'checkbox',
                    name: 'selectedChatflows',
                    message: 'Select chatflows to run (use Space to select, Enter to confirm):',
                    choices: choices,
                    pageSize: Math.min(choices.length, 15),
                    validate: (input) => {
                        if (input.length === 0) {
                            return 'Please select at least one chatflow'
                        }
                        return true
                    }
                }
            ])
            selectedChatflows = multipleAnswer.selectedChatflows.map((index) => chatflowsData[index])
            break
        }

        default:
            throw new Error('Invalid selection mode')
    }

    // Ask about output verbosity
    const verbosityAnswer = await inquirer.prompt([
        {
            type: 'list',
            name: 'outputLevel',
            message: 'Choose output level:',
            choices: [
                { name: '📋 Summary mode (clean, minimal output)', value: 'summary' },
                { name: '🔍 Verbose mode (detailed responses and logs)', value: 'verbose' }
            ]
        }
    ])

    return {
        chatflows: selectedChatflows,
        verboseOutput: verbosityAnswer.outputLevel === 'verbose'
    }
}

async function getChatflowName(chatflowId) {
    try {
        // Build the chatflows API URL from the base URL
        const baseUrl = getBaseUrl()
        const response = await axios.get(
            `${baseUrl}/api/v1/chatflows/${chatflowId}`, // Note: it's 'chatflows' not 'chatflow'
            {
                headers: {
                    Authorization: `Bearer ${process.env.TESTING_CHATFLOWS_AUTH_TOKEN}`
                },
                timeout: argv.timeout
            }
        )
        // The name is in the response.data.name field according to Flowise API docs
        return response.data.name || 'Unknown Name'
    } catch (error) {
        if (error.response?.status === 404) {
            console.error(`⚠️  Chatflow ${chatflowId} not found`)
        } else {
            console.error(`⚠️  Failed to fetch name for chatflow ${chatflowId}:`, error.message)
        }
        return 'Unknown Name'
    }
}

async function testChatflowTurn(chatflowId, input, files = [], sessionId = null, retryCount = 0) {
    const startTime = Date.now()
    try {
        // Build the prediction API URL from the base URL
        const baseUrl = getBaseUrl()

        // Prepare payload
        const payload = { question: input }

        // Add sessionId to maintain conversation context if provided
        if (sessionId) {
            payload.overrideConfig = {
                sessionId: sessionId
            }
        }

        // Add files if present
        if (files && files.length > 0) {
            const processedFiles = processFiles(files)
            payload.uploads = processedFiles
        }

        const response = await axios.post(`${baseUrl}/api/v1/prediction/${chatflowId}`, payload, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${process.env.TESTING_CHATFLOWS_AUTH_TOKEN}`
            },
            timeout: argv.timeout
        })

        // Detect errors in response text
        const responseText = response.data?.text || JSON.stringify(response.data)
        const errorDetection = detectErrors(responseText)

        return {
            success: true,
            chatflowId,
            input,
            response: response.data,
            sessionId: response.data.sessionId, // Return the sessionId for next turn
            chatId: response.data.chatId, // Return the chatId for reference
            duration: Date.now() - startTime,
            filesCount: files ? files.length : 0,
            errorDetection // Add error detection results
        }
    } catch (error) {
        if (retryCount < argv.retries) {
            if (argv.verbose) {
                console.log(`⚠️  Retrying ${chatflowId} (attempt ${retryCount + 1}/${argv.retries})`)
            }
            await sleep(1000 * (retryCount + 1)) // Exponential backoff
            return testChatflowTurn(chatflowId, input, files, sessionId, retryCount + 1)
        }
        return {
            success: false,
            chatflowId,
            input,
            error: error.response?.data || error.message,
            duration: Date.now() - startTime,
            filesCount: files ? files.length : 0,
            errorDetection: { hasIssues: false, critical: [], warnings: [], suspicious: [], markup: [] } // Default for failed requests
        }
    }
}

async function testChatflow(chatflowData) {
    const chatflowId = extractUUID(chatflowData.id)
    const internalName = chatflowData.internalName || 'Unnamed'
    const actualName = await getChatflowName(chatflowId)

    // Validate that conversation property exists
    if (!chatflowData.conversation || !Array.isArray(chatflowData.conversation)) {
        throw new Error(`Chatflow ${internalName} (${chatflowId}) is missing required 'conversation' property`)
    }

    if (chatflowData.conversation.length === 0) {
        throw new Error(`Chatflow ${internalName} (${chatflowId}) has empty 'conversation' array`)
    }

    const conversationResults = []
    let currentSessionId = null // Track session ID across turns
    let currentChatId = null // Track chat ID across turns

    if (argv.verbose) {
        console.log(`\n📝 Testing: ${actualName} [${internalName}]`)
        console.log(`ID: ${chatflowId}`)
        console.log(`Turns: ${chatflowData.conversation.length}`)
    } else {
        console.log(`\n📝 ${actualName} [${internalName}] - ${chatflowData.conversation.length} turns`)
    }

    for (let i = 0; i < chatflowData.conversation.length; i++) {
        const turn = chatflowData.conversation[i]

        if (argv.verbose) {
            console.log(`\n  Turn ${i + 1}/${chatflowData.conversation.length}:`)
            console.log(`  Input: "${turn.input}"`)
            if (turn.files && turn.files.length > 0) {
                console.log(`  Files: ${turn.files.map((f) => f.path).join(', ')}`)
            }
            if (currentSessionId) {
                console.log(`  Using Session ID: ${currentSessionId}`)
            }
        } else {
            process.stdout.write(`  Turn ${i + 1}/${chatflowData.conversation.length}: `)
        }

        const result = await testChatflowTurn(chatflowId, turn.input, turn.files, currentSessionId)
        result.turnNumber = i + 1
        result.totalTurns = chatflowData.conversation.length
        conversationResults.push(result)

        if (result.success) {
            const successIcon = result.errorDetection.hasIssues ? `✅${getErrorSummaryIcon(result.errorDetection)}` : '✅'

            if (argv.verbose) {
                console.log(`  ${successIcon} Success!`)

                // Show error detection results if any issues found
                if (result.errorDetection.hasIssues) {
                    console.log(`  📋 Error Detection (${result.errorDetection.totalIssues} issues):`)
                    const errorDisplay = formatErrorDetection(result.errorDetection)
                    console.log(`  ${errorDisplay}`)
                }

                console.log('  Response:', JSON.stringify(result.response, null, 4))
            } else {
                console.log(`${successIcon} (${formatDuration(result.duration)})`)
            }

            // Update session and chat IDs from the response for next turn
            if (result.sessionId) {
                currentSessionId = result.sessionId
            }
            if (result.chatId) {
                currentChatId = result.chatId
            }
        } else {
            if (argv.verbose) {
                console.log('  ❌ Error:')
                console.log('  Error details:', JSON.stringify(result.error, null, 4))
            } else {
                console.log(`❌ Error (${formatDuration(result.duration)})`)
            }
        }

        if (argv.verbose) {
            console.log(`  ⏱️  Duration: ${formatDuration(result.duration)}`)
        }

        // Add delay between turns (except for the last turn)
        if (!argv['no-delay'] && i < chatflowData.conversation.length - 1) {
            await sleep(parseInt(process.env.TESTING_CHATFLOWS_REQUEST_DELAY_MS))
        }
    }

    // Return consolidated result
    const allSuccessful = conversationResults.every((r) => r.success)
    const totalDuration = conversationResults.reduce((acc, r) => acc + r.duration, 0)

    // Aggregate error detection results
    const aggregatedErrors = {
        totalIssues: conversationResults.reduce((sum, r) => sum + (r.errorDetection?.totalIssues || 0), 0),
        critical: conversationResults.reduce((sum, r) => sum + (r.errorDetection?.critical?.length || 0), 0),
        warnings: conversationResults.reduce((sum, r) => sum + (r.errorDetection?.warnings?.length || 0), 0),
        suspicious: conversationResults.reduce((sum, r) => sum + (r.errorDetection?.suspicious?.length || 0), 0),
        markup: conversationResults.reduce((sum, r) => sum + (r.errorDetection?.markup?.length || 0), 0),
        turnsWithIssues: conversationResults.filter((r) => r.errorDetection?.hasIssues).length
    }

    return {
        success: allSuccessful,
        chatflowId,
        internalName,
        actualName,
        type: 'conversation',
        turns: conversationResults,
        duration: totalDuration,
        totalTurns: chatflowData.conversation.length,
        finalSessionId: currentSessionId, // Include final session ID in results
        finalChatId: currentChatId, // Include final chat ID in results
        errorDetection: aggregatedErrors // Include aggregated error detection results
    }
}

async function main() {
    try {
        // Validate required environment variables
        const requiredEnvVars = ['TESTING_CHATFLOWS_AUTH_TOKEN', 'TESTING_CHATFLOWS_REQUEST_DELAY_MS']

        const missingEnvVars = requiredEnvVars.filter((varName) => !process.env[varName])
        if (missingEnvVars.length > 0) {
            throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`)
        }

        // Validate API URL (either TESTING_CHATFLOWS_API_URL or API_HOST is required)
        if (!process.env.TESTING_CHATFLOWS_API_URL && !process.env.API_HOST) {
            throw new Error('Either TESTING_CHATFLOWS_API_URL or API_HOST environment variable must be set')
        }

        // Show which API URL is being used
        const apiUrl = process.env.TESTING_CHATFLOWS_API_URL || process.env.API_HOST
        const isUsingFallback = !process.env.TESTING_CHATFLOWS_API_URL && process.env.API_HOST
        if (argv.verbose || isUsingFallback) {
            console.log(`🌐 Using API URL: ${apiUrl}${isUsingFallback ? ' (fallback from API_HOST)' : ''}`)
        }

        // Read and load JS file
        const chatflowsData = require(path.resolve(argv.file))

        // Determine which chatflows to test based on CLI options
        let selectedChatflows

        if (argv.all) {
            // Run all chatflows via CLI flag
            selectedChatflows = chatflowsData
            console.log('🚀 Running all chatflows (--all flag specified)')
        } else if (argv.ids) {
            // Run specific chatflows by ID via CLI flag
            const requestedIds = argv.ids.split(',').map((id) => id.trim())
            selectedChatflows = chatflowsData.filter((cf) => {
                const chatflowId = extractUUID(cf.id)
                return requestedIds.some(
                    (requestedId) =>
                        chatflowId.toLowerCase().includes(requestedId.toLowerCase()) ||
                        (cf.internalName && cf.internalName.toLowerCase().includes(requestedId.toLowerCase()))
                )
            })

            if (selectedChatflows.length === 0) {
                throw new Error(`No chatflows found matching IDs: ${requestedIds.join(', ')}`)
            }

            console.log(`🎯 Running ${selectedChatflows.length} chatflows matching IDs: ${requestedIds.join(', ')}`)
        } else {
            // Interactive selection
            const selectionResult = await selectChatflows(chatflowsData)
            selectedChatflows = selectionResult.chatflows

            // Override verbose setting if user chose verbose output
            if (selectionResult.verboseOutput !== undefined) {
                argv.verbose = selectionResult.verboseOutput
            }
        }

        if (argv.verbose) {
            console.log('\n🔍 Selected chatflows:')
            selectedChatflows.forEach((cf, i) => {
                console.log(`${i + 1}. ${cf.internalName || 'Unnamed'} (${extractUUID(cf.id)})`)
                console.log(`   Turns: ${cf.conversation?.length || 0}`)
            })
            console.log('')

            console.log('\n🚀 Starting chatflow testing...\n')
            console.log(`🌐 API URL: ${getBaseUrl()}`)
            console.log(`📊 Total chatflows to test: ${selectedChatflows.length}`)
            console.log(
                `⏱️  Delay between requests: ${argv['no-delay'] ? 'disabled' : process.env.TESTING_CHATFLOWS_REQUEST_DELAY_MS + 'ms'}`
            )
            console.log(`🔄 Retry attempts: ${argv.retries}`)
            console.log(`⏳ Request timeout: ${argv.timeout}ms`)
            console.log(`🔍 Error detection: ${argv['no-error-detection'] ? 'disabled' : 'enabled'}\n`)
        } else {
            console.log(`\n🚀 Testing ${selectedChatflows.length} chatflow${selectedChatflows.length === 1 ? '' : 's'}...\n`)
        }

        const results = []
        const startTime = Date.now()

        // Test each chatflow
        for (let i = 0; i < selectedChatflows.length; i++) {
            const chatflowData = selectedChatflows[i]

            const result = await testChatflow(chatflowData)
            results.push(result)

            // Add delay between chatflows (except for the last chatflow)
            if (!argv['no-delay'] && i < selectedChatflows.length - 1) {
                await sleep(parseInt(process.env.TESTING_CHATFLOWS_REQUEST_DELAY_MS))
            }
        }

        // Show clean checkmark summary
        console.log('\n\n' + '='.repeat(60))
        console.log('RESULTS SUMMARY')
        console.log('='.repeat(60))

        results.forEach((result) => {
            const failedTurns = result.turns.filter((t) => !t.success).length
            const errorSummary = result.errorDetection || {}

            if (failedTurns === 0) {
                if (argv.verbose) {
                    let statusLine = `✅ ${result.internalName} (${result.chatflowId}) - ${result.totalTurns} turns`

                    // Add error detection summary if enabled and issues found
                    if (!argv['no-error-detection'] && errorSummary.totalIssues > 0) {
                        const icons = []
                        if (errorSummary.critical > 0) icons.push('🚨')
                        if (errorSummary.warnings > 0) icons.push('⚠️')
                        if (errorSummary.suspicious > 0) icons.push('🔍')
                        if (errorSummary.markup > 0) icons.push('📄')

                        statusLine += ` ${icons.join('')} (${errorSummary.totalIssues} issues in ${errorSummary.turnsWithIssues} turns)`
                    }

                    console.log(statusLine)
                    if (result.finalSessionId) {
                        console.log(`   Session ID: ${result.finalSessionId}`)
                    }
                } else {
                    // Summary mode - just show name and any critical issues
                    let statusLine = `✅ ${result.internalName}`
                    if (!argv['no-error-detection'] && errorSummary.totalIssues > 0) {
                        const issueIcon = errorSummary.critical > 0 ? '🚨' : '⚠️'
                        statusLine += ` ${issueIcon} (${errorSummary.totalIssues} issues)`
                    }
                    console.log(statusLine)
                }
            } else {
                if (argv.verbose) {
                    console.log(`❌ ${result.internalName} (${result.chatflowId}) - ${failedTurns}/${result.totalTurns} turns failed`)
                } else {
                    console.log(`❌ ${result.internalName} - ${failedTurns}/${result.totalTurns} turns failed`)
                }
            }
        })

        // Generate summary
        const totalDuration = Date.now() - startTime
        const successful = results.filter((r) => r.success).length
        const failed = results.filter((r) => !r.success).length
        const avgDuration = results.reduce((acc, r) => acc + r.duration, 0) / results.length

        // Count total turns
        const totalTurns = results.reduce((acc, r) => acc + r.totalTurns, 0)

        const failedResults = results
            .filter((r) => !r.success)
            .map((r) => ({
                id: r.chatflowId,
                internalName: r.internalName,
                actualName: r.actualName,
                type: r.type,
                error: r.turns.filter((t) => !t.success).map((t) => ({ turn: t.turnNumber, error: t.error })),
                errorDetection: r.errorDetection
            }))

        // Also collect chatflows that succeeded but had error detection issues
        const successfulWithIssues = results
            .filter((r) => r.success && r.errorDetection?.totalIssues > 0)
            .map((r) => ({
                id: r.chatflowId,
                internalName: r.internalName,
                actualName: r.actualName,
                type: r.type,
                errorDetection: r.errorDetection,
                turnsWithIssues: r.turns
                    .filter((t) => t.success && t.errorDetection?.hasIssues)
                    .map((t) => ({
                        turn: t.turnNumber,
                        issues: t.errorDetection
                    }))
            }))

        if (argv.verbose) {
            console.log('\n\n📊 Summary:')
            console.log(`Total chatflows: ${results.length}`)
            console.log(`Total turns: ${totalTurns}`)
            console.log(`Successful chatflows: ${successful}`)
            console.log(`Failed chatflows: ${failed}`)
            console.log(`Success rate: ${((successful / results.length) * 100).toFixed(1)}%`)
            console.log(`Average duration per chatflow: ${formatDuration(avgDuration)}`)
            console.log(`Total duration: ${formatDuration(totalDuration)}`)
        } else {
            console.log(
                `\n📊 ${successful}/${results.length} successful (${((successful / results.length) * 100).toFixed(1)}%) - ${formatDuration(
                    totalDuration
                )}`
            )
        }

        // Error detection summary
        if (!argv['no-error-detection']) {
            const errorStats = results.reduce(
                (acc, result) => {
                    const ed = result.errorDetection || {}
                    acc.totalIssues += ed.totalIssues || 0
                    acc.critical += ed.critical || 0
                    acc.warnings += ed.warnings || 0
                    acc.suspicious += ed.suspicious || 0
                    acc.markup += ed.markup || 0
                    acc.chatflowsWithIssues += ed.totalIssues > 0 ? 1 : 0
                    acc.turnsWithIssues += ed.turnsWithIssues || 0
                    return acc
                },
                {
                    totalIssues: 0,
                    critical: 0,
                    warnings: 0,
                    suspicious: 0,
                    markup: 0,
                    chatflowsWithIssues: 0,
                    turnsWithIssues: 0
                }
            )

            if (argv.verbose) {
                console.log('\n🔍 Error Detection Summary:')
                console.log(`Total issues detected: ${errorStats.totalIssues}`)
                console.log(`Chatflows with issues: ${errorStats.chatflowsWithIssues}/${results.length}`)
                console.log(`Turns with issues: ${errorStats.turnsWithIssues}/${totalTurns}`)

                if (errorStats.totalIssues > 0) {
                    console.log('\nIssue breakdown:')
                    if (errorStats.critical > 0) console.log(`  🚨 Critical: ${errorStats.critical}`)
                    if (errorStats.warnings > 0) console.log(`  ⚠️  Warnings: ${errorStats.warnings}`)
                    if (errorStats.suspicious > 0) console.log(`  🔍 Suspicious: ${errorStats.suspicious}`)
                    if (errorStats.markup > 0) console.log(`  📄 Markup: ${errorStats.markup}`)
                } else {
                    console.log('  🎉 No issues detected!')
                }
            } else {
                // Summary mode - just show if there are issues
                if (errorStats.totalIssues > 0) {
                    const criticalIcon = errorStats.critical > 0 ? '🚨' : '⚠️'
                    console.log(
                        `${criticalIcon} ${errorStats.totalIssues} issues detected across ${errorStats.chatflowsWithIssues} chatflows`
                    )
                }
            }
        }

        if (failed > 0) {
            if (argv.verbose) {
                console.log('\n❌ Failed Chatflows:')
                failedResults.forEach(({ id, internalName, actualName, type, error, errorDetection }) => {
                    console.log(`\nActual Name: ${actualName}`)
                    console.log(`Internal Name: ${internalName}`)
                    console.log(`ID: ${id}`)
                    console.log(`Type: ${type}`)
                    console.log('Failed turns:')
                    error.forEach(({ turn, error: turnError }) => {
                        console.log(`  Turn ${turn}:`, typeof turnError === 'string' ? turnError : JSON.stringify(turnError, null, 2))
                    })

                    // Show error detection summary for failed chatflows if any issues were found
                    if (!argv['no-error-detection'] && errorDetection?.totalIssues > 0) {
                        console.log(
                            `Error detection issues: ${errorDetection.totalIssues} total (${errorDetection.turnsWithIssues} turns affected)`
                        )
                    }
                })
            } else {
                console.log(`\n❌ ${failed} chatflow${failed === 1 ? '' : 's'} failed - run with verbose mode for details`)
            }
        }

        // Show successful chatflows that had error detection issues
        if (!argv['no-error-detection'] && successfulWithIssues.length > 0 && argv.verbose) {
            console.log('\n⚠️  Successful Chatflows with Detected Issues:')
            successfulWithIssues.forEach(({ id, internalName, actualName, type, errorDetection, turnsWithIssues }) => {
                console.log(`\nActual Name: ${actualName}`)
                console.log(`Internal Name: ${internalName}`)
                console.log(`ID: ${id}`)
                console.log(`Type: ${type}`)
                console.log(
                    `Total Issues: ${errorDetection.totalIssues} (Critical: ${errorDetection.critical}, Warnings: ${errorDetection.warnings}, Suspicious: ${errorDetection.suspicious}, Markup: ${errorDetection.markup})`
                )

                if (turnsWithIssues.length > 0) {
                    console.log('Turns with issues:')
                    turnsWithIssues.forEach(({ turn, issues }) => {
                        console.log(`  Turn ${turn}: ${issues.totalIssues} issues`)
                        const errorDisplay = formatErrorDetection(issues)
                        if (errorDisplay) {
                            console.log(`    ${errorDisplay.replace(/\n {2}/g, '\n    ')}`)
                        }
                    })
                }
            })
        }

        // Save results if output file specified
        if (argv.output) {
            const outputPath = path.resolve(process.cwd(), argv.output)
            fs.writeFileSync(outputPath, JSON.stringify(results, null, 2))
            console.log(`\n💾 Results saved to: ${outputPath}`)
        }

        // Exit with error if any tests failed
        if (failed > 0) {
            process.exit(1)
        }
    } catch (error) {
        console.error('❌ Fatal error:', error.message)
        process.exit(1)
    }
}

main()
