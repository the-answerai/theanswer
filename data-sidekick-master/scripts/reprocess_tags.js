import { config } from 'dotenv'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'

// Get environment from command line argument
const env = process.argv[2]?.toLowerCase()
if (!env || !['wow', 'prime'].includes(env)) {
    console.error('[ERROR] Please specify environment: node reprocess_tags.js [wow|prime]')
    process.exit(1)
}

// Load the environment variables based on environment
config({ path: resolve(process.cwd(), `.env.${env}`) })

console.log(`[${new Date().toISOString()}] Running in ${env.toUpperCase()} environment`)

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

/**
 * Calls the Flowise/AnswerAI endpoint with the transcript.
 */
async function callAnswerAI(transcript) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_CALL_TIMEOUT)

    try {
        const response = await fetch(`${ANSWERAI_ENDPOINT}/prediction/${ANSWERAI_ANALYSIS_CHATFLOW}`, {
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
    console.log(`[${new Date().toISOString()}] Starting record ${currentCount}/${totalCount} - ID: ${record.id}`)

    const transcript = record.TRANSCRIPTION
    if (!transcript) {
        console.log(`[${new Date().toISOString()}] Record ${record.id} has no transcript, skipping.`)
        return
    }

    try {
        // Get analysis from AnswerAI
        const analysis = await callAnswerAI(transcript)

        // Validate required fields
        if (!analysis.summary || !analysis.tags || !Array.isArray(analysis.tags)) {
            throw new Error('Invalid analysis format - missing required fields')
        }

        // Update the record with the analysis
        const { error: updateError } = await supabase
            .from(DATABASE_TABLES.CALLS)
            .update({
                summary: analysis.summary,
                coaching: analysis.coaching,
                CALL_TYPE: analysis.call_type,
                sentiment_score: analysis.sentiment_score,
                resolution_status: analysis.resolution_status,
                escalated: analysis.escalated,
                TAGS: analysis.tags,
                TAGS_ARRAY: analysis.tags,
                persona: analysis.persona
            })
            .eq('id', record.id)

        if (updateError) {
            throw new Error(`Failed to update record ${record.id}: ${updateError.message}`)
        }

        console.log(`[${new Date().toISOString()}] Completed record ${currentCount}/${totalCount}`)
    } catch (error) {
        console.error(
            `[${new Date().toISOString()}] Error processing record ${currentCount}/${totalCount} (ID: ${record.id}):`,
            error.message
        )
    }
}

/**
 * Process a batch of records concurrently
 */
async function processBatch(records, startIndex, totalRecords) {
    const promises = records.map((record, index) => processRecord(record, startIndex + index + 1, totalRecords))
    await Promise.all(promises)
}

/**
 * Main function to process records
 */
async function main() {
    const startTime = new Date()
    console.log(`[${new Date().toISOString()}] Starting analysis reprocessing...`)
    console.log(`Environment Variables:`)
    console.log(`- TEST_MODE env value: "${process.env.TEST_MODE}"`)
    console.log(`- TEST_MODE evaluated: ${TEST_MODE}`)
    console.log(`- TEST_LIMIT: ${TEST_LIMIT}`)
    console.log(`Test mode: ${TEST_MODE ? 'ON' : 'OFF'}`)
    console.log(`Processing ${CONCURRENT_CALLS} calls concurrently`)

    try {
        // Query records that have transcriptions but no summaries
        let query = supabase
            .from(DATABASE_TABLES.CALLS)
            .select('id, TRANSCRIPTION, summary')
            .not('TRANSCRIPTION', 'is', null)
            .is('summary', null)
            .order('id', { ascending: true })

        // Apply appropriate limit
        if (TEST_MODE) {
            console.log('Applying test mode limit:', TEST_LIMIT)
            query = query.limit(TEST_LIMIT)
        } else {
            console.log('Processing all records (no test mode limit)')
        }

        const { data: records, error } = await query

        if (error) {
            throw new Error(`Failed to fetch records: ${error.message}`)
        }

        const totalRecords = records.length
        console.log(`[${new Date().toISOString()}] Found ${totalRecords} records to process`)

        // Process records in batches
        for (let i = 0; i < records.length; i += CONCURRENT_CALLS) {
            const batch = records.slice(i, i + CONCURRENT_CALLS)
            await processBatch(batch, i, totalRecords)
            console.log(
                `[${new Date().toISOString()}] Completed batch ${Math.floor(i / CONCURRENT_CALLS) + 1}/${Math.ceil(
                    records.length / CONCURRENT_CALLS
                )}`
            )
        }

        const endTime = new Date()
        const duration = (endTime - startTime) / 1000 / 60 // Convert to minutes
        console.log(`[${endTime.toISOString()}] Processing complete!`)
        console.log(`Total time: ${duration.toFixed(2)} minutes`)
        console.log(`Records processed: ${totalRecords}`)
        console.log(`Average time per record: ${(duration / totalRecords).toFixed(2)} minutes`)
        console.log(`Average time per batch: ${(duration / Math.ceil(records.length / CONCURRENT_CALLS)).toFixed(2)} minutes`)
    } catch (err) {
        console.error(`[${new Date().toISOString()}] Unhandled error in main process:`, err)
    }
}

// Start the script
main()
