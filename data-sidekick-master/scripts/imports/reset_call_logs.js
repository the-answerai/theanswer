import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'node:path'
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
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing required environment variables')
    console.error('Make sure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set')
    process.exit(1)
}

// Initialize Supabase client with service role for admin access
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// Configuration
const BATCH_SIZE = 50 // Process 50 records at a time

/**
 * Reset call_log entries in batches
 */
async function resetCallLogsInBatches(recordingUrls) {
    let totalDeleted = 0
    const batches = []

    // Split recording URLs into batches
    for (let i = 0; i < recordingUrls.length; i += BATCH_SIZE) {
        batches.push(recordingUrls.slice(i, Math.min(i + BATCH_SIZE, recordingUrls.length)))
    }

    console.log(`Processing ${recordingUrls.length} call logs in ${batches.length} batches...`)

    for (let i = 0; i < batches.length; i++) {
        const batch = batches[i]
        console.log(`Processing batch ${i + 1} of ${batches.length} (${batch.length} call logs)...`)

        const { error, count } = await supabase.from('call_log').delete().in('RECORDING_URL', batch)

        if (error) {
            console.error(`Error processing batch ${i + 1}: ${error.message}`)
        } else {
            totalDeleted += count || 0
            console.log(`Deleted ${count || 0} entries in this batch`)
        }
    }

    return totalDeleted
}

/**
 * Reset call_log entries
 */
async function resetCallLogs() {
    try {
        // Get command line arguments
        const args = process.argv.slice(2)
        const pattern = args[0] // Optional pattern to filter by (e.g., "rec-1002")
        const deleteAll = args[1] === 'all' // Optional flag to delete all call logs

        console.log('Resetting call_log entries...')

        // If deleteAll flag is set, delete all call logs
        if (deleteAll) {
            console.log('Deleting ALL call logs (this may take a while)...')

            // First, get all recording URLs
            const { data: allCallLogs, error: fetchError } = await supabase.from('call_log').select('RECORDING_URL')

            if (fetchError) {
                throw new Error(`Failed to fetch call logs: ${fetchError.message}`)
            }

            if (!allCallLogs || allCallLogs.length === 0) {
                console.log('No call logs found')
                return
            }

            const allRecordingUrls = allCallLogs.map((log) => log.RECORDING_URL)
            console.log(`Found ${allRecordingUrls.length} call logs to delete`)

            // Process in batches
            const totalDeleted = await resetCallLogsInBatches(allRecordingUrls)

            console.log(`Successfully deleted ${totalDeleted} call logs`)
            return
        }

        // Get all call_log entries that match the pattern
        let query = supabase.from('call_log').select('RECORDING_URL')

        if (pattern) {
            console.log(`Filtering by pattern: ${pattern}`)
            query = query.ilike('RECORDING_URL', `%${pattern}%`)
        }

        const { data: callLogs, error: callLogsError } = await query

        if (callLogsError) {
            throw new Error(`Failed to fetch call logs: ${callLogsError.message}`)
        }

        if (!callLogs || callLogs.length === 0) {
            console.log('No call logs found matching the criteria')
            return
        }

        const recordingUrls = callLogs.map((log) => log.RECORDING_URL)
        console.log(`Found ${recordingUrls.length} call logs matching the criteria`)

        // Process in batches
        const totalDeleted = await resetCallLogsInBatches(recordingUrls)

        console.log(`Successfully deleted ${totalDeleted} call logs`)
    } catch (error) {
        console.error('Error:', error)
        process.exit(1)
    }
}

// Run the script
resetCallLogs()
