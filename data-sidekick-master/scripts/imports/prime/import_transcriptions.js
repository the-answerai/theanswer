import fs from 'node:fs'
import path from 'node:path'
import csv from 'csv-parser'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'

// Setup ES module dirname equivalent
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
dotenv.config({ path: '.env.prime' })

// Validate environment variables
if (
    !process.env.SUPABASE_URL ||
    !process.env.SUPABASE_ANON_KEY ||
    !process.env.ANSWERAI_ENDPOINT ||
    !process.env.ANSWERAI_ANALYSIS_CHATFLOW
) {
    console.error('Missing required environment variables')
    process.exit(1)
}

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

// Configuration
const projectRoot = path.join(__dirname, '..')
const TRANSCRIBED_CSV = path.join(projectRoot, 'csv', 'transcribed_recordings.csv')
const BATCH_SIZE = 10
const API_CALL_TIMEOUT = 60000 // 60 seconds

/**
 * Call the AnswerAI endpoint to analyze a transcript
 */
async function analyzeTranscript(transcript, callId) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_CALL_TIMEOUT)

    try {
        const response = await fetch(`${process.env.ANSWERAI_ENDPOINT}/prediction/${process.env.ANSWERAI_ANALYSIS_CHATFLOW}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                question: transcript
            }),
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
            throw new Error(`Analysis timed out for call: ${callId}`)
        }
        throw error
    } finally {
        clearTimeout(timeoutId)
    }
}

/**
 * Process a batch of transcribed records
 */
async function processBatch(batch) {
    console.log(`Processing batch of ${batch.length} records...`)

    const results = []
    const errors = []

    for (const record of batch) {
        try {
            console.log(`Processing record for ${record.RECORDING_URL}...`)

            // First analyze the transcript
            const analysis = await analyzeTranscript(record.TRANSCRIPTION, record.RECORDING_URL)

            // Prepare the record for database
            const dbRecord = {
                RECORDING_URL: record.RECORDING_URL,
                CALL_DURATION: Number(record.CALL_DURATION) || 0,
                ANSWERED_BY: record.ANSWERED_BY,
                EMPLOYEE_ID: record.EMPLOYEE_ID ? Number(record.EMPLOYEE_ID) : null,
                EMPLOYEE_NAME: record.EMPLOYEE_NAME,
                CALL_NUMBER: record.CALL_NUMBER,
                CALLER_NAME: record.CALLER_NAME,
                FILENAME: record.FILENAME,
                TRANSCRIPTION: record.TRANSCRIPTION,
                WORD_TIMESTAMPS: record.WORD_TIMESTAMPS ? JSON.parse(record.WORD_TIMESTAMPS) : null,
                summary: analysis.summary,
                coaching: analysis.coaching,
                TAGS_ARRAY: analysis.tags || [],
                TAGS: (analysis.tags || []).join(','),
                sentiment_score: analysis.sentiment_score,
                resolution_status: analysis.resolution_status,
                escalated: analysis.escalated,
                CALL_TYPE: analysis.call_type || 'unknown',
                persona: analysis.persona || null
            }

            // Insert or update the record in the database
            const { error: upsertError } = await supabase.from('call_log').upsert(dbRecord, {
                onConflict: 'RECORDING_URL',
                ignoreDuplicates: false
            })

            if (upsertError) throw upsertError

            results.push(record.RECORDING_URL)
            console.log(`Successfully processed ${record.RECORDING_URL}`)
        } catch (error) {
            console.error(`Error processing ${record.RECORDING_URL}:`, error)
            errors.push({ id: record.RECORDING_URL, error: error.message })
        }
    }

    return { results, errors }
}

/**
 * Main function to process the transcribed CSV file
 */
async function main() {
    try {
        // Check if transcribed CSV exists
        if (!fs.existsSync(TRANSCRIBED_CSV)) {
            console.error(`Transcribed CSV file not found: ${TRANSCRIBED_CSV}`)
            process.exit(1)
        }

        // Read and process the CSV file
        const records = []
        await new Promise((resolve, reject) => {
            fs.createReadStream(TRANSCRIBED_CSV)
                .pipe(csv())
                .on('data', (data) => records.push(data))
                .on('end', resolve)
                .on('error', reject)
        })

        console.log(`Found ${records.length} records to process`)

        // Process in batches
        const batches = []
        for (let i = 0; i < records.length; i += BATCH_SIZE) {
            batches.push(records.slice(i, Math.min(i + BATCH_SIZE, records.length)))
        }

        let successCount = 0
        let errorCount = 0

        for (let i = 0; i < batches.length; i++) {
            console.log(`Processing batch ${i + 1} of ${batches.length}...`)
            const { results, errors } = await processBatch(batches[i])
            successCount += results.length
            errorCount += errors.length

            // Log errors for this batch
            if (errors.length > 0) {
                console.error('\nErrors in this batch:')
                errors.forEach(({ id, error }) => console.error(`- ${id}: ${error}`))
            }

            // Show progress
            console.log(`\nProgress: ${successCount}/${records.length} processed successfully (${errorCount} errors)\n`)
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
