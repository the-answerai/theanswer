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
 * --no-delay: Disable delay between requests
 * --retries, -r: Number of retry attempts (default: 2)
 * --timeout, -t: Request timeout in milliseconds (default: 30000)
 * --output, -o: Save results to JSON file
 * --verbose, -v: Enable detailed logging (includes session IDs)
 * --skip-image-generation: Skip turns that request image generation to avoid rate limiting
 * --help, -h: Show help
 *
 * JS File Format:
 * --------------
 * JS File Format:
 * module.exports = [
 *   {
 *     id: '...',
 *     enabled: true,
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
 */

const fs = require('fs')
const path = require('path')
const axios = require('axios')
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') })

// Parse command line arguments
const argv = yargs(hideBin(process.argv))
    .option('file', {
        alias: 'f',
        description: 'Path to JS file (module.exports = [...])',
        type: 'string',
        default: path.join(__dirname, 'chatflows.js')
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
    .option('skip-image-generation', {
        description: 'Skip turns that request image generation to avoid rate limiting',
        type: 'boolean',
        default: false
    })
    .help()
    .alias('help', 'h').argv

// Utility function to create delay
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Add after the existing sleep function
const sleepForImageGeneration = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

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

// Add function to detect if a request is for image generation
const isImageGenerationRequest = (input) => {
    const imageKeywords = [
        'create image',
        'generate image',
        'dall-e',
        'create.*image',
        'generate.*picture',
        'golden retriever',
        'baby elephant',
        'art style',
        'realistic',
        'soft lighting',
        'create a',
        'draw',
        'paint',
        'illustration',
        'picture',
        'visual'
    ]
    const lowerInput = input.toLowerCase()
    return imageKeywords.some((keyword) => {
        if (keyword.includes('.*')) {
            // Simple regex-like matching
            const parts = keyword.split('.*')
            return parts.every((part) => lowerInput.includes(part))
        }
        return lowerInput.includes(keyword)
    })
}

// Add function to handle rate limiting specifically
const handleRateLimitError = async (error, retryCount, maxRetries) => {
    if (error.message && error.message.includes('rate limit')) {
        if (retryCount < maxRetries) {
            const backoffDelay = Math.min(60000 * Math.pow(2, retryCount), 300000) // Max 5 minutes
            console.log(`🔄 Rate limited, waiting ${backoffDelay / 1000}s before retry ${retryCount + 1}/${maxRetries}`)
            await sleepForImageGeneration(backoffDelay)
            return true
        }
    }
    return false
}

async function testChatflowTurn(chatflowId, input, files = [], sessionId = null, retryCount = 0) {
    const startTime = Date.now()

    // Check if this is an image generation request
    const isImageGen = isImageGenerationRequest(input)

    // Add extra delay for image generation requests to avoid rate limiting
    if (isImageGen && retryCount === 0) {
        console.log('  🎨 Image generation request detected, adding extra delay...')
        await sleepForImageGeneration(2000)
    }

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

        // Use longer timeout for image generation requests
        const requestTimeout = isImageGen ? Math.max(argv.timeout, 60000) : argv.timeout

        const response = await axios.post(`${baseUrl}/api/v1/prediction/${chatflowId}`, payload, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${process.env.TESTING_CHATFLOWS_AUTH_TOKEN}`
            },
            timeout: requestTimeout
        })
        return {
            success: true,
            chatflowId,
            input,
            response: response.data,
            sessionId: response.data.sessionId, // Return the sessionId for next turn
            chatId: response.data.chatId, // Return the chatId for reference
            duration: Date.now() - startTime,
            filesCount: files ? files.length : 0
        }
    } catch (error) {
        // Special handling for rate limiting errors
        const errorMessage = error.response?.data || error.message
        const isRateLimited =
            (typeof errorMessage === 'string' && errorMessage.includes('rate limit')) ||
            (typeof errorMessage === 'object' && JSON.stringify(errorMessage).includes('rate limit'))

        if (isRateLimited && (await handleRateLimitError(error, retryCount, argv.retries))) {
            return testChatflowTurn(chatflowId, input, files, sessionId, retryCount + 1)
        }

        if (retryCount < argv.retries) {
            if (argv.verbose) {
                console.log(`⚠️  Retrying ${chatflowId} (attempt ${retryCount + 1}/${argv.retries})`)
            }

            // Use longer backoff for image generation requests
            const backoffMultiplier = isImageGen ? 3 : 1
            const backoffDelay = 1000 * (retryCount + 1) * backoffMultiplier
            await sleep(backoffDelay)
            return testChatflowTurn(chatflowId, input, files, sessionId, retryCount + 1)
        }
        return {
            success: false,
            chatflowId,
            input,
            error: errorMessage,
            duration: Date.now() - startTime,
            filesCount: files ? files.length : 0
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

    console.log(`\n📝 Testing: ${actualName} [${internalName}]`)
    console.log(`ID: ${chatflowId}`)
    console.log(`Turns: ${chatflowData.conversation.length}`)

    for (let i = 0; i < chatflowData.conversation.length; i++) {
        const turn = chatflowData.conversation[i]

        console.log(`\n  Turn ${i + 1}/${chatflowData.conversation.length}:`)
        console.log(`  Input: "${turn.input}"`)
        if (turn.files && turn.files.length > 0) {
            console.log(`  Files: ${turn.files.map((f) => f.path).join(', ')}`)
        }
        if (currentSessionId) {
            console.log(`  Using Session ID: ${currentSessionId}`)
        }

        // Check if we should skip this turn due to image generation
        if (argv['skip-image-generation'] && isImageGenerationRequest(turn.input)) {
            console.log('  ⏭️  Skipping image generation turn (--skip-image-generation enabled)')
            const skippedResult = {
                success: true,
                chatflowId,
                input: turn.input,
                response: { text: 'Skipped due to --skip-image-generation flag' },
                sessionId: currentSessionId,
                chatId: currentChatId,
                duration: 0,
                filesCount: turn.files ? turn.files.length : 0,
                turnNumber: i + 1,
                totalTurns: chatflowData.conversation.length,
                skipped: true
            }
            conversationResults.push(skippedResult)
            continue
        }

        const result = await testChatflowTurn(chatflowId, turn.input, turn.files, currentSessionId)
        result.turnNumber = i + 1
        result.totalTurns = chatflowData.conversation.length
        conversationResults.push(result)

        if (result.success) {
            console.log('  ✅ Success!')
            console.log('  Response:', JSON.stringify(result.response, null, 4))

            // Update session and chat IDs from the response for next turn
            if (result.sessionId) {
                currentSessionId = result.sessionId
            }
            if (result.chatId) {
                currentChatId = result.chatId
            }
        } else {
            console.log('  ❌ Error:')
            console.log('  Error details:', JSON.stringify(result.error, null, 4))
        }
        console.log(`  ⏱️  Duration: ${formatDuration(result.duration)}`)

        // Add delay between turns (except for the last turn)
        if (!argv['no-delay'] && i < chatflowData.conversation.length - 1) {
            const baseDelay = parseInt(process.env.TESTING_CHATFLOWS_REQUEST_DELAY_MS)
            // Add extra delay if the current or next turn involves image generation
            const currentIsImageGen = isImageGenerationRequest(turn.input)
            const nextTurn = chatflowData.conversation[i + 1]
            const nextIsImageGen = nextTurn ? isImageGenerationRequest(nextTurn.input) : false

            if (currentIsImageGen || nextIsImageGen) {
                console.log('  ⏱️  Adding extra delay due to image generation...')
                await sleep(baseDelay * 3) // Triple the delay for image generation
            } else {
                await sleep(baseDelay)
            }
        }
    }

    // Return consolidated result
    const allSuccessful = conversationResults.every((r) => r.success)
    const totalDuration = conversationResults.reduce((acc, r) => acc + r.duration, 0)

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
        finalChatId: currentChatId // Include final chat ID in results
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

        const enabledChatflows = chatflowsData.filter((item) => item.enabled !== false)

        if (argv.verbose) {
            console.log('🔍 Loaded chatflows:')
            enabledChatflows.forEach((cf, i) => {
                console.log(`${i + 1}. ${cf.internalName || 'Unnamed'} (${extractUUID(cf.id)})`)
                console.log(`   Turns: ${cf.conversation?.length || 0}`)
            })
            console.log('')
        }

        console.log('🚀 Starting chatflow testing...\n')
        console.log(`🌐 API URL: ${getBaseUrl()}`)
        console.log(`📊 Total chatflows to test: ${enabledChatflows.length}`)
        console.log(`⏱️  Delay between requests: ${argv['no-delay'] ? 'disabled' : process.env.TESTING_CHATFLOWS_REQUEST_DELAY_MS + 'ms'}`)
        console.log(`🔄 Retry attempts: ${argv.retries}`)
        console.log(`⏳ Request timeout: ${argv.timeout}ms`)
        console.log(`🎨 Skip image generation: ${argv['skip-image-generation'] ? 'enabled' : 'disabled'}`)
        console.log('')

        const results = []
        const startTime = Date.now()

        // Test each chatflow
        for (let i = 0; i < enabledChatflows.length; i++) {
            const chatflowData = enabledChatflows[i]

            const result = await testChatflow(chatflowData)
            results.push(result)

            // Add delay between chatflows (except for the last chatflow)
            if (!argv['no-delay'] && i < enabledChatflows.length - 1) {
                await sleep(parseInt(process.env.TESTING_CHATFLOWS_REQUEST_DELAY_MS))
            }
        }

        // Show clean checkmark summary
        console.log('\n\n' + '='.repeat(60))
        console.log('RESULTS SUMMARY')
        console.log('='.repeat(60))

        results.forEach((result) => {
            const failedTurns = result.turns.filter((t) => !t.success).length
            if (failedTurns === 0) {
                console.log(`✅ ${result.internalName} (${result.chatflowId}) - ${result.totalTurns} turns`)
                if (result.finalSessionId && argv.verbose) {
                    console.log(`   Session ID: ${result.finalSessionId}`)
                }
            } else {
                console.log(`❌ ${result.internalName} (${result.chatflowId}) - ${failedTurns}/${result.totalTurns} turns failed`)
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
                error: r.turns.filter((t) => !t.success).map((t) => ({ turn: t.turnNumber, error: t.error }))
            }))

        console.log('\n\n📊 Summary:')
        console.log(`Total chatflows: ${results.length}`)
        console.log(`Total turns: ${totalTurns}`)
        console.log(`Successful chatflows: ${successful}`)
        console.log(`Failed chatflows: ${failed}`)
        console.log(`Success rate: ${((successful / results.length) * 100).toFixed(1)}%`)
        console.log(`Average duration per chatflow: ${formatDuration(avgDuration)}`)
        console.log(`Total duration: ${formatDuration(totalDuration)}`)

        if (failed > 0) {
            console.log('\n❌ Failed Chatflows:')
            failedResults.forEach(({ id, internalName, actualName, type, error }) => {
                console.log(`\nActual Name: ${actualName}`)
                console.log(`Internal Name: ${internalName}`)
                console.log(`ID: ${id}`)
                console.log(`Type: ${type}`)
                console.log('Failed turns:')
                error.forEach(({ turn, error: turnError }) => {
                    console.log(`  Turn ${turn}:`, typeof turnError === 'string' ? turnError : JSON.stringify(turnError, null, 2))
                })
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
