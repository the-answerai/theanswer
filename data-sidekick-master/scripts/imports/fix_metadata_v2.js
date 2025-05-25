// fix_metadata_v2.js
// Run with: ENV_FILE=.env.rds node fix_metadata_v2.js

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

// Setup ES module dirname equivalent
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
const envFile = process.env.ENV_FILE || '.env.local'
const envPath = path.resolve(process.cwd(), envFile)
console.log(`Loading environment from: ${envPath}`)
dotenv.config({ path: envPath })

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function fixMissingMetadata() {
    try {
        const dataSourceId = '19373c6f-95a0-48c0-bc0b-35ea8a1c7b50'

        // First, get document IDs that already have analysis_status metadata
        const { data: analyzedDocs, error: analyzedError } = await supabase
            .from('document_metadata')
            .select('document_id')
            .eq('field_name', 'analysis_status')
            .eq('field_value', 'completed')

        if (analyzedError) {
            console.warn(`Warning: Could not fetch analyzed documents from metadata: ${analyzedError.message}`)
            return
        }

        // Create a set of already analyzed document IDs from metadata
        const analyzedIds = new Set((analyzedDocs || []).map((doc) => doc.document_id))
        console.log(`Found ${analyzedIds.size} documents with analysis_status=completed metadata`)

        // Get all entries from call_log table
        const { data: callLogEntries, error: callLogError } = await supabase.from('call_log').select('RECORDING_URL')

        if (callLogError) {
            console.warn(`Warning: Could not fetch call_log entries: ${callLogError.message}`)
            return
        }

        console.log(`Found ${callLogEntries.length} entries in call_log table`)

        // Get all documents in the data source
        const { data: allDocuments, error: docsError } = await supabase
            .from('documents')
            .select('id, title, content')
            .eq('source_id', dataSourceId)
            .eq('status', 'processed')

        if (docsError) {
            console.warn(`Warning: Could not fetch documents: ${docsError.message}`)
            return
        }

        console.log(`Found ${allDocuments.length} documents in the data source`)

        // Create a map of document IDs to documents
        const documentsById = {}
        for (const doc of allDocuments) {
            documentsById[doc.id] = doc
        }

        // Create a map of recording URLs to document IDs
        const recordingUrlToDocId = {}
        for (const doc of allDocuments) {
            // Try to extract recording URL from title
            const titleMatch = doc.title?.match(/Call ((?:retaildatasystems_)?rec-[\w\d_.-]+\.mp3)/i)
            if (titleMatch?.length > 1) {
                let recordingUrl = titleMatch[1]
                // Add retaildatasystems_ prefix if needed
                if (!recordingUrl.startsWith('retaildatasystems_') && recordingUrl.startsWith('rec-')) {
                    recordingUrl = `retaildatasystems_${recordingUrl}`
                }
                recordingUrlToDocId[recordingUrl] = doc.id
            }
        }

        console.log(`Extracted ${Object.keys(recordingUrlToDocId).length} recording URLs from document titles`)

        // Get all recording URLs from document metadata to supplement our mapping
        const { data: recordingUrlMappings, error: recordingUrlError } = await supabase
            .from('document_metadata')
            .select('document_id, field_value')
            .eq('field_name', 'RECORDING_URL')

        if (recordingUrlError) {
            console.warn(`Warning: Could not fetch recording URLs from metadata: ${recordingUrlError.message}`)
        } else {
            // Add to our mapping
            for (const mapping of recordingUrlMappings) {
                recordingUrlToDocId[mapping.field_value] = mapping.document_id
            }
            console.log(`Added ${recordingUrlMappings.length} recording URLs from metadata`)
        }

        // Find documents that have call_log entries but no analysis_status metadata
        const docsToFix = []
        for (const entry of callLogEntries) {
            if (entry.RECORDING_URL) {
                const docId = recordingUrlToDocId[entry.RECORDING_URL]
                if (docId && !analyzedIds.has(docId)) {
                    // Verify the document exists
                    if (documentsById[docId]) {
                        docsToFix.push({ docId, recordingUrl: entry.RECORDING_URL, title: documentsById[docId].title })
                    } else {
                        console.warn(`Warning: Document ID ${docId} for recording URL ${entry.RECORDING_URL} not found in documents table`)
                    }
                }
            }
        }

        console.log(`Found ${docsToFix.length} documents with call_log entries but no analysis_status metadata`)

        if (docsToFix.length === 0) {
            console.log('No documents need fixing. Exiting.')
            return
        }

        // Print some sample documents for debugging
        console.log('\nSample documents that need fixing:')
        for (let i = 0; i < Math.min(5, docsToFix.length); i++) {
            console.log(`${i + 1}. Document ID: ${docsToFix[i].docId}, Title: ${docsToFix[i].title}`)
            console.log(`   Recording URL: ${docsToFix[i].recordingUrl}`)
        }

        // Add analysis_status metadata for these documents
        console.log('\nAdding analysis_status metadata for these documents...')
        const timestamp = new Date().toISOString()

        // Process one document at a time to better track issues
        let successCount = 0
        let errorCount = 0

        for (let i = 0; i < docsToFix.length; i++) {
            const { docId, recordingUrl } = docsToFix[i]
            console.log(`Processing document ${i + 1}/${docsToFix.length}: ${docId}`)

            // First check if the document already has an analysis_status entry
            const { data: existingStatus, error: statusCheckError } = await supabase
                .from('document_metadata')
                .select('id, field_value')
                .eq('document_id', docId)
                .eq('field_name', 'analysis_status')

            if (statusCheckError) {
                console.error(`  Error checking existing status: ${statusCheckError.message}`)
                errorCount++
                continue
            }

            if (existingStatus && existingStatus.length > 0) {
                console.log(`  Document already has analysis_status: ${existingStatus[0].field_value}`)

                // If it's not 'completed', update it
                if (existingStatus[0].field_value !== 'completed') {
                    const { error: updateError } = await supabase
                        .from('document_metadata')
                        .update({ field_value: 'completed', updated_at: timestamp })
                        .eq('id', existingStatus[0].id)

                    if (updateError) {
                        console.error(`  Error updating status: ${updateError.message}`)
                        errorCount++
                    } else {
                        console.log(`  Updated status to 'completed'`)
                        successCount++
                    }
                } else {
                    console.log(`  Status already set to 'completed', no update needed`)
                    successCount++
                }
            } else {
                // Insert new entry
                const metadataEntry = {
                    document_id: docId,
                    field_name: 'analysis_status',
                    field_value: 'completed',
                    is_predefined: true,
                    created_at: timestamp,
                    updated_at: timestamp
                }

                const { error: insertError } = await supabase.from('document_metadata').insert(metadataEntry)

                if (insertError) {
                    console.error(`  Error inserting metadata: ${insertError.message}`)

                    // Log more details about the error
                    console.error(`  Error details: ${JSON.stringify(insertError)}`)

                    // Check if the document exists
                    const { data: docCheck, error: docCheckError } = await supabase.from('documents').select('id').eq('id', docId).single()

                    if (docCheckError) {
                        console.error(`  Error checking document: ${docCheckError.message}`)
                    } else if (!docCheck) {
                        console.error(`  Document ${docId} does not exist in the documents table`)
                    } else {
                        console.log(`  Document ${docId} exists in the documents table`)
                    }

                    errorCount++
                } else {
                    console.log(`  Successfully added metadata`)
                    successCount++
                }
            }
        }

        console.log('\nMetadata update complete!')
        console.log(`Successfully processed ${successCount} documents`)
        console.log(`Failed to process ${errorCount} documents`)

        // Verify the fix
        const { data: updatedDocs, error: updatedError } = await supabase
            .from('document_metadata')
            .select('document_id')
            .eq('field_name', 'analysis_status')
            .eq('field_value', 'completed')

        if (updatedError) {
            console.warn(`Warning: Could not verify fix: ${updatedError.message}`)
            return
        }

        const updatedCount = (updatedDocs || []).length
        console.log(`After fix: ${updatedCount} documents have analysis_status=completed metadata`)
        console.log(`Added metadata for ${updatedCount - analyzedIds.size} documents`)

        // Get total count of documents in the data source
        const { count: totalDocs, error: totalError } = await supabase
            .from('documents')
            .select('*', { count: 'exact', head: true })
            .eq('source_id', dataSourceId)
            .eq('status', 'processed')

        if (totalError) {
            console.error(`Error fetching total document count: ${totalError.message}`)
            return
        }

        console.log(`\nTotal documents in data source: ${totalDocs}`)
        console.log(`Documents that need analysis: ${totalDocs - updatedCount}`)
    } catch (error) {
        console.error('Error fixing metadata:', error)
    }
}

fixMissingMetadata()
