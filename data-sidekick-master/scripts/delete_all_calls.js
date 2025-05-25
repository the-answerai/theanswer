import { config } from 'dotenv'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'

// Get environment from command line argument
const env = process.argv[2]?.toLowerCase()
if (!env || !['wow', 'prime'].includes(env)) {
    console.error('[ERROR] Please specify environment: node delete_all_calls.js [wow|prime]')
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

/**
 * Main function to delete all records from the call_log table
 */
async function main() {
    console.log(`[${new Date().toISOString()}] Starting deletion of all call records...`)

    try {
        // First, count how many records we have
        const { count, error: countError } = await supabase.from(DATABASE_TABLES.CALLS).select('*', { count: 'exact', head: true })

        if (countError) {
            throw new Error(`Failed to count records: ${countError.message}`)
        }

        console.log(`[${new Date().toISOString()}] Found ${count} records to delete`)

        // Ask for confirmation
        console.log(
            `[${new Date().toISOString()}] WARNING: This will delete ALL records from the ${
                DATABASE_TABLES.CALLS
            } table in the ${env.toUpperCase()} environment.`
        )
        console.log(
            `[${new Date().toISOString()}] To proceed, add 'confirm' as the third argument: node delete_all_calls.js ${env} confirm`
        )

        // Check if confirmation was provided
        const confirmed = process.argv[3] === 'confirm'
        if (!confirmed) {
            console.log(`[${new Date().toISOString()}] Deletion cancelled. No records were deleted.`)
            return
        }

        // Delete all records
        const { error: deleteError } = await supabase.from(DATABASE_TABLES.CALLS).delete().neq('id', '00000000-0000-0000-0000-000000000000') // This is a trick to delete all records

        if (deleteError) {
            throw new Error(`Failed to delete records: ${deleteError.message}`)
        }

        console.log(`[${new Date().toISOString()}] Successfully deleted all ${count} records from the ${DATABASE_TABLES.CALLS} table.`)
    } catch (err) {
        console.error(`[${new Date().toISOString()}] Unhandled error in main process:`, err)
    }
}

// Start the script
main()
