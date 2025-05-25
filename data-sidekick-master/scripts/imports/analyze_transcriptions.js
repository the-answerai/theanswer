import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
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
if (
    !process.env.SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY ||
    !process.env.ANSWERAI_ENDPOINT ||
    !process.env.ANSWERAI_ANALYSIS_CHATFLOW
) {
    console.error('Missing required environment variables')
    console.error('Make sure SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANSWERAI_ENDPOINT, and ANSWERAI_ANALYSIS_CHATFLOW are set')
    process.exit(1)
}

// Initialize Supabase client with service role for admin access
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// Configuration
const BATCH_SIZE = 20
const API_CALL_TIMEOUT = 60000 // 60 seconds
const MAX_CONCURRENT_REQUESTS = 5 // Maximum number of concurrent requests to AnswerAI API
const REANALYSIS_MODES = {
    EMPTY_TAGS: 'empty_tags',
    CUSTOM_FILTER: 'custom_filter'
}

/**
 * Helper function to process tasks with limited concurrency
 * @param {Array} tasks - Array of async functions to execute
 * @param {number} concurrency - Maximum number of concurrent tasks
 * @returns {Promise<Array>} - Results of all tasks
 */
async function processWithConcurrency(tasks, concurrency = MAX_CONCURRENT_REQUESTS) {
    const results = []
    const runningTasks = new Set()

    // Process tasks with limited concurrency
    for (const task of tasks) {
        // If we've reached the concurrency limit, wait for one task to complete
        if (runningTasks.size >= concurrency) {
            await Promise.race(runningTasks)
        }

        // Create and start a new task
        const runningTask = (async () => {
            try {
                const result = await task()
                results.push(result)
                return result
            } finally {
                runningTasks.delete(runningTask)
            }
        })()

        runningTasks.add(runningTask)
    }

    // Wait for all remaining tasks to complete
    await Promise.all(runningTasks)

    return results
}

/**
 * Call the AnswerAI endpoint to analyze a transcript
 */
async function analyzeTranscript(transcript, documentId, exampleJson = null) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_CALL_TIMEOUT)

    try {
        // Prepare the request body
        const requestBody = {
            question: transcript,
            promtValues: {}
        }

        // If exampleJson is provided, include it in the request
        if (exampleJson) {
            requestBody.exampleJson = exampleJson
        }

        const response = await fetch(`${process.env.ANSWERAI_ENDPOINT}/prediction/${process.env.ANSWERAI_ANALYSIS_CHATFLOW}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${process.env.ANSWERAI_TOKEN}`
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal
        })

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`AnswerAI returned status ${response.status}: ${errorText}`)
        }

        const result = await response.json()
        let parsed

        if (result.json) {
            parsed = result.json
        } else if (result.text) {
            const rawReply = result.text.trim()
            try {
                parsed = JSON.parse(rawReply)
            } catch (e) {
                const jsonMatch = rawReply.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
                if (jsonMatch) {
                    parsed = JSON.parse(jsonMatch[1].trim())
                } else {
                    throw new Error(`Could not parse JSON from AnswerAI response:\n${rawReply}`)
                }
            }
        } else {
            throw new Error('No JSON or text field returned from AnswerAI')
        }

        return parsed
    } catch (error) {
        if (error.name === 'AbortError') {
            console.error(`Analysis timed out for document: ${documentId}`)
        } else {
            console.error(`Error analyzing document ${documentId}: ${error.message}`)
        }

        // Return a default analysis object if the API call fails
        return {
            summary: 'Failed to analyze transcript due to an error.',
            coaching: 'No coaching available due to analysis failure.',
            tags: ['analysis_failed'],
            sentiment_score: 5, // Neutral score
            resolution_status: 'unresolved',
            escalated: false,
            call_type: 'unknown',
            persona: null
        }
    } finally {
        clearTimeout(timeoutId)
    }
}

/**
 * Update the call_log table with analysis results
 */
