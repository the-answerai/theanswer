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
 * Check call_log table structure and entries
 */
async function checkCallLogStructure() {
    try {
        console.log('Checking call_log table structure and entries...')

        // Get a sample call_log entry to examine its structure
        const { data: callLogs, error: callLogsError } = await supabase.from('call_log').select('*').limit(1)

        if (callLogsError) {
            throw new Error(`Failed to fetch call_log entries: ${callLogsError.message}`)
        }

        if (!callLogs || callLogs.length === 0) {
            console.log('No call_log entries found')
            return
        }

        // Get the structure of the call_log table
        const sampleEntry = callLogs[0]
        console.log('\nCall Log Table Structure:')
        const fields = Object.keys(sampleEntry)
        for (const field of fields) {
            const value = sampleEntry[field]
            const valueType = value !== null ? typeof value : 'null'
            console.log(
                `- ${field}: ${valueType} ${
                    value !== null
                        ? `(Example: ${JSON.stringify(value).substring(0, 50)}${JSON.stringify(value).length > 50 ? '...' : ''})`
                        : ''
                }`
            )
        }

        // Get all call_log entries to check for missing values
        const { data: allCallLogs, error: allCallLogsError } = await supabase.from('call_log').select('*')

        if (allCallLogsError) {
            throw new Error(`Failed to fetch all call_log entries: ${allCallLogsError.message}`)
        }

        if (!allCallLogs || allCallLogs.length === 0) {
            console.log('No call_log entries found for missing value analysis')
            return
        }

        // Check for missing values in each field
        console.log('\nMissing Values Analysis:')
        const totalEntries = allCallLogs.length
        for (const field of fields) {
            const missingCount = allCallLogs.filter((log) => log[field] === null || log[field] === undefined).length
            const missingPercentage = (missingCount / totalEntries) * 100
            console.log(`- ${field}: ${missingCount}/${totalEntries} missing (${missingPercentage.toFixed(2)}%)`)
        }

        // Check a sample document to see what fields are available
        const { data: documents, error: documentsError } = await supabase.from('documents').select('*').limit(1)

        if (documentsError) {
            throw new Error(`Failed to fetch documents: ${documentsError.message}`)
        }

        if (!documents || documents.length === 0) {
            console.log('No documents found')
            return
        }

        // Get the structure of the documents table
        const sampleDocument = documents[0]
        console.log('\nDocuments Table Structure:')
        const documentFields = Object.keys(sampleDocument)
        for (const field of documentFields) {
            const value = sampleDocument[field]
            const valueType = value !== null ? typeof value : 'null'
            console.log(
                `- ${field}: ${valueType} ${
                    value !== null
                        ? `(Example: ${JSON.stringify(value).substring(0, 50)}${JSON.stringify(value).length > 50 ? '...' : ''})`
                        : ''
                }`
            )
        }

        // Check document_metadata for a sample document
        const { data: metadata, error: metadataError } = await supabase
            .from('document_metadata')
            .select('field_name, field_value')
            .eq('document_id', sampleDocument.id)

        if (metadataError) {
            throw new Error(`Failed to fetch document metadata: ${metadataError.message}`)
        }

        console.log('\nDocument Metadata Fields:')
        if (metadata && metadata.length > 0) {
            for (const item of metadata) {
                console.log(
                    `- ${item.field_name}: ${
                        item.field_value ? item.field_value.substring(0, 50) + (item.field_value.length > 50 ? '...' : '') : 'null'
                    }`
                )
            }
        } else {
            console.log('No metadata found for the sample document')
        }
    } catch (error) {
        console.error('Error:', error)
        process.exit(1)
    }
}

// Run the script
checkCallLogStructure()
