import { config } from 'dotenv'
import { resolve } from 'node:path'
import fs from 'node:fs'
import path from 'node:path'
import csv from 'csv-parser'
import { fileURLToPath } from 'node:url'

// Setup ES module dirname equivalent
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Get environment from command line argument
const env = process.argv[2]?.toLowerCase()
if (!env || !['wow', 'prime'].includes(env)) {
    console.error('[ERROR] Please specify environment: node debug_answerai.js [wow|prime]')
    process.exit(1)
}

// Load the environment variables based on environment
config({ path: resolve(process.cwd(), `.env.${env}`) })

console.log(`[${new Date().toISOString()}] Running in ${env.toUpperCase()} environment`)

// Flowise/AnswerAI Endpoint
const ANSWERAI_ENDPOINT = process.env.ANSWERAI_ENDPOINT
const ANSWERAI_ANALYSIS_CHATFLOW = process.env.ANSWERAI_ANALYSIS_CHATFLOW

// Path to CSV file
const projectRoot = path.join(__dirname, '..')
const CSV_FILE = path.join(projectRoot, 'csv', 'wow-calls.csv')

// Abort/timeout limit for AnswerAI call (milliseconds)
const API_CALL_TIMEOUT = 60000 // 60 seconds

/**
 * Calls the Flowise/AnswerAI endpoint with the transcript.
 */
async function callAnswerAI(transcript, callId) {
    console.log(`[${new Date().toISOString()}] Calling AnswerAI for call ID: ${callId}`)
    console.log(`[${new Date().toISOString()}] Endpoint: ${ANSWERAI_ENDPOINT}/${ANSWERAI_ANALYSIS_CHATFLOW}`)

    // Log transcript length
    console.log(`[${new Date().toISOString()}] Transcript length: ${transcript.length} characters`)

    // Create a shorter version for testing if transcript is very long
    const shortTranscript = transcript.length > 1000 ? `${transcript.substring(0, 1000)}...` : transcript

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_CALL_TIMEOUT)

    try {
        // First try with full transcript
        console.log(`[${new Date().toISOString()}] Attempting with full transcript...`)
        const payload = { question: transcript }
        console.log(`[${new Date().toISOString()}] Request payload size: ${JSON.stringify(payload).length} bytes`)

        const response = await fetch(`${ANSWERAI_ENDPOINT}/${ANSWERAI_ANALYSIS_CHATFLOW}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload),
            signal: controller.signal
        })

        if (!response.ok) {
            console.log(`[${new Date().toISOString()}] Full transcript attempt failed with status: ${response.status}`)

            // If transcript is long and we got a 500 error, try with shorter transcript
            if (transcript.length > 1000 && response.status === 500) {
                console.log(`[${new Date().toISOString()}] Attempting with shortened transcript...`)

                const shortPayload = { question: shortTranscript }
                console.log(`[${new Date().toISOString()}] Short request payload size: ${JSON.stringify(shortPayload).length} bytes`)

                const shortResponse = await fetch(`${ANSWERAI_ENDPOINT}/${ANSWERAI_ANALYSIS_CHATFLOW}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(shortPayload),
                    signal: controller.signal
                })

                if (!shortResponse.ok) {
                    console.log(`[${new Date().toISOString()}] Short transcript attempt also failed with status: ${shortResponse.status}`)
                    throw new Error(`Non-200 response with short transcript: ${shortResponse.status} - ${shortResponse.statusText}`)
                }

                console.log(`[${new Date().toISOString()}] Short transcript attempt succeeded!`)
                const result = await shortResponse.json()
                return {
                    success: true,
                    data: result.json || {},
                    truncated: true
                }
            }

            // Try to get response text for more details
            let responseText = ''
            try {
                responseText = await response.text()
                console.log(`[${new Date().toISOString()}] Error response body: ${responseText}`)
            } catch (e) {
                console.log(`[${new Date().toISOString()}] Could not read error response body: ${e.message}`)
            }

            throw new Error(`Non-200 response: ${response.status} - ${response.statusText}. Response: ${responseText}`)
        }

        console.log(`[${new Date().toISOString()}] Full transcript attempt succeeded!`)
        const result = await response.json()
        return {
            success: true,
            data: result.json || {},
            truncated: false
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            console.log(`[${new Date().toISOString()}] Request timed out after ${API_CALL_TIMEOUT}ms`)
            throw new Error(`[callAnswerAI] Request aborted (timeout of ${API_CALL_TIMEOUT} ms)`)
        }
        return {
            success: false,
            error: error.message
        }
    } finally {
        clearTimeout(timeoutId)
    }
}

/**
 * Main function to debug AnswerAI calls
 */
async function main() {
    console.log(`[${new Date().toISOString()}] Starting AnswerAI debugging...`)
    console.log(`ANSWERAI_ENDPOINT: ${ANSWERAI_ENDPOINT}`)
    console.log(`ANSWERAI_ANALYSIS_CHATFLOW: ${ANSWERAI_ANALYSIS_CHATFLOW}`)

    try {
        // Check if CSV file exists
        if (!fs.existsSync(CSV_FILE)) {
            throw new Error(`CSV file not found: ${CSV_FILE}`)
        }

        // Read the CSV file
        const records = []
        await new Promise((resolve, reject) => {
            fs.createReadStream(CSV_FILE)
                .pipe(csv())
                .on('data', (data) => records.push(data))
                .on('end', resolve)
                .on('error', reject)
        })

        console.log(`[${new Date().toISOString()}] Found ${records.length} records in CSV`)

        // Take just the first record for debugging
        const testRecord = records[0]
        console.log(`[${new Date().toISOString()}] Testing with record ID: ${testRecord.CallId}`)

        if (!testRecord.CallTranscript) {
            console.log(`[${new Date().toISOString()}] Record has no transcript, trying next record...`)
            const testRecord2 = records[1]
            console.log(`[${new Date().toISOString()}] Testing with record ID: ${testRecord2.CallId}`)

            if (!testRecord2.CallTranscript) {
                throw new Error('Could not find a record with a transcript')
            }

            const result = await callAnswerAI(testRecord2.CallTranscript, testRecord2.CallId)
            console.log(`[${new Date().toISOString()}] Call result:`, JSON.stringify(result, null, 2))
        } else {
            const result = await callAnswerAI(testRecord.CallTranscript, testRecord.CallId)
            console.log(`[${new Date().toISOString()}] Call result:`, JSON.stringify(result, null, 2))
        }

        console.log(`[${new Date().toISOString()}] Debugging complete!`)
    } catch (err) {
        console.error(`[${new Date().toISOString()}] Unhandled error in main process:`, err)
    }
}

// Start the script
main()