async function updateCallLog(documentId, analysis, recordingUrl) {
    // Map resolution status to expected format if needed
    let resolutionStatus = analysis.resolution_status
    if (resolutionStatus) {
        // Convert to lowercase and normalize
        resolutionStatus = resolutionStatus.toLowerCase()
        if (!['resolved', 'followup', 'unresolved'].includes(resolutionStatus)) {
            // Map other values to one of the expected values
            if (resolutionStatus.includes('resolve') || resolutionStatus.includes('complete')) {
                resolutionStatus = 'resolved'
            } else if (resolutionStatus.includes('follow') || resolutionStatus.includes('pending')) {
                resolutionStatus = 'followup'
            } else {
                resolutionStatus = 'unresolved'
            }
        }
    }

    // Ensure sentiment score is a number between 1 and 10
    let sentimentScore = analysis.sentiment_score
    if (sentimentScore !== null && sentimentScore !== undefined) {
        // Convert to number if it's a string
        sentimentScore = Number(sentimentScore)
        // Ensure it's between 1 and 10
        if (!Number.isNaN(sentimentScore)) {
            sentimentScore = Math.max(1, Math.min(10, sentimentScore))
        }
    }

    // Get document details
    const { data: document, error: documentError } = await supabase.from('documents').select('*').eq('id', documentId).single()

    if (documentError) {
        throw new Error(`Failed to fetch document: ${documentError.message}`)
    }

    // Get all metadata for the document
    const { data: metadataEntries, error: metadataError } = await supabase
        .from('document_metadata')
        .select('field_name, field_value')
        .eq('document_id', documentId)

    if (metadataError) {
        throw new Error(`Failed to fetch document metadata: ${metadataError.message}`)
    }

    // Convert metadata entries to a map for easy access
    const metadata = {}
    if (metadataEntries && metadataEntries.length > 0) {
        for (const entry of metadataEntries) {
            metadata[entry.field_name] = entry.field_value
        }
    }

    // Extract filename from the recording URL if not available in metadata
    let filename = metadata.filename || metadata.FILENAME
    if (!filename && recordingUrl) {
        // The recording URL might be the filename itself
        filename = recordingUrl.split('/').pop()
    }

    // Extract call duration from metadata
    let callDuration = metadata.call_duration || metadata.CALL_DURATION
    if (callDuration) {
        callDuration = Number(callDuration)
        if (Number.isNaN(callDuration)) {
            callDuration = null
        }
    }

    // Extract employee ID from metadata
    let employeeId = metadata.employee_id || metadata.EMPLOYEE_ID
    if (employeeId) {
        employeeId = Number(employeeId)
        if (Number.isNaN(employeeId)) {
            employeeId = null
        }
    }

    // Prepare the record for database
    const dbRecord = {
        RECORDING_URL: recordingUrl,
        summary: analysis.summary,
        coaching: analysis.coaching,
        TAGS_ARRAY: analysis.tags || [],
        TAGS: (analysis.tags || []).join(','),
        sentiment_score: sentimentScore,
        resolution_status: resolutionStatus,
        escalated: analysis.escalated,
        CALL_TYPE: analysis.call_type || 'unknown',
        persona: analysis.persona || null,
        // Add additional fields from document and metadata
        TRANSCRIPTION: document.content,
        FILENAME: filename,
        CALL_DURATION: callDuration,
        EMPLOYEE_ID: employeeId,
        EMPLOYEE_NAME: metadata.employee_name || metadata.EMPLOYEE_NAME || document.author,
        CALL_NUMBER: metadata.call_number || metadata.CALL_NUMBER,
        CALLER_NAME: metadata.caller_name || metadata.CALLER_NAME,
        ANSWERED_BY: metadata.answered_by || metadata.ANSWERED_BY,
        WORD_TIMESTAMPS: metadata.word_timestamps || metadata.WORD_TIMESTAMPS
    }

    // Convert WORD_TIMESTAMPS from string to object if needed
    if (dbRecord.WORD_TIMESTAMPS && typeof dbRecord.WORD_TIMESTAMPS === 'string') {
        try {
            dbRecord.WORD_TIMESTAMPS = JSON.parse(dbRecord.WORD_TIMESTAMPS)
        } catch (e) {
            console.warn(`Warning: Could not parse WORD_TIMESTAMPS as JSON: ${e.message}`)
            dbRecord.WORD_TIMESTAMPS = null
        }
    }

    // Check if a call_log entry already exists
    const { data: existingCall, error: checkError } = await supabase.from('call_log').select('*').eq('RECORDING_URL', recordingUrl).single()

    if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 is "not found"
        console.warn(`Warning: Error checking for existing call_log: ${checkError.message}`)
    }

    // If the call exists, preserve any existing fields that aren't being updated
    if (existingCall) {
        console.log(`Updating existing call_log entry for ${recordingUrl}`)

        // Preserve existing fields that aren't being updated by analysis
        const fieldsToPreserve = [
            'EMPLOYEE_ID',
            'EMPLOYEE_NAME',
            'CALL_NUMBER',
            'CALLER_NAME',
            'CALL_DURATION',
            'ANSWERED_BY',
            'WORD_TIMESTAMPS',
            'FILENAME',
            'TRANSCRIPTION'
        ]

        for (const field of fieldsToPreserve) {
            if (
                existingCall[field] !== null &&
                existingCall[field] !== undefined &&
                (dbRecord[field] === null || dbRecord[field] === undefined)
            ) {
                dbRecord[field] = existingCall[field]
            }
        }
    } else {
        console.log(`Creating new call_log entry for ${recordingUrl}`)
    }

    // Insert or update the record in the database
    const { error: upsertError } = await supabase.from('call_log').upsert(dbRecord, {
        onConflict: 'RECORDING_URL',
        ignoreDuplicates: false
    })

    if (upsertError) throw upsertError
}

