import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'

// Setup ES module dirname equivalent
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '../..')

// Load environment variables - default to local, but allow override
const envFile = process.env.ENV_FILE || '.env.local'
const envPath = path.resolve(projectRoot, envFile)
console.log(`Loading environment from: ${envPath}`)
dotenv.config({ path: envPath })

// Validate environment variables
if (
    !process.env.SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY ||
    !process.env.ANSWERAI_ENDPOINT ||
    !process.env.ANSWERAI_ANALYSIS_CHATFLOW
) {
    console.error('Missing required environment variables')
    console.error('Make sure SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANSWERAI_ENDPOINT, and ANSWERAI_ANALYSIS_CHATFLOW are set')
    process.exit(1)
}

// Initialize Supabase client with service role for admin access
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// Configuration
const BATCH_SIZE = 20
const API_CALL_TIMEOUT = 60000 // 60 seconds
const MAX_CONCURRENT_REQUESTS = 5 // Maximum number of concurrent requests to AnswerAI API

/**
 * Helper function to process tasks with limited concurrency
 * @param {Array} tasks - Array of async functions to execute
 * @param {number} concurrency - Maximum number of concurrent tasks
 * @returns {Promise<Array>} - Results of all tasks
 */
async function processWithConcurrency(tasks, concurrency = MAX_CONCURRENT_REQUESTS) {
    const results = []
    const runningTasks = new Set()

    // Process tasks with limited concurrency
    for (const task of tasks) {
        // If we've reached the concurrency limit, wait for one task to complete
        if (runningTasks.size >= concurrency) {
            await Promise.race(runningTasks)
        }

        // Create and start a new task
        const runningTask = (async () => {
            try {
                const result = await task()
                results.push(result)
                return result
            } finally {
                runningTasks.delete(runningTask)
            }
        })()

        runningTasks.add(runningTask)
    }

    // Wait for all remaining tasks to complete
    await Promise.all(runningTasks)

    return results
}

/**
 * Call the AnswerAI endpoint to analyze a transcript
 */
async function analyzeTranscript(transcript, documentId, exampleJson = null) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_CALL_TIMEOUT)

    try {
        // Prepare the request body
        const requestBody = {
            question: transcript,
            promtValues: {}
        }

        // If exampleJson is provided, include it in the request
        if (exampleJson) {
            requestBody.exampleJson = exampleJson
        }

        const response = await fetch(`${process.env.ANSWERAI_ENDPOINT}/prediction/${process.env.ANSWERAI_ANALYSIS_CHATFLOW}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${process.env.ANSWERAI_TOKEN}`
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal
        })

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`AnswerAI returned status ${response.status}: ${errorText}`)
        }

        const result = await response.json()
        let parsed

        if (result.json) {
            parsed = result.json
        } else if (result.text) {
            const rawReply = result.text.trim()
            try {
                parsed = JSON.parse(rawReply)
            } catch (e) {
                const jsonMatch = rawReply.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
                if (jsonMatch) {
                    parsed = JSON.parse(jsonMatch[1].trim())
                } else {
                    throw new Error(`Could not parse JSON from AnswerAI response:\n${rawReply}`)
                }
            }
        } else {
            throw new Error('No JSON or text field returned from AnswerAI')
        }

        return parsed
    } catch (error) {
        if (error.name === 'AbortError') {
            console.error(`Analysis timed out for document: ${documentId}`)
        } else {
            console.error(`Error analyzing document ${documentId}: ${error.message}`)
        }

        // Return a default analysis object if the API call fails
        return {
            summary: 'Failed to analyze transcript due to an error.',
            coaching: 'No coaching available due to analysis failure.',
            tags: ['analysis_failed'],
            sentiment_score: 5, // Neutral score
            resolution_status: 'unresolved',
            escalated: false,
            call_type: 'unknown',
            persona: null
        }
    } finally {
        clearTimeout(timeoutId)
    }
}

/**
 * Update the call_log table with analysis results
 */
