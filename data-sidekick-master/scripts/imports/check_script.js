// Save this as check_script.js
// Run with: ENV_FILE=.env.rds node check_script.js

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

async function checkDocumentCounts() {
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
        }

        // Create a set of already analyzed document IDs from metadata
        const analyzedIds = new Set((analyzedDocs || []).map((doc) => doc.document_id))
        console.log(`Found ${analyzedIds.size} already analyzed documents from metadata`)

        // Also check the call_log table for documents that have already been analyzed
        // First, get all recording URLs from document metadata
        const { data: recordingUrlMappings, error: recordingUrlError } = await supabase
            .from('document_metadata')
            .select('document_id, field_value')
            .eq('field_name', 'RECORDING_URL')

        if (recordingUrlError) {
            console.warn(`Warning: Could not fetch recording URLs: ${recordingUrlError.message}`)
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
        }

        // Create a set of recording URLs that have already been analyzed
        const analyzedRecordingUrls = new Set()
        if (callLogEntries) {
            for (const entry of callLogEntries) {
                if (entry.RECORDING_URL) {
                    analyzedRecordingUrls.add(entry.RECORDING_URL)
                    // Add document ID to analyzed IDs if we have a mapping
                    const docId = recordingUrlToDocId[entry.RECORDING_URL]
                    if (docId) {
                        analyzedIds.add(docId)
                    }
                }
            }
        }

        console.log(`Found ${analyzedIds.size} already analyzed documents after checking call_log`)
        console.log(`Found ${analyzedRecordingUrls.size} analyzed recording URLs`)

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
        console.log(`Documents that need analysis: ${totalDocs - analyzedIds.size}`)

        // Check for documents that have call_log entries but no metadata
        const docsWithCallLogButNoMetadata = []
        for (const [url, docId] of Object.entries(recordingUrlToDocId)) {
            if (analyzedRecordingUrls.has(url) && !analyzedDocs.some((doc) => doc.document_id === docId)) {
                docsWithCallLogButNoMetadata.push(docId)
            }
        }

        console.log(`Documents with call_log entries but no metadata: ${docsWithCallLogButNoMetadata.length}`)

        // Sample a few documents to check their status
        if (docsWithCallLogButNoMetadata.length > 0) {
            const sampleSize = Math.min(5, docsWithCallLogButNoMetadata.length)
            console.log(`\nSampling ${sampleSize} documents with call_log entries but no metadata:`)

            for (let i = 0; i < sampleSize; i++) {
                const docId = docsWithCallLogButNoMetadata[i]
                const { data: doc, error: docError } = await supabase.from('documents').select('id, title').eq('id', docId).single()

                if (docError) {
                    console.error(`Error fetching document ${docId}: ${docError.message}`)
                    continue
                }

                console.log(`Document ${i + 1}: ID=${doc.id}, Title=${doc.title}`)
            }
        }
    } catch (error) {
        console.error('Error checking document counts:', error)
    }
}

checkDocumentCounts()