/**
 * Update document_metadata with analysis results
 */
async function updateDocumentMetadata(documentId, analysis) {
    // Create metadata entries from analysis fields
    const metadataEntries = []
    const timestamp = new Date().toISOString()

    // Map analysis fields to metadata entries
    const fieldMappings = {
        summary: { name: 'summary', isPredefined: true },
        coaching: { name: 'coaching', isPredefined: true },
        tags: {
            name: 'tags',
            isPredefined: true,
            transform: (arr) => arr.join(',')
        },
        sentiment_score: { name: 'sentiment_score', isPredefined: true },
        resolution_status: { name: 'resolution_status', isPredefined: true },
        escalated: { name: 'escalated', isPredefined: true },
        call_type: { name: 'call_type', isPredefined: true },
        persona: { name: 'persona', isPredefined: true }
    }

    // Create metadata entries for each field in the analysis
    for (const [key, config] of Object.entries(fieldMappings)) {
        if (analysis[key] !== undefined) {
            const value = config.transform ? config.transform(analysis[key]) : analysis[key]

            metadataEntries.push({
                document_id: documentId,
                field_name: config.name,
                field_value: String(value),
                is_predefined: config.isPredefined,
                created_at: timestamp,
                updated_at: timestamp
            })
        }
    }

    // First check if entries already exist and delete them
    if (metadataEntries.length > 0) {
        const fieldNames = metadataEntries.map((entry) => entry.field_name)

        const { error: deleteError } = await supabase
            .from('document_metadata')
            .delete()
            .eq('document_id', documentId)
            .in('field_name', fieldNames)

        if (deleteError) {
            throw new Error(`Failed to delete existing metadata: ${deleteError.message}`)
        }

        // Insert new metadata entries
        const { error: insertError } = await supabase.from('document_metadata').insert(metadataEntries)

        if (insertError) {
            throw new Error(`Failed to insert metadata: ${insertError.message}`)
        }
    }
}

/**
 * Process a batch of documents
 */
