import { config } from 'dotenv'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'
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
    console.error('[ERROR] Please specify environment: node reprocess_tags_csv.js [wow|prime] [start_index]')
    process.exit(1)
}

// Get optional starting index from command line
const startIndex = Number.parseInt(process.argv[3], 10) || 0

// Load the environment variables based on environment
config({ path: resolve(process.cwd(), `.env.${env}`) })

console.log(`[${new Date().toISOString()}] Running in ${env.toUpperCase()} environment`)
console.log(`[${new Date().toISOString()}] Starting from index: ${startIndex}`)

// Create Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

// Verify Supabase credentials
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.error(`[ERROR] Missing Supabase credentials in .env.${env} file.`)
    process.exit(1)
}

// Database tables
const DATABASE_TABLES = {
    CALLS: 'call_log'
}

// Flowise/AnswerAI Endpoint
const ANSWERAI_ENDPOINT = process.env.ANSWERAI_ENDPOINT
const ANSWERAI_ANALYSIS_CHATFLOW = process.env.ANSWERAI_ANALYSIS_CHATFLOW

// Optional test mode (process limited number of records if true)
const TEST_MODE = process.env.TEST_MODE === 'true'
const TEST_LIMIT = Number.parseInt(process.env.TEST_LIMIT, 10) || 5

// Abort/timeout limit for AnswerAI call (milliseconds)
const API_CALL_TIMEOUT = Number.parseInt(process.env.API_CALL_TIMEOUT, 10) || 30000

// Concurrent processing
const CONCURRENT_CALLS = 10

// Path to CSV file
const projectRoot = path.join(__dirname, '..')
const CSV_FILE = path.join(projectRoot, 'csv', 'wow-calls.csv')

// Batch size for processing
const BATCH_SIZE = 5
const API_CALL_DELAY = 1000 // Add a 1-second delay between API calls

/**
 * Map call types to match UI filter options
 */
function mapCallType(callType) {
    if (!callType) return 'other'

    const callTypeLower = callType.toLowerCase()

    // Map to exact UI filter options
    if (callTypeLower.includes('sales') && callTypeLower.includes('confirm')) return 'sales-confirmed'
    if (callTypeLower.includes('sales')) return 'sales-likely'
    if (callTypeLower.includes('support')) return 'support'
    if (callTypeLower.includes('cancel') || callTypeLower.includes('termination')) return 'services-cancellation'

    // Default to 'other' for any unmatched call types
    return 'other'
}

/**
 * Sleep function to add delay between API calls
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} - Promise that resolves after the specified time
 */
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Calls the Flowise/AnswerAI endpoint with the transcript.
 */