async function updateCallLog(recordingUrl, analysis, transcription) {
    // Map resolution status to expected format if needed
    let resolutionStatus = analysis.resolution_status
    if (resolutionStatus) {
        // Convert to lowercase and normalize
        resolutionStatus = resolutionStatus.toLowerCase()
        if (!['resolved', 'followup', 'unresolved'].includes(resolutionStatus)) {
            // Map other values to one of the expected values
            if (resolutionStatus.includes('resolve') || resolutionStatus.includes('complete')) {
                resolutionStatus = 'resolved'
            } else if (resolutionStatus.includes('follow') || resolutionStatus.includes('pending')) {
                resolutionStatus = 'followup'
            } else {
                resolutionStatus = 'unresolved'
            }
        }
    }

    // Ensure sentiment score is a number between 1 and 10
    let sentimentScore = analysis.sentiment_score
    if (sentimentScore !== null && sentimentScore !== undefined) {
        // Convert to number if it's a string
        sentimentScore = Number(sentimentScore)
        // Ensure it's between 1 and 10
        if (!Number.isNaN(sentimentScore)) {
            sentimentScore = Math.max(1, Math.min(10, sentimentScore))
        }
    }

    // Get existing call_log entry
    const { data: existingCall, error: checkError } = await supabase.from('call_log').select('*').eq('RECORDING_URL', recordingUrl).single()

    if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 is "not found"
        throw new Error(`Failed to fetch existing call_log: ${checkError.message}`)
    }

    if (!existingCall) {
        throw new Error(`Call log entry not found for recording URL: ${recordingUrl}`)
    }

    // Prepare the update record
    const updateRecord = {
        summary: analysis.summary,
        coaching: analysis.coaching,
        TAGS_ARRAY: analysis.tags || [],
        TAGS: (analysis.tags || []).join(','),
        sentiment_score: sentimentScore,
        resolution_status: resolutionStatus,
        escalated: analysis.escalated,
        CALL_TYPE: analysis.call_type || existingCall.CALL_TYPE || 'unknown',
        persona: analysis.persona || existingCall.persona || null
    }

    // Update the call_log entry
    const { error: updateError } = await supabase.from('call_log').update(updateRecord).eq('RECORDING_URL', recordingUrl)

    if (updateError) {
        throw new Error(`Failed to update call_log: ${updateError.message}`)
    }

    console.log(`Updated call_log entry for ${recordingUrl}`)
}

/**
 * Process a batch of call_log entries
 */
async function processBatch(batch, exampleJson) {
    console.log(`Processing batch of ${batch.length} call_log entries in parallel (max ${MAX_CONCURRENT_REQUESTS} concurrent)...`)

    const results = []
    const errors = []

    // Create task functions for each call_log entry
    const tasks = batch.map((entry) => async () => {
        try {
            console.log(`Starting processing for call_log entry: ${entry.recording_url}...`)

            // Analyze the transcript
            const analysis = await analyzeTranscript(entry.transcription, entry.recording_url, exampleJson)

            // Update call_log table
            await updateCallLog(entry.recording_url, analysis, entry.transcription)

            results.push(entry.recording_url)
            console.log(`Successfully processed call_log entry: ${entry.recording_url}`)
            return { success: true, id: entry.recording_url }
        } catch (error) {
            console.error(`Error processing call_log entry ${entry.recording_url}:`, error)
            errors.push({ id: entry.recording_url, error: error.message })
            return { success: false, id: entry.recording_url, error: error.message }
        }
    })

    // Process tasks with limited concurrency
    await processWithConcurrency(tasks)

    return { results, errors }
}

/**
 * Fetch call_log entries with empty TAGS_ARRAY
 */