async function processBatch(batch, exampleJson) {
    console.log(`Processing batch of ${batch.length} documents in parallel (max ${MAX_CONCURRENT_REQUESTS} concurrent)...`)

    const results = []
    const errors = []

    // Create task functions for each document
    const tasks = batch.map((document) => async () => {
        try {
            console.log(`Starting processing for document: ${document.id} - ${document.title}...`)

            // Handle pseudo-documents created during reanalysis
            let recordingUrl = null
            if (document.isPseudoDocument && document.recordingUrl) {
                // For pseudo-documents, use the recordingUrl directly
                recordingUrl = document.recordingUrl
                console.log(`Using recording URL from pseudo-document: ${recordingUrl}`)
            } else {
                // Get recording URL from metadata if available
                const { data: metadata, error: metadataError } = await supabase
                    .from('document_metadata')
                    .select('field_value')
                    .eq('document_id', document.id)
                    .eq('field_name', 'RECORDING_URL')
                    .single()

                if (!metadataError && metadata) {
                    recordingUrl = metadata.field_value
                }

                // If no recording URL found, extract it from the document title or use document ID as fallback
                if (!recordingUrl) {
                    // Try to extract recording URL from title (assuming format like "Call rec-1002_12535652441-20250210T161053Z.mp3 - ...")
                    const titleMatch = document.title?.match(/Call ((?:retaildatasystems_)?rec-[\w\d_.-]+\.mp3)/i)
                    if (titleMatch?.length > 1) {
                        recordingUrl = titleMatch[1]

                        // If the URL doesn't start with "retaildatasystems_" but should, add it
                        if (!recordingUrl.startsWith('retaildatasystems_') && recordingUrl.startsWith('rec-')) {
                            recordingUrl = `retaildatasystems_${recordingUrl}`
                        }
                    } else {
                        recordingUrl = `document_${document.id}`
                    }

                    // Add RECORDING_URL metadata to the document
                    const timestamp = new Date().toISOString()
                    const { error: recordingUrlError } = await supabase.from('document_metadata').insert({
                        document_id: document.id,
                        field_name: 'RECORDING_URL',
                        field_value: recordingUrl,
                        is_predefined: true,
                        created_at: timestamp,
                        updated_at: timestamp
                    })

                    if (recordingUrlError) {
                        console.warn(`Warning: Could not add RECORDING_URL metadata: ${recordingUrlError.message}`)
                    } else {
                        console.log(`Added RECORDING_URL metadata: ${recordingUrl}`)
                    }
                }
            }

            // Analyze the transcript
            const analysis = await analyzeTranscript(document.content, document.id, exampleJson)

            // Update call_log table
            await updateCallLog(document.id, analysis, recordingUrl)

            // Update document_metadata table if it's not a pseudo-document
            if (!document.isPseudoDocument) {
                await updateDocumentMetadata(document.id, analysis)

                // Add a metadata field to indicate that the document has been analyzed
                const timestamp = new Date().toISOString()

                // First check if the analysis_status metadata entry already exists
                const { data: existingStatus, error: statusCheckError } = await supabase
                    .from('document_metadata')
                    .select('id')
                    .eq('document_id', document.id)
                    .eq('field_name', 'analysis_status')
                    .single()

                if (statusCheckError && statusCheckError.code !== 'PGRST116') {
                    // PGRST116 is "not found"
                    throw new Error(`Failed to check existing analysis status: ${statusCheckError.message}`)
                }

                let analysisMetadataError

                if (existingStatus) {
                    // Update existing entry
                    const { error } = await supabase
                        .from('document_metadata')
                        .update({
                            field_value: 'completed',
                            updated_at: timestamp
                        })
                        .eq('id', existingStatus.id)

                    analysisMetadataError = error
                } else {
                    // Insert new entry
                    const { error } = await supabase.from('document_metadata').insert({
                        document_id: document.id,
                        field_name: 'analysis_status',
                        field_value: 'completed',
                        is_predefined: true,
                        created_at: timestamp,
                        updated_at: timestamp
                    })

                    analysisMetadataError = error
                }

                if (analysisMetadataError) {
                    throw new Error(`Failed to update analysis status metadata: ${analysisMetadataError.message}`)
                }
            }

            results.push(document.id)
            console.log(`Successfully processed document: ${document.id}`)
            return { success: true, id: document.id }
        } catch (error) {
            console.error(`Error processing document ${document.id}:`, error)
            errors.push({ id: document.id, error: error.message })
            return { success: false, id: document.id, error: error.message }
        }
    })

    // Process tasks with limited concurrency
    await processWithConcurrency(tasks)

    return { results, errors }
}

/**
 * Fetch documents from the database that need analysis
 */
