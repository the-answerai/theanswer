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

/**
 * Check call_log entries
 */
async function checkCallLogs() {
    try {
        console.log('Checking call_log entries...')

        // Get all call_log entries
        const { data: callLogs, error: callLogsError } = await supabase
            .from('call_log')
            .select('RECORDING_URL, summary, resolution_status, sentiment_score')
            .limit(10)

        if (callLogsError) {
            throw new Error(`Failed to fetch call_log entries: ${callLogsError.message}`)
        }

        // Count total call_log entries
        const { count, error: countError } = await supabase.from('call_log').select('*', { count: 'exact', head: true })

        if (countError) {
            throw new Error(`Failed to count call_log entries: ${countError.message}`)
        }

        console.log(`Found ${count || 0} total call_log entries`)

        // Show a sample of the entries
        if (callLogs && callLogs.length > 0) {
            console.log('\nSample entries:')
            for (const log of callLogs) {
                console.log(`- RECORDING_URL: ${log.RECORDING_URL}`)
                console.log(`  Summary: ${log.summary ? `${log.summary.substring(0, 50)}...` : 'N/A'}`)
                console.log(`  Resolution Status: ${log.resolution_status || 'N/A'}`)
                console.log(`  Sentiment Score: ${log.sentiment_score || 'N/A'}`)
                console.log('---')
            }
        }
    } catch (error) {
        console.error('Error:', error)
        process.exit(1)
    }
}

// Run the script
checkCallLogs()
