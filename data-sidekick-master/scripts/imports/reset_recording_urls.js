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
const BATCH_SIZE = 50 // Process 50 documents at a time

/**
 * Reset RECORDING_URL entries for documents in batches
 */
async function resetRecordingUrlsInBatches(documentIds) {
    let totalDeleted = 0
    const batches = []

    // Split document IDs into batches
    for (let i = 0; i < documentIds.length; i += BATCH_SIZE) {
        batches.push(documentIds.slice(i, Math.min(i + BATCH_SIZE, documentIds.length)))
    }

    console.log(`Processing ${documentIds.length} documents in ${batches.length} batches...`)

    for (let i = 0; i < batches.length; i++) {
        const batch = batches[i]
        console.log(`Processing batch ${i + 1} of ${batches.length} (${batch.length} documents)...`)

        const { error, count } = await supabase
            .from('document_metadata')
            .delete()
            .eq('field_name', 'RECORDING_URL')
            .in('document_id', batch)

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
 * Reset RECORDING_URL entries for all documents
 */
async function resetRecordingUrls() {
    try {
        // Get command line arguments
        const args = process.argv.slice(2)
        const dataSourceId = args[0] // Optional data source ID to filter by

        console.log('Resetting RECORDING_URL entries...')

        // If no data source ID is provided, delete all RECORDING_URL entries
        if (!dataSourceId) {
            console.log('No data source ID provided, resetting all documents')

            const { error, count } = await supabase.from('document_metadata').delete().eq('field_name', 'RECORDING_URL')

            if (error) {
                throw new Error(`Failed to delete RECORDING_URL metadata: ${error.message}`)
            }

            console.log(`Successfully reset RECORDING_URL for ${count || 0} documents`)
            return
        }

        // If a data source ID is provided, get the document IDs for that source
        console.log(`Filtering by data source ID: ${dataSourceId}`)

        const { data: documents, error: docError } = await supabase.from('documents').select('id').eq('source_id', dataSourceId)

        if (docError) {
            throw new Error(`Failed to fetch documents: ${docError.message}`)
        }

        if (!documents || documents.length === 0) {
            console.log(`No documents found for data source ID: ${dataSourceId}`)
            return
        }

        const documentIds = documents.map((doc) => doc.id)
        console.log(`Found ${documentIds.length} documents for the specified data source`)

        // Process in batches
        const totalDeleted = await resetRecordingUrlsInBatches(documentIds)

        console.log(`Successfully reset RECORDING_URL for ${totalDeleted} documents`)
    } catch (error) {
        console.error('Error:', error)
        process.exit(1)
    }
}

// Run the script
resetRecordingUrls()