async function fetchDocumentsForAnalysis(researchViewId, dataSourceId, limit = null) {
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
            }
        }
    }
    console.log(`Found ${analyzedRecordingUrls.size} analyzed recording URLs in call_log`)

    // Get total count of documents in the data source
    const { count: totalDocs, error: countError } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('source_id', dataSourceId)
        .eq('status', 'processed')

    if (countError) {
        console.warn(`Warning: Could not get total document count: ${countError.message}`)
    } else {
        console.log(`Total documents in data source: ${totalDocs}`)
    }

    // Get count of call_log entries
    const { count: callLogCount, error: callLogCountError } = await supabase.from('call_log').select('*', { count: 'exact', head: true })

    if (callLogCountError) {
        console.warn(`Warning: Could not get call_log count: ${callLogCountError.message}`)
    } else {
        console.log(`Total call_log entries: ${callLogCount}`)
    }

    // If the counts match, all documents have been analyzed
    if (totalDocs === callLogCount && totalDocs > 0 && callLogCount > 0) {
        console.log(`All ${totalDocs} documents have been analyzed (matching call_log count)`)
        return []
    }

    // Fetch documents that need analysis with pagination
    const PAGE_SIZE = 1000 // Supabase default page size
    let allDocuments = []
    let hasMore = true
    let page = 0
    let userLimitReached = false

    // Create a map of recording URLs to document IDs
    const recordingUrlToDocId = {}

    // Get all recording URLs from document metadata
    const { data: recordingUrlMappings, error: recordingUrlError } = await supabase
        .from('document_metadata')
        .select('document_id, field_value')
        .eq('field_name', 'RECORDING_URL')

    if (recordingUrlError) {
        console.warn(`Warning: Could not fetch recording URLs from metadata: ${recordingUrlError.message}`)
    } else if (recordingUrlMappings) {
        for (const mapping of recordingUrlMappings) {
            recordingUrlToDocId[mapping.field_value] = mapping.document_id
            // Also add to analyzed IDs if the recording URL is in the call_log
            if (analyzedRecordingUrls.has(mapping.field_value)) {
                analyzedIds.add(mapping.document_id)
            }
        }
        console.log(`Found ${recordingUrlMappings.length} RECORDING_URL metadata entries`)
    }

    while (hasMore && !userLimitReached) {
        // Build the query with pagination
        const query = supabase
            .from('documents')
            .select('id, title, content, source_id')
            .eq('status', 'processed')
            .eq('source_id', dataSourceId)
            .order('created_at', { ascending: true })
            .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

        const { data: documents, error } = await query

        if (error) {
            throw new Error(`Failed to fetch documents (page ${page}): ${error.message}`)
        }

        if (!documents || documents.length === 0) {
            hasMore = false
        } else {
            console.log(`Fetched ${documents.length} documents on page ${page}`)

            // Extract recording URLs from document titles and add to our mapping
            for (const doc of documents) {
                if (doc.title) {
                    const titleMatch = doc.title.match(/Call ((?:retaildatasystems_)?rec-[\w\d_.-]+\.mp3)/i)
                    if (titleMatch?.length > 1) {
                        let recordingUrl = titleMatch[1]
                        // Add retaildatasystems_ prefix if needed
                        if (!recordingUrl.startsWith('retaildatasystems_') && recordingUrl.startsWith('rec-')) {
                            recordingUrl = `retaildatasystems_${recordingUrl}`
                        }
                        recordingUrlToDocId[recordingUrl] = doc.id

                        // If this recording URL is in the call_log, mark the document as analyzed
                        if (analyzedRecordingUrls.has(recordingUrl)) {
                            analyzedIds.add(doc.id)
                        }
                    }
                }
            }

            // Filter out documents that have already been analyzed
            const filteredDocuments = documents.filter((doc) => {
                // Skip if document ID is in analyzed IDs
                if (analyzedIds.has(doc.id)) {
                    return false
                }

                // Check if the document title contains a recording URL that has already been analyzed
                if (doc.title) {
                    const titleMatch = doc.title.match(/Call ((?:retaildatasystems_)?rec-[\w\d_.-]+\.mp3)/i)
                    if (titleMatch?.length > 1) {
                        let recordingUrl = titleMatch[1]
                        // Add retaildatasystems_ prefix if needed
                        if (!recordingUrl.startsWith('retaildatasystems_') && recordingUrl.startsWith('rec-')) {
                            recordingUrl = `retaildatasystems_${recordingUrl}`
                        }
                        // Skip if recording URL is in analyzed recording URLs
                        if (analyzedRecordingUrls.has(recordingUrl)) {
                            return false
                        }
                    }
                }

                return true
            })

            allDocuments = allDocuments.concat(filteredDocuments)

            // If we've reached the user-specified limit, stop fetching more documents
            if (limit && !Number.isNaN(Number(limit)) && allDocuments.length >= Number(limit)) {
                userLimitReached = true
                // Trim to the exact limit
                if (allDocuments.length > Number(limit)) {
                    allDocuments = allDocuments.slice(0, Number(limit))
                }
            } else if (documents.length < PAGE_SIZE) {
                // If we got fewer documents than PAGE_SIZE, we've reached the end
                hasMore = false
            } else {
                page++
            }
        }
    }

    console.log(`Total documents fetched: ${page * PAGE_SIZE + (hasMore ? 0 : documents?.length || 0)}`)
    console.log(
        `Filtered out ${page * PAGE_SIZE + (hasMore ? 0 : documents?.length || 0) - allDocuments.length} already analyzed documents`
    )
    console.log(`Found ${allDocuments.length} documents to analyze${limit ? ` (limited to ${limit})` : ''}`)

    return allDocuments
}

