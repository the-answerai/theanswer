import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'node:path'

// Check for environment argument
const args = process.argv.slice(2)
const envFlag = args.findIndex((arg) => arg === '--env')
if (envFlag === -1 || !args[envFlag + 1]) {
    console.error('Error: You must specify an environment with --env [local|development|production]')
    console.error('Example: node scripts/cleanup_call_logs.js --env local')
    process.exit(1)
}

const env = args[envFlag + 1]
if (!['local', 'development', 'production'].includes(env)) {
    console.error('Error: Environment must be one of: local, development, production')
    process.exit(1)
}

if (env === 'production') {
    console.error('⛔️ DANGER: You are attempting to run this script on the PRODUCTION environment!')
    console.error('This action cannot be undone and will affect real customer data.')
    console.error('If you are absolutely sure, please modify this check in the script.')
    process.exit(1)
}

// Load the appropriate .env file
const envFile = env === 'local' ? '.env.local' : env === 'development' ? '.env.development' : '.env'
dotenv.config({ path: path.resolve(process.cwd(), envFile) })

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.error(`Missing Supabase credentials in ${envFile} file`)
    process.exit(1)
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

async function cleanupCallLogs() {
    try {
        console.log(`Running cleanup on ${env.toUpperCase()} environment...`)

        // First, clear out all analysis-related data
        const { error: updateError } = await supabase
            .from('call_log')
            .update({
                TAGS: '',
                TAGS_ARRAY: [],
                CALL_TYPE: null,
                sentiment_score: null,
                resolution_status: null,
                escalated: null,
                summary: null,
                coaching: null,
                persona: null
            })
            .not('RECORDING_URL', 'eq', '') // Update all records

        if (updateError) throw updateError

        // Get recording URLs of all records except the most recent 100
        const { data: recordsToDelete, error: selectError } = await supabase
            .from('call_log')
            .select('RECORDING_URL')
            .order('CALL_NUMBER', { ascending: false })
            .range(100, 999999)

        if (selectError) throw selectError

        if (recordsToDelete && recordsToDelete.length > 0) {
            const urlsToDelete = recordsToDelete.map((record) => record.RECORDING_URL)
            const BATCH_SIZE = 20

            // Delete in batches
            for (let i = 0; i < urlsToDelete.length; i += BATCH_SIZE) {
                const batch = urlsToDelete.slice(i, i + BATCH_SIZE)
                const { error: deleteError } = await supabase.from('call_log').delete().in('RECORDING_URL', batch)

                if (deleteError) throw deleteError

                console.log(`Deleted batch ${i / BATCH_SIZE + 1} of ${Math.ceil(urlsToDelete.length / BATCH_SIZE)}`)
            }
        }

        console.log(`Successfully cleaned up call_log table in ${env.toUpperCase()} environment`)
    } catch (err) {
        console.error('Error cleaning up call_log table:', err)
        process.exit(1)
    }
}

// Add a final confirmation prompt
console.log(`\nWARNING: This script will:`)
console.log(`1. Clear all tags and analysis data (including resolution, escalation, summary, coaching)`)
console.log(`2. Delete all but the most recent 100 records`)
console.log(`3. This will be done on the ${env.toUpperCase()} environment`)
console.log(`\nPress Ctrl+C to cancel, or wait 5 seconds to continue...\n`)

setTimeout(cleanupCallLogs, 5000)
