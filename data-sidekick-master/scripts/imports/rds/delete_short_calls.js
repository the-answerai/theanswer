import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Setup ES module dirname equivalent
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '../../..')

// Check for environment argument
const args = process.argv.slice(2)
const envFlag = args.findIndex((arg) => arg === '--env')
if (envFlag === -1 || !args[envFlag + 1]) {
    console.error('Error: You must specify an environment with --env [local|prime|wow|rds]')
    console.error('Example: node scripts/imports/rds/delete_short_calls.js --env local')
    process.exit(1)
}

const env = args[envFlag + 1]
if (!['local', 'prime', 'wow', 'rds'].includes(env)) {
    console.error('Error: Environment must be one of: local, prime, wow, rds')
    process.exit(1)
}

// Load the appropriate .env file
const envFile = env === 'local' ? '.env.local' : `.env.${env}`
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

// Duration threshold in seconds
const DURATION_THRESHOLD = 30

// Dry run flag - set to true to just show what would be deleted without actually deleting
const DRY_RUN = args.includes('--dry-run')

/**
 * Delete calls under the threshold duration
 */
async function deleteShortCalls() {
    try {
        console.log(`\n🔍 Identifying calls under ${DURATION_THRESHOLD} seconds in the ${env.toUpperCase()} environment...`)

        // Find calls with duration under threshold
        const { data: shortCalls, error: findError } = await supabase
            .from('call_log')
            .select('id, RECORDING_URL, CALL_DURATION, CALL_NUMBER, EMPLOYEE_NAME')
            .lt('CALL_DURATION', DURATION_THRESHOLD)

        if (findError) {
            throw new Error(`Failed to find short calls: ${findError.message}`)
        }

        if (!shortCalls || shortCalls.length === 0) {
            console.log('✅ No calls found under the duration threshold.')
            return
        }

        console.log(`\n📊 Found ${shortCalls.length} calls with duration under ${DURATION_THRESHOLD} seconds:`)

        // Display the calls that will be deleted
        shortCalls.forEach((call, index) => {
            console.log(`${index + 1}. RECORDING_URL: ${call.RECORDING_URL || 'N/A'}`)
            console.log(`   CALL_DURATION: ${call.CALL_DURATION || 'N/A'} seconds`)
            console.log(`   CALL_NUMBER: ${call.CALL_NUMBER || 'N/A'}`)
            console.log(`   EMPLOYEE_NAME: ${call.EMPLOYEE_NAME || 'N/A'}`)
            console.log('   ---')
        })

        if (DRY_RUN) {
            console.log('\n⚠️ DRY RUN: No records will be deleted.')
            console.log(`Would delete ${shortCalls.length} call records and their associated documents.`)
            return
        }

        // Confirm deletion
        console.log('\n⚠️ WARNING: This operation will permanently delete the calls listed above and their associated documents.')
        console.log('This action CANNOT be undone!')
        console.log(`\nPress Ctrl+C to cancel, or wait 10 seconds to continue with deletion in the ${env.toUpperCase()} environment...`)

        // Wait for confirmation timeout
        await new Promise((resolve) => setTimeout(resolve, 10000))

        // First find associated documents for the calls
        console.log('\n🔍 Looking for associated documents...')

        // Extract recording URLs for document search
        const recordingUrls = shortCalls.map((call) => call.RECORDING_URL).filter(Boolean)

        // Find document IDs associated with these calls
        let documentIds = []

        // Try to find documents by checking metadata for recording URLs
        const { data: metadata, error: metadataError } = await supabase
            .from('document_metadata')
            .select('document_id, field_value')
            .in('field_name', ['RECORDING_URL', 'recording_url'])
            .in('field_value', recordingUrls)

        if (metadataError) {
            console.warn(`Warning: Could not find documents by metadata: ${metadataError.message}`)
        } else if (metadata && metadata.length > 0) {
            documentIds = metadata.map((m) => m.document_id)
            console.log(`Found ${documentIds.length} documents associated with short calls via metadata.`)
        }

        // Delete documents if found
        if (documentIds.length > 0) {
            console.log('\n🗑️ Deleting associated documents...')

            // Delete in batches to avoid query size limits
            const BATCH_SIZE = 20
            for (let i = 0; i < documentIds.length; i += BATCH_SIZE) {
                const batch = documentIds.slice(i, i + BATCH_SIZE)

                // First delete document metadata
                const { error: deleteMetadataError } = await supabase.from('document_metadata').delete().in('document_id', batch)

                if (deleteMetadataError) {
                    console.warn(
                        `Warning: Error deleting document metadata for batch ${i / BATCH_SIZE + 1}: ${deleteMetadataError.message}`
                    )
                }

                // Then delete document records
                const { error: deleteDocError } = await supabase.from('documents').delete().in('id', batch)

                if (deleteDocError) {
                    console.warn(`Warning: Error deleting documents for batch ${i / BATCH_SIZE + 1}: ${deleteDocError.message}`)
                } else {
                    console.log(`Deleted batch ${i / BATCH_SIZE + 1} of ${Math.ceil(documentIds.length / BATCH_SIZE)} document batches.`)
                }
            }
        } else {
            console.log('No associated documents found via metadata.')
        }

        // Delete the call records
        console.log('\n🗑️ Deleting call records...')

        // Delete in batches
        const callIds = shortCalls.map((call) => call.id)
        const BATCH_SIZE = 20

        for (let i = 0; i < callIds.length; i += BATCH_SIZE) {
            const batch = callIds.slice(i, i + BATCH_SIZE)

            const { error: deleteCallError } = await supabase.from('call_log').delete().in('id', batch)

            if (deleteCallError) {
                throw new Error(`Failed to delete call records in batch ${i / BATCH_SIZE + 1}: ${deleteCallError.message}`)
            }

            console.log(`Deleted batch ${i / BATCH_SIZE + 1} of ${Math.ceil(callIds.length / BATCH_SIZE)} call batches.`)
        }

        console.log(`\n✅ Successfully deleted ${shortCalls.length} calls with duration under ${DURATION_THRESHOLD} seconds.`)
    } catch (error) {
        console.error('❌ Error:', error.message)
        process.exit(1)
    }
}

// Run the script
deleteShortCalls()