/**
 * Fetch documents that need reanalysis based on empty TAGS_ARRAY in call_log
 */
async function fetchDocumentsForReanalysis(researchViewId, dataSourceId, reanalysisMode, limit = null, customFilter = null) {
    console.log(`Fetching documents for reanalysis in mode: ${reanalysisMode}`)

    // Query to get call_log entries with empty TAGS_ARRAY
    let callLogQuery

    if (reanalysisMode === REANALYSIS_MODES.EMPTY_TAGS) {
        // Direct SQL query for empty arrays or null TAGS_ARRAY
        const {
            data: callLogEntries,
            error: callLogError,
            count
        } = await supabase.rpc('get_empty_tags_array_entries', { limit_count: limit ? Number(limit) : null })

        if (callLogError) {
            throw new Error(`Failed to fetch call_log entries: ${callLogError.message}`)
        }

        console.log(`Found ${callLogEntries.length} call_log entries with empty TAGS_ARRAY${limit ? ` (limited to ${limit})` : ''}`)

        if (callLogEntries.length === 0) {
            return []
        }

        // Create pseudo-documents for each call log entry
        const documentsToReanalyze = callLogEntries.map((entry) => ({
            id: `call_log_${entry.recording_url}`,
            title: `Call ${entry.recording_url}`,
            content: entry.transcription,
            source_id: dataSourceId,
            isPseudoDocument: true,
            recordingUrl: entry.recording_url
        }))

        console.log(`Created ${documentsToReanalyze.length} pseudo-documents for reanalysis`)
        return documentsToReanalyze
    } else if (reanalysisMode === REANALYSIS_MODES.CUSTOM_FILTER && customFilter) {
        // Apply custom filter if provided
        callLogQuery = supabase.from('call_log')

        // The customFilter should be a valid Supabase filter string
        // For example: "sentiment_score.lt.5" or "resolution_status.eq.unresolved"
        const [field, operator, value] = customFilter.split('.')
        if (field && operator && value !== undefined) {
            callLogQuery = callLogQuery.filter(field, operator, value)
        } else {
            throw new Error(`Invalid custom filter format: ${customFilter}. Expected format: "field.operator.value"`)
        }

        // Apply limit if provided
        if (limit && !Number.isNaN(Number(limit))) {
            callLogQuery = callLogQuery.limit(Number(limit))
        }

        // Execute the query
        const { data: callLogEntries, error: callLogError } = await callLogQuery.select('RECORDING_URL, TRANSCRIPTION')

        if (callLogError) {
            throw new Error(`Failed to fetch call_log entries: ${callLogError.message}`)
        }

        console.log(`Found ${callLogEntries.length} call_log entries for reanalysis with custom filter`)

        if (callLogEntries.length === 0) {
            return []
        }

        // Create pseudo-documents for each call log entry
        const documentsToReanalyze = callLogEntries.map((entry) => ({
            id: `call_log_${entry.RECORDING_URL}`,
            title: `Call ${entry.RECORDING_URL}`,
            content: entry.TRANSCRIPTION,
            source_id: dataSourceId,
            isPseudoDocument: true,
            recordingUrl: entry.RECORDING_URL
        }))

        console.log(`Created ${documentsToReanalyze.length} pseudo-documents for reanalysis`)
        return documentsToReanalyze
    }

    return []
}

