import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { createReadStream } from 'node:fs'
import csv from 'csv-parser'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { v4 as uuidv4 } from 'uuid'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: '.env.wow' })

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

// Helper function to convert duration from H:MM:SS format to seconds
function convertDurationToSeconds(duration) {
    if (!duration) return null
    const parts = duration.split(':').map(Number)
    if (parts.length === 3) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2]
    }
    return null
}

async function importWowCalls() {
    const parser = createReadStream(join(__dirname, '../../csv/wow-calls.csv')).pipe(csv())

    let batchSize = 0
    let batch = []
    let counter = 0

    for await (const record of parser) {
        counter++
        // Transform the record to match call_log schema
        const transformedRecord = {
            EMPLOYEE_NAME: record['Number Called'] || null,
            EMPLOYEE_ID: record['Number Called'] || null,
            CALLER_NAME: 'Called Person',
            CALL_TYPE: record.CallType || null,
            CALL_DURATION: convertDurationToSeconds(record.Duration),
            CALL_NUMBER: record.CallId || null,
            TRANSCRIPTION: record.CallTranscript || record.CallTranscript2 || null,
            resolution_status: record.Notes || null,
            summary: null,
            sentiment_score: null,
            RECORDING_URL: `wow_call_${record.CallId || `${uuidv4()}_${counter}`}`,
            FILENAME: record.CallId || null,
            TAGS: record.CallTags ? record.CallTags : null,
            persona: null,
            WORD_TIMESTAMPS: null,
            coaching: null
        }

        batch.push(transformedRecord)
        batchSize++

        // Process in batches of 100
        if (batchSize >= 100) {
            const { error } = await supabase.from('call_log').insert(batch)

            if (error) {
                console.error('Error inserting batch:', error)
                console.error('Failed records:', batch)
            } else {
                console.log(`Successfully inserted ${batch.length} records (Total processed: ${counter})`)
            }

            batch = []
            batchSize = 0
        }
    }

    // Insert any remaining records
    if (batch.length > 0) {
        const { error } = await supabase.from('call_log').insert(batch)

        if (error) {
            console.error('Error inserting final batch:', error)
            console.error('Failed records:', batch)
        } else {
            console.log(`Successfully inserted final ${batch.length} records (Total processed: ${counter})`)
        }
    }
}

importWowCalls()
    .then(() => console.log('Import completed'))
    .catch((error) => console.error('Import failed:', error))
