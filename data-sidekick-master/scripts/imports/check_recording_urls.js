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
 * Check RECORDING_URL entries
 */
async function checkRecordingUrls() {
    try {
        // Get command line arguments
        const args = process.argv.slice(2)
        const dataSourceId = args[0] // Optional data source ID to filter by

        console.log('Checking RECORDING_URL entries...')

        // Get all RECORDING_URL entries
        const { data: urlEntries, error: urlError } = await supabase
            .from('document_metadata')
            .select('id, document_id, field_value')
            .eq('field_name', 'RECORDING_URL')

        if (urlError) {
            throw new Error(`Failed to fetch RECORDING_URL entries: ${urlError.message}`)
        }

        console.log(`Found ${urlEntries?.length || 0} total RECORDING_URL entries`)

        // If no data source ID is provided, we're done
        if (!dataSourceId) {
            // Show a sample of the entries
            if (urlEntries && urlEntries.length > 0) {
                console.log('\nSample entries:')
                const sampleSize = Math.min(5, urlEntries.length)
                for (let i = 0; i < sampleSize; i++) {
                    console.log(`- Document ID: ${urlEntries[i].document_id}, URL: ${urlEntries[i].field_value}`)
                }
            }
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

        // Create a set of document IDs for the specified data source
        const documentIdSet = new Set(documents.map((doc) => doc.id))
        console.log(`Found ${documentIdSet.size} documents for the specified data source`)

        // Filter URL entries to only include those for the specified data source
        const filteredEntries = urlEntries?.filter((entry) => documentIdSet.has(entry.document_id)) || []
        console.log(`Found ${filteredEntries.length} RECORDING_URL entries for the specified data source`)

        // Show a sample of the entries
        if (filteredEntries.length > 0) {
            console.log('\nSample entries:')
            const sampleSize = Math.min(5, filteredEntries.length)
            for (let i = 0; i < sampleSize; i++) {
                console.log(`- Document ID: ${filteredEntries[i].document_id}, URL: ${filteredEntries[i].field_value}`)
            }
        }
    } catch (error) {
        console.error('Error:', error)
        process.exit(1)
    }
}

// Run the script
checkRecordingUrls()
