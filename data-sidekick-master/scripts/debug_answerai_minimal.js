import { config } from 'dotenv'
import { resolve } from 'node:path'

// Get environment from command line argument
const env = process.argv[2]?.toLowerCase()
if (!env || !['wow', 'prime'].includes(env)) {
    console.error('[ERROR] Please specify environment: node debug_answerai_minimal.js [wow|prime]')
    process.exit(1)
}

// Load the environment variables based on environment
config({ path: resolve(process.cwd(), `.env.${env}`) })

console.log(`[${new Date().toISOString()}] Running in ${env.toUpperCase()} environment`)

// Flowise/AnswerAI Endpoint
const ANSWERAI_ENDPOINT = process.env.ANSWERAI_ENDPOINT
const ANSWERAI_ANALYSIS_CHATFLOW = process.env.ANSWERAI_ANALYSIS_CHATFLOW

// Abort/timeout limit for AnswerAI call (milliseconds)
const API_CALL_TIMEOUT = 60000 // 60 seconds

/**
 * Test the AnswerAI endpoint with a minimal payload
 */
async function testMinimalPayload() {
    console.log(`[${new Date().toISOString()}] Testing AnswerAI endpoint with minimal payload`)
    console.log(`[${new Date().toISOString()}] Endpoint: ${ANSWERAI_ENDPOINT}/${ANSWERAI_ANALYSIS_CHATFLOW}`)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_CALL_TIMEOUT)

    try {
        // Test with a minimal transcript
        const minimalTranscript = 'This is a test transcript. Customer called about a billing issue.'
        console.log(`[${new Date().toISOString()}] Minimal transcript: "${minimalTranscript}"`)

        const payload = { question: minimalTranscript }
        console.log(`[${new Date().toISOString()}] Request payload: ${JSON.stringify(payload)}`)

        const response = await fetch(`${ANSWERAI_ENDPOINT}/${ANSWERAI_ANALYSIS_CHATFLOW}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload),
            signal: controller.signal
        })

        console.log(`[${new Date().toISOString()}] Response status: ${response.status}`)

        if (!response.ok) {
            // Try to get response text for more details
            let responseText = ''
            try {
                responseText = await response.text()
                console.log(`[${new Date().toISOString()}] Error response body: ${responseText}`)
            } catch (e) {
                console.log(`[${new Date().toISOString()}] Could not read error response body: ${e.message}`)
            }

            return {
                success: false,
                status: response.status,
                statusText: response.statusText,
                responseText
            }
        }

        const result = await response.json()
        console.log(`[${new Date().toISOString()}] Response body: ${JSON.stringify(result)}`)

        return {
            success: true,
            data: result
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            console.log(`[${new Date().toISOString()}] Request timed out after ${API_CALL_TIMEOUT}ms`)
            return {
                success: false,
                error: `Request aborted (timeout of ${API_CALL_TIMEOUT} ms)`
            }
        }

        console.error(`[${new Date().toISOString()}] Error:`, error)
        return {
            success: false,
            error: error.message
        }
    } finally {
        clearTimeout(timeoutId)
    }
}

/**
 * Test the endpoint structure
 */
async function testEndpointStructure() {
    console.log(`[${new Date().toISOString()}] Testing endpoint structure`)

    // Test base endpoint
    try {
        const baseResponse = await fetch(ANSWERAI_ENDPOINT, {
            method: 'GET'
        })

        console.log(`[${new Date().toISOString()}] Base endpoint status: ${baseResponse.status}`)

        if (baseResponse.ok) {
            console.log(`[${new Date().toISOString()}] Base endpoint is accessible`)
        } else {
            console.log(
                `[${new Date().toISOString()}] Base endpoint is not accessible: ${baseResponse.status} - ${baseResponse.statusText}`
            )
        }
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Error accessing base endpoint:`, error.message)
    }

    // Test chatflow endpoint
    try {
        const chatflowResponse = await fetch(`${ANSWERAI_ENDPOINT}/${ANSWERAI_ANALYSIS_CHATFLOW}`, {
            method: 'GET'
        })

        console.log(`[${new Date().toISOString()}] Chatflow endpoint status: ${chatflowResponse.status}`)

        if (chatflowResponse.ok) {
            console.log(`[${new Date().toISOString()}] Chatflow endpoint is accessible`)
        } else {
            console.log(
                `[${new Date().toISOString()}] Chatflow endpoint is not accessible: ${chatflowResponse.status} - ${
                    chatflowResponse.statusText
                }`
            )
        }
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Error accessing chatflow endpoint:`, error.message)
    }
}

/**
 * Main function
 */
async function main() {
    console.log(`[${new Date().toISOString()}] Starting minimal AnswerAI debugging...`)
    console.log(`ANSWERAI_ENDPOINT: ${ANSWERAI_ENDPOINT}`)
    console.log(`ANSWERAI_ANALYSIS_CHATFLOW: ${ANSWERAI_ANALYSIS_CHATFLOW}`)

    try {
        // First test the endpoint structure
        await testEndpointStructure()

        // Then test with minimal payload
        const result = await testMinimalPayload()
        console.log(`[${new Date().toISOString()}] Test result:`, JSON.stringify(result, null, 2))

        console.log(`[${new Date().toISOString()}] Debugging complete!`)
    } catch (err) {
        console.error(`[${new Date().toISOString()}] Unhandled error in main process:`, err)
    }
}

// Start the script
main()