/**
 * Main function to process documents from the database
 */
async function main() {
    try {
        // Get command line arguments
        const args = process.argv.slice(2)
        const researchViewId = args[0]
        const dataSourceId = args[1]
        const exampleJsonPath = args[2]
        const limit = args[3] // Optional limit parameter
        const reanalysisMode = args[4] // Optional reanalysis mode
        const customFilter = args[5] // Optional custom filter for reanalysis

        if (!researchViewId || !dataSourceId) {
            console.error('Please provide research view ID and data source ID as arguments')
            console.error(
                'Usage: node analyze_transcriptions.js <research_view_id> <data_source_id> [example_json_path] [limit] [reanalysis_mode] [custom_filter]'
            )
            process.exit(1)
        }

        // Load example JSON if provided
        let exampleJson = null
        if (exampleJsonPath && fs.existsSync(exampleJsonPath)) {
            try {
                const jsonContent = fs.readFileSync(exampleJsonPath, 'utf8')
                exampleJson = JSON.parse(jsonContent)
                console.log('Loaded example JSON schema from file')
            } catch (error) {
                console.error('Error loading example JSON:', error)
                process.exit(1)
            }
        }

        // Determine if we're doing a reanalysis or a normal analysis
        let documents
        if (reanalysisMode) {
            console.log(`Running in reanalysis mode: ${reanalysisMode}`)

            // Check if we're using the empty_tags mode
            if (reanalysisMode === REANALYSIS_MODES.EMPTY_TAGS) {
                // Direct query for call_log entries with empty TAGS_ARRAY
                const { data: callLogEntries, error: callLogError } = await supabase.rpc('get_empty_tags_array_entries', {
                    limit_count: limit ? Number(limit) : null
                })

                if (callLogError) {
                    console.error(`Error fetching call_log entries with empty TAGS_ARRAY: ${callLogError.message}`)
                    process.exit(1)
                }

                console.log(`Found ${callLogEntries.length} call_log entries with empty TAGS_ARRAY${limit ? ` (limited to ${limit})` : ''}`)

                if (callLogEntries.length === 0) {
                    console.log('No call_log entries found with empty TAGS_ARRAY. Exiting.')
                    process.exit(0)
                }

                // Create pseudo-documents for each call log entry
                documents = callLogEntries.map((entry) => ({
                    id: `call_log_${entry.recording_url}`,
                    title: `Call ${entry.recording_url}`,
                    content: entry.transcription,
                    source_id: dataSourceId,
                    isPseudoDocument: true,
                    recordingUrl: entry.recording_url
                }))

                console.log(`Created ${documents.length} pseudo-documents for reanalysis`)
            } else if (reanalysisMode === REANALYSIS_MODES.CUSTOM_FILTER && customFilter) {
                // Use the custom filter
                console.log(`Using custom filter: ${customFilter}`)

                // Fetch documents for reanalysis with custom filter
                documents = await fetchDocumentsForReanalysis(researchViewId, dataSourceId, reanalysisMode, limit, customFilter)
            } else {
                console.error(`Invalid reanalysis mode: ${reanalysisMode}`)
                process.exit(1)
            }
        } else {
            // Fetch documents for normal analysis
            documents = await fetchDocumentsForAnalysis(researchViewId, dataSourceId, limit)
            console.log(`Found ${documents.length} documents to analyze${limit ? ` (limited to ${limit})` : ''}`)
        }

        if (documents.length === 0) {
            console.log('No documents found that need analysis. Exiting.')
            process.exit(0)
        }

        // Process in batches
        const batches = []
        for (let i = 0; i < documents.length; i += BATCH_SIZE) {
            batches.push(documents.slice(i, Math.min(i + BATCH_SIZE, documents.length)))
        }

        let successCount = 0
        let errorCount = 0

        for (let i = 0; i < batches.length; i++) {
            console.log(`Processing batch ${i + 1} of ${batches.length}...`)
            const { results, errors } = await processBatch(batches[i], exampleJson)
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
            console.log(`\nProgress: ${successCount}/${documents.length} processed successfully (${errorCount} errors)\n`)
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
