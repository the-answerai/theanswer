// fix_metadata.js
// Run with: ENV_FILE=.env.rds node fix_metadata.js

import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'

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

        // Get all recording URLs from document metadata
        const { data: recordingUrlMappings, error: recordingUrlError } = await supabase
            .from('document_metadata')
            .select('document_id, field_value')
            .eq('field_name', 'RECORDING_URL')

        if (recordingUrlError) {
            console.warn(`Warning: Could not fetch recording URLs: ${recordingUrlError.message}`)
            return
        }

        // Create a map of recording URLs to document IDs
        const recordingUrlToDocId = {}
        if (recordingUrlMappings) {
            for (const mapping of recordingUrlMappings) {
                recordingUrlToDocId[mapping.field_value] = mapping.document_id
            }
        }

        // Get all entries from call_log table
        const { data: callLogEntries, error: callLogError } = await supabase.from('call_log').select('RECORDING_URL, summary')

        if (callLogError) {
            console.warn(`Warning: Could not fetch call_log entries: ${callLogError.message}`)
            return
        }

        // Find documents that have call_log entries but no analysis_status metadata
        const docsToFix = []
        for (const entry of callLogEntries || []) {
            if (entry.RECORDING_URL) {
                const docId = recordingUrlToDocId[entry.RECORDING_URL]
                if (docId && !analyzedIds.has(docId)) {
                    docsToFix.push({ docId, recordingUrl: entry.RECORDING_URL })
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
            console.log(`${i + 1}. Document ID: ${docsToFix[i].docId}, Recording URL: ${docsToFix[i].recordingUrl}`)

            // Get document details
            const { data: doc, error: docError } = await supabase.from('documents').select('title').eq('id', docsToFix[i].docId).single()

            if (docError) {
                console.log(`   Error fetching document details: ${docError.message}`)
            } else if (doc) {
                console.log(`   Title: ${doc.title}`)
            }

            // Check if document already has any metadata
            const { data: existingMeta, error: metaError } = await supabase
                .from('document_metadata')
                .select('field_name, field_value')
                .eq('document_id', docsToFix[i].docId)
                .limit(5)

            if (metaError) {
                console.log(`   Error fetching existing metadata: ${metaError.message}`)
            } else if (existingMeta && existingMeta.length > 0) {
                console.log(`   Existing metadata: ${existingMeta.map((m) => `${m.field_name}=${m.field_value}`).join(', ')}`)
            } else {
                console.log(`   No existing metadata found`)
            }
        }

        // Add analysis_status metadata for these documents
        console.log('\nAdding analysis_status metadata for these documents...')
        const timestamp = new Date().toISOString()

        // Process one document at a time to better track issues
        let successCount = 0
        let errorCount = 0

        for (let i = 0; i < docsToFix.length; i++) {
            const docId = docsToFix[i].docId
            console.log(`Processing document ${i + 1}/${docsToFix.length}: ${docId}`)

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
                errorCount++
            } else {
                console.log(`  Successfully added metadata`)
                successCount++
            }
        }

        console.log('\nMetadata update complete!')
        console.log(`Successfully added metadata for ${successCount} documents`)
        console.log(`Failed to add metadata for ${errorCount} documents`)

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

        // Now let's run the analyze-transcriptions script with a limit of 0 to see if it finds any documents to analyze
        console.log('\nChecking if there are still documents to analyze...')

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

        console.log(`Total documents in data source: ${totalDocs}`)
        console.log(`Documents that need analysis: ${totalDocs - updatedCount}`)
    } catch (error) {
        console.error('Error fixing metadata:', error)
    }
}

fixMissingMetadata()