async function callAnswerAI(transcript) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_CALL_TIMEOUT)

    try {
        // Add delay before making API call to avoid overwhelming the endpoint
        await sleep(API_CALL_DELAY)

        const response = await fetch(`${ANSWERAI_ENDPOINT}/${ANSWERAI_ANALYSIS_CHATFLOW}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ question: transcript }),
            signal: controller.signal
        })

        if (!response.ok) {
            throw new Error(`Non-200 response: ${response.status} - ${response.statusText}`)
        }

        const result = await response.json()
        return result.json || {}
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error(`[callAnswerAI] Request aborted (timeout of ${API_CALL_TIMEOUT} ms)`)
        }
        throw error
    } finally {
        clearTimeout(timeoutId)
    }
}

/**
 * Updates a single record with new analysis
 */
async function processRecord(record, currentCount, totalCount) {
    console.log(`[${new Date().toISOString()}] Starting record ${currentCount}/${totalCount} - ID: ${record.CallId}`)

    const transcript = record.CallTranscript
    if (!transcript) {
        console.log(`[${new Date().toISOString()}] Record ${record.CallId} has no transcript, skipping.`)
        return
    }

    try {
        // Add delay before making API call to avoid overwhelming the endpoint
        await sleep(API_CALL_DELAY)

        // Get analysis from AnswerAI
        const analysis = await callAnswerAI(transcript)

        // Validate required fields
        if (!analysis.summary || !analysis.tags || !Array.isArray(analysis.tags)) {
            throw new Error('Invalid analysis format - missing required fields')
        }

        // Check if record exists in database
        const { data: existingRecord, error: fetchError } = await supabase
            .from(DATABASE_TABLES.CALLS)
            .select('id')
            .eq('CALL_NUMBER', record.CallId)
            .single()

        if (fetchError && fetchError.code !== 'PGRST116') {
            // PGRST116 is "not found" error
            throw new Error(`Failed to check if record exists: ${fetchError.message}`)
        }

        if (existingRecord) {
            // Update existing record
            const mappedCallType = mapCallType(analysis.call_type)

            // Ensure persona contains all required fields
            const persona = {
                ...(analysis.persona || {}),
                // Add default values for new fields if they don't exist
                identifySalesCalls: analysis.persona?.identifySalesCalls || '',
                productFeatureMentions: analysis.persona?.productFeatureMentions || '',
                sentimentAndHighlights: analysis.persona?.sentimentAndHighlights || '',
                agentPitchEffectiveness: analysis.persona?.agentPitchEffectiveness || '',
                dataValidationAndMissedCalls: analysis.persona?.dataValidationAndMissedCalls || '',
                campaignPerformance: analysis.persona?.campaignPerformance || ''
            }

            const { error: updateError } = await supabase
                .from(DATABASE_TABLES.CALLS)
                .update({
                    summary: analysis.summary,
                    coaching: analysis.coaching,
                    CALL_TYPE: mappedCallType,
                    sentiment_score: analysis.sentiment_score,
                    resolution_status: analysis.resolution_status,
                    escalated: analysis.escalated,
                    TAGS: analysis.tags,
                    TAGS_ARRAY: analysis.tags,
                    persona: persona
                })
                .eq('id', existingRecord.id)

            if (updateError) {
                throw new Error(`Failed to update record ${existingRecord.id}: ${updateError.message}`)
            }
        } else {
            // Insert new record
            const mappedCallType = mapCallType(analysis.call_type)

            // Ensure persona contains all required fields
            const persona = {
                ...(analysis.persona || {}),
                // Add default values for new fields if they don't exist
                identifySalesCalls: analysis.persona?.identifySalesCalls || '',
                productFeatureMentions: analysis.persona?.productFeatureMentions || '',
                sentimentAndHighlights: analysis.persona?.sentimentAndHighlights || '',
                agentPitchEffectiveness: analysis.persona?.agentPitchEffectiveness || '',
                dataValidationAndMissedCalls: analysis.persona?.dataValidationAndMissedCalls || '',
                campaignPerformance: analysis.persona?.campaignPerformance || ''
            }

            const dbRecord = {
                CALL_NUMBER: record.CallId,
                RECORDING_URL: record.CallId, // Using CallId as RECORDING_URL for uniqueness
                CALL_DURATION: Number(record.Duration) || 0,
                ANSWERED_BY: record.TerminationNumber || '',
                EMPLOYEE_NAME: record.Name || '',
                CALLER_NAME: record.Name || '',
                FILENAME: `${record.CallId}.mp3`,
                TRANSCRIPTION: record.CallTranscript,
                summary: analysis.summary,
                coaching: analysis.coaching,
                TAGS_ARRAY: analysis.tags || [],
                TAGS: analysis.tags.join(','),
                sentiment_score: analysis.sentiment_score,
                resolution_status: analysis.resolution_status,
                escalated: analysis.escalated,
                CALL_TYPE: mappedCallType,
                persona: persona
            }

            const { error: insertError } = await supabase.from(DATABASE_TABLES.CALLS).insert(dbRecord)

            if (insertError) {
                throw new Error(`Failed to insert record ${record.CallId}: ${insertError.message}`)
            }
        }

        console.log(`[${new Date().toISOString()}] Completed record ${currentCount}/${totalCount}`)
    } catch (error) {
        console.error(
            `[${new Date().toISOString()}] Error processing record ${currentCount}/${totalCount} (ID: ${record.CallId}):`,
            error.message
        )
    }
}

/**
 * Process a batch of records concurrently
 */
async function processBatch(records, startBatchIndex, totalRecords) {
    const promises = records.map((record, index) => processRecord(record, startBatchIndex + index + 1, totalRecords))
    await Promise.all(promises)
}

/**
 * Main function to process records from CSV
 */
async function main() {
    const startTime = new Date()
    console.log(`[${startTime.toISOString()}] Starting analysis reprocessing from CSV...`)
    console.log('Environment Variables:')
    console.log(`- TEST_MODE env value: "${process.env.TEST_MODE}"`)
    console.log(`- TEST_MODE evaluated: ${TEST_MODE}`)
    console.log(`- TEST_LIMIT: ${TEST_LIMIT}`)
    console.log(`Test mode: ${TEST_MODE ? 'ON' : 'OFF'}`)
    console.log(`Processing ${CONCURRENT_CALLS} calls concurrently`)
    console.log(`CSV File: ${CSV_FILE}`)
    console.log(`Starting from record index: ${startIndex}`)

    try {
        // Check if CSV file exists
        if (!fs.existsSync(CSV_FILE)) {
            throw new Error(`CSV file not found: ${CSV_FILE}`)
        }

        // Read and process the CSV file
        const records = []
        await new Promise((resolve, reject) => {
            fs.createReadStream(CSV_FILE)
                .pipe(csv())
                .on('data', (data) => records.push(data))
                .on('end', resolve)
                .on('error', reject)
        })

        // Skip records before the starting index
        const recordsFromStartIndex = records.slice(startIndex)
        console.log(`[${new Date().toISOString()}] Skipping first ${startIndex} records`)

        // Apply test limit if in test mode
        const recordsToProcess = TEST_MODE ? recordsFromStartIndex.slice(0, TEST_LIMIT) : recordsFromStartIndex
        const totalRecords = recordsToProcess.length

        console.log(`[${new Date().toISOString()}] Found ${totalRecords} records to process out of ${records.length} total records`)

        // Process records in batches
        for (let i = 0; i < recordsToProcess.length; i += BATCH_SIZE) {
            const batch = recordsToProcess.slice(i, i + BATCH_SIZE)
            await processBatch(batch, startIndex + i, records.length)
            console.log(
                `[${new Date().toISOString()}] Completed batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(
                    recordsToProcess.length / BATCH_SIZE
                )}`
            )
        }

        const endTime = new Date()
        const duration = (endTime - startTime) / 1000 / 60 // Convert to minutes
        console.log(`[${endTime.toISOString()}] Processing complete!`)
        console.log(`Total time: ${duration.toFixed(2)} minutes`)
        console.log(`Records processed: ${totalRecords}`)
        console.log(`Starting index: ${startIndex}`)
        console.log(`Ending index: ${startIndex + totalRecords - 1}`)
        console.log(`Average time per record: ${(duration / totalRecords).toFixed(2)} minutes`)
        console.log(`Average time per batch: ${(duration / Math.ceil(recordsToProcess.length / BATCH_SIZE)).toFixed(2)} minutes`)
    } catch (err) {
        console.error(`[${new Date().toISOString()}] Unhandled error in main process:`, err)
    }
}

// Start the script
main()
