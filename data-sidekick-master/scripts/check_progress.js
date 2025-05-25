import { config } from 'dotenv'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'

// Get environment from command line argument
const env = process.argv[2]?.toLowerCase()
if (!env || !['wow', 'prime'].includes(env)) {
    console.error('[ERROR] Please specify environment: node check_progress.js [wow|prime]')
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

/**
 * Main function to check progress of record processing
 */
async function main() {
    try {
        // Count total records
        const { count, error: countError } = await supabase.from('call_log').select('*', { count: 'exact', head: true })

        if (countError) {
            throw new Error(`Failed to count records: ${countError.message}`)
        }

        console.log(`[${new Date().toISOString()}] Total records in database: ${count}`)

        // Count records by call type
        const { data: callTypeCounts, error: callTypeError } = await supabase.from('call_log').select('CALL_TYPE, count').group('CALL_TYPE')

        if (callTypeError) {
            throw new Error(`Failed to get call type counts: ${callTypeError.message}`)
        }

        console.log(`[${new Date().toISOString()}] Records by call type:`)
        callTypeCounts.forEach((type) => {
            console.log(`  - ${type.CALL_TYPE || 'undefined'}: ${type.count}`)
        })

        // Count records with persona data
        const { count: personaCount, error: personaError } = await supabase
            .from('call_log')
            .select('*', { count: 'exact', head: true })
            .not('persona', 'is', null)

        if (personaError) {
            throw new Error(`Failed to count persona records: ${personaError.message}`)
        }

        console.log(
            `[${new Date().toISOString()}] Records with persona data: ${personaCount} (${Math.round((personaCount / count) * 100)}%)`
        )

        // Get the most recent record
        const { data: latestRecord, error: latestError } = await supabase
            .from('call_log')
            .select('CALL_NUMBER, created_at')
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

        if (!latestError && latestRecord) {
            console.log(
                `[${new Date().toISOString()}] Most recent record: ${latestRecord.CALL_NUMBER} (created at ${new Date(
                    latestRecord.created_at
                ).toLocaleString()})`
            )
        }
    } catch (err) {
        console.error(`[${new Date().toISOString()}] Unhandled error in main process:`, err)
    }
}

// Start the script
main()