async function fetchCallLogsWithEmptyTags(limit = null) {
    // Try to get entries with empty TAGS_ARRAY using a direct query
    // First, check if there are any entries with empty TAGS_ARRAY
    const { count, error: countError } = await supabase
        .from('call_log')
        .select('*', { count: 'exact', head: true })
        .filter('TAGS_ARRAY', 'is', '[]')

    if (countError) {
        console.error(`Error checking for empty TAGS_ARRAY: ${countError.message}`)
    } else {
        console.log(`Found ${count || 0} entries with TAGS_ARRAY = '[]'`)
    }

    // Try a different approach - get all entries and filter in JavaScript
    const { data: allEntries, error: queryError } = await supabase
        .from('call_log')
        .select('RECORDING_URL, TRANSCRIPTION, TAGS_ARRAY')
        .limit(limit ? Number(limit) * 10 : 1000) // Get more entries than needed to filter

    if (queryError) {
        throw new Error(`Failed to fetch call_log entries: ${queryError.message}`)
    }

    console.log(`Fetched ${allEntries.length} call_log entries to filter`)

    // Filter entries with empty TAGS_ARRAY
    const emptyTagsEntries = allEntries.filter((entry) => {
        // Check for null
        if (entry.TAGS_ARRAY === null) return true

        // Check for empty array
        if (Array.isArray(entry.TAGS_ARRAY) && entry.TAGS_ARRAY.length === 0) return true

        // Check for empty array as string
        if (entry.TAGS_ARRAY === '[]') return true

        // Check for empty object
        if (typeof entry.TAGS_ARRAY === 'object' && Object.keys(entry.TAGS_ARRAY).length === 0) return true

        return false
    })

    console.log(`Found ${emptyTagsEntries.length} entries with empty TAGS_ARRAY after filtering`)

    // Apply limit if provided
    let limitedEntries = emptyTagsEntries
    if (limit && !Number.isNaN(Number(limit))) {
        limitedEntries = emptyTagsEntries.slice(0, Number(limit))
    }

    // Format the entries for processing
    const formattedEntries = limitedEntries.map((entry) => ({
        recording_url: entry.RECORDING_URL,
        transcription: entry.TRANSCRIPTION
    }))

    console.log(`Returning ${formattedEntries.length} call_log entries with empty TAGS_ARRAY${limit ? ` (limited to ${limit})` : ''}`)
    return formattedEntries
}

/**
 * Main function to process call_log entries with empty TAGS_ARRAY
 */
async function main() {
    try {
        // Get command line arguments
        const args = process.argv.slice(2)
        const limit = args[0] // Optional limit parameter
        const exampleJsonPath = args[1] // Optional example JSON path

        // Load example JSON if provided
        let exampleJson = null
        if (exampleJsonPath && fs.existsSync(exampleJsonPath)) {
            try {
                const jsonContent = fs.readFileSync(exampleJsonPath, 'utf8')
                exampleJson = JSON.parse(jsonContent)
                console.log('Loaded example JSON schema from file')
            } catch (error) {
                console.error('Error loading example JSON:', error)
                process.exit(1)
            }
        }

        // Fetch call_log entries with empty TAGS_ARRAY
        const callLogEntries = await fetchCallLogsWithEmptyTags(limit)

        if (callLogEntries.length === 0) {
            console.log('No call_log entries found with empty TAGS_ARRAY. Exiting.')
            process.exit(0)
        }

        // Process in batches
        const batches = []
        for (let i = 0; i < callLogEntries.length; i += BATCH_SIZE) {
            batches.push(callLogEntries.slice(i, Math.min(i + BATCH_SIZE, callLogEntries.length)))
        }

        let successCount = 0
        let errorCount = 0

        for (let i = 0; i < batches.length; i++) {
            console.log(`Processing batch ${i + 1} of ${batches.length}...`)
            const { results, errors } = await processBatch(batches[i], exampleJson)
            successCount += results.length
            errorCount += errors.length

            // Log errors for this batch
            if (errors.length > 0) {
                console.error('\nErrors in this batch:')
                for (const { id, error } of errors) {
                    console.error(`- ${id}: ${error}`)
                }
            }

            // Show progress
            console.log(`\nProgress: ${successCount}/${callLogEntries.length} processed successfully (${errorCount} errors)\n`)
        }

        console.log('\nProcessing complete!')
        console.log(`Successfully processed: ${successCount}`)
        console.log(`Errors: ${errorCount}`)
    } catch (error) {
        console.error('Fatal error:', error)
        process.exit(1)
    }
}

// Run the script
main()
