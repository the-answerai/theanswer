import fs from 'node:fs'
import path from 'node:path'
import csv from 'csv-parser'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import { v4 as uuidv4 } from 'uuid'

// Setup ES module dirname equivalent
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
dotenv.config({ path: '.env.local' })

// Validate environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing required environment variables')
    console.error('Make sure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
    process.exit(1)
}

// Initialize Supabase client with service role for admin access
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// Configuration
const projectRoot = path.join(__dirname, '..')
const WOW_CALLS_CSV = path.join(projectRoot, 'csv', 'wow-calls.csv')
const BATCH_SIZE = 10

/**
 * Create a new data source if it doesn't exist for the WOW calls
 */
async function createDataSource(researchViewId) {
    // Check if a data source for WOW calls already exists
    const { data: existingSource, error: sourceError } = await supabase
        .from('data_sources')
        .select('id')
        .eq('research_view_id', researchViewId)
        .eq('source_type', 'audio')
        .ilike('file_path', '%wow-calls%')
        .single()

    if (sourceError && sourceError.code !== 'PGRST116') {
        console.error('Error checking for existing source:', sourceError)
        throw sourceError
    }

    if (existingSource) {
        console.log(`Using existing data source: ${existingSource.id}`)
        return existingSource.id
    }

    // Create a new data source for WOW calls
    const { data: newSource, error: createError } = await supabase
        .from('data_sources')
        .insert({
            research_view_id: researchViewId,
            source_type: 'audio',
            file_path: 'csv/wow-calls.csv',
            status: 'completed',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
        .select()
        .single()

    if (createError) {
        console.error('Error creating data source:', createError)
        throw createError
    }

    console.log(`Created new data source: ${newSource.id}`)
    return newSource.id
}

/**
 * Process a batch of call records
 */
async function processBatch(batch, sourceId) {
    console.log(`Processing batch of ${batch.length} records...`)

    const results = []
    const errors = []

    for (const record of batch) {
        try {
            console.log(`Processing record for Call ID: ${record.CallId}...`)

            // Prepare the document record
            const documentId = uuidv4()
            const transcript = record.CallTranscript || record.CallTranscript2 || ''

            // Calculate word and token counts
            const wordCount = transcript.split(/\s+/).length
            const tokenCount = Math.ceil(wordCount * 1.3) // Rough estimate

            // Prepare the title
            const callDate = record.Date ? new Date(record.Date).toISOString().split('T')[0] : 'Unknown Date'
            const title = `Call ${record.CallId} - ${callDate}`

            // Create the document
            const documentRecord = {
                id: documentId,
                source_id: sourceId,
                title: title,
                url: null,
                author: record.AdvertiserName || record.OrgGroup || 'WOW Inc',
                publication_date: record.Date ? new Date(record.Date).toISOString() : null,
                content: transcript,
                content_summary: transcript.substring(0, 200) + (transcript.length > 200 ? '...' : ''),
                token_count: tokenCount,
                word_count: wordCount,
                file_type: 'transcript',
                category_ai: record.CallType || 'call',
                category_user: null,
                status: 'processed',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }

            // Insert the document
            const { error: documentError } = await supabase.from('documents').insert([documentRecord])

            if (documentError) {
                throw new Error(`Failed to insert document: ${documentError.message}`)
            }

            // Create metadata entries from all other fields in the record
            const metadataEntries = []

            for (const [key, value] of Object.entries(record)) {
                // Skip the fields already used in the document record or empty values
                if (!value || key === 'CallTranscript' || key === 'CallTranscript2') continue

                metadataEntries.push({
                    document_id: documentId,
                    field_name: key,
                    field_value: String(value),
                    is_predefined: false,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
            }

            // Add special fields for call analysis
            if (record.CallTags) {
                metadataEntries.push({
                    document_id: documentId,
                    field_name: 'tags',
                    field_value: record.CallTags,
                    is_predefined: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
            }

            if (record.Duration) {
                metadataEntries.push({
                    document_id: documentId,
                    field_name: 'call_duration',
                    field_value: record.Duration,
                    is_predefined: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
            }

            // Insert metadata entries if there are any
            if (metadataEntries.length > 0) {
                const { error: metadataError } = await supabase.from('document_metadata').insert(metadataEntries)

                if (metadataError) {
                    throw new Error(`Failed to insert metadata: ${metadataError.message}`)
                }
            }

            results.push(record.CallId)
            console.log(`Successfully processed Call ID: ${record.CallId}`)
        } catch (error) {
            console.error(`Error processing Call ID ${record.CallId}:`, error)
            errors.push({ id: record.CallId, error: error.message })
        }
    }

    return { results, errors }
}

/**
 * Main function to process the WOW calls CSV file
 */
async function main() {
    try {
        // Check if the CSV file exists
        if (!fs.existsSync(WOW_CALLS_CSV)) {
            console.error(`WOW calls CSV file not found: ${WOW_CALLS_CSV}`)
            process.exit(1)
        }

        // Ask for the research view ID
        const args = process.argv.slice(2)
        const researchViewId = args[0]

        if (!researchViewId) {
            console.error('Please provide a research view ID as the first argument')
            console.error('Usage: node import_wow_calls.js <research_view_id>')
            process.exit(1)
        }

        // Create or get the data source for WOW calls
        const sourceId = await createDataSource(researchViewId)

        // Read and process the CSV file
        const records = []
        await new Promise((resolve, reject) => {
            fs.createReadStream(WOW_CALLS_CSV)
                .pipe(csv())
                .on('data', (data) => records.push(data))
                .on('end', resolve)
                .on('error', reject)
        })

        console.log(`Found ${records.length} records to process`)

        // Process in batches
        const batches = []
        for (let i = 0; i < records.length; i += BATCH_SIZE) {
            batches.push(records.slice(i, Math.min(i + BATCH_SIZE, records.length)))
        }

        let successCount = 0
        let errorCount = 0

        for (let i = 0; i < batches.length; i++) {
            console.log(`Processing batch ${i + 1} of ${batches.length}...`)
            const { results, errors } = await processBatch(batches[i], sourceId)
            successCount += results.length
            errorCount += errors.length

            // Log errors for this batch
            if (errors.length > 0) {
                console.error('\nErrors in this batch:')
                for (const { id, error } of errors) {
                    console.error(`- ${id}: ${error}`)
                }
            }

            // Show progress
            console.log(`\nProgress: ${successCount}/${records.length} processed successfully (${errorCount} errors)\n`)
        }

        console.log('\nProcessing complete!')
        console.log(`Successfully processed: ${successCount}`)
        console.log(`Errors: ${errorCount}`)
    } catch (error) {
        console.error('Fatal error:', error)
        process.exit(1)
    }
}

// Run the script
main()
