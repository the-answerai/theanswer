/**
 * Text Processor Core
 *
 * Core processing logic for sending text to AnswerAI and handling the response.
 */
import { validateConfig, formatTextForProcessing, parseAnalysisResponse, extractMetadata } from './utils.js'
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

// Default timeout for API calls
const DEFAULT_TIMEOUT = 60000 // 60 seconds

// Status tracking for processing operations
const processingStatus = new Map()

/**
 * Process a single text document through AnswerAI
 *
 * @param {string} text - The text content to process
 * @param {Object} options - Processing options
 * @param {string} options.chatflowId - The ID of the chatflow to use for processing
 * @param {string} options.format - The format of the text (plain, html, markdown, etc.)
 * @param {Object} options.metadata - Additional metadata to include
 * @param {number} options.timeout - Timeout for the API call in milliseconds
 * @param {string} options.documentId - Optional ID of the document being processed
 * @param {string} options.researchViewId - Optional ID of the research view
 * @returns {Promise<Object>} The processing result
 */
export const processText = async (text, options = {}) => {
    const requestId = Date.now()
    console.log(`[TextProcessor #${requestId}] Starting text processing request`, {
        chatflowId: options.chatflowId,
        format: options.format || 'plain',
        documentId: options.documentId || 'none',
        researchViewId: options.researchViewId || 'none',
        textLength: text?.length || 0
    })

    try {
        // Validate configuration
        const config = validateConfig()
        if (!config.isValid) {
            throw new Error(`Invalid configuration: ${config.errors.join(', ')}`)
        }

        // Validate required options
        if (!options.chatflowId) {
            throw new Error('chatflowId is required')
        }

        // Format the text based on its source format
        const formattedText = formatTextForProcessing(text, options.format || 'plain')
        console.log(`[TextProcessor #${requestId}] Formatted text length: ${formattedText.length}`)

        // Extract basic metadata
        const metadata = extractMetadata(formattedText, {
            additionalMetadata: {
                ...(options.metadata || {}),
                researchViewId: options.researchViewId
            }
        })

        // Set up abort controller for timeout
        const timeout = options.timeout || DEFAULT_TIMEOUT
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)

        try {
            console.log(`[TextProcessor #${requestId}] Sending request to AnswerAI chatflow: ${options.chatflowId}`)

            // Construct the endpoint URL - Use the hasApiPath flag to avoid duplication
            let endpoint
            if (config.hasApiPath) {
                // If the endpoint already has /api/v1, just append the prediction path
                endpoint = `${config.endpoint}/prediction/${options.chatflowId}`
            } else {
                // Otherwise, include the api/v1 path
                endpoint = `${config.endpoint}/api/v1/prediction/${options.chatflowId}`
            }

            console.log(`[TextProcessor #${requestId}] Using endpoint: ${endpoint}`)

            // Make the API request - Note: No Authorization header as it's a public API
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    question: formattedText,
                    metadata: metadata
                }),
                signal: controller.signal
            })

            if (!response.ok) {
                const errorText = await response.text()
                console.error(`[TextProcessor #${requestId}] API error:`, {
                    status: response.status,
                    statusText: response.statusText,
                    errorText: errorText
                })
                throw new Error(`AnswerAI returned status ${response.status}: ${errorText}`)
            }

            // Parse the response
            const result = await response.json()
            console.log(`[TextProcessor #${requestId}] Received API response:`, {
                type: typeof result,
                hasText: !!result.text,
                hasJson: !!result.json,
                keys: Object.keys(result)
            })

            const parsedResult = parseAnalysisResponse(result)
            console.log(`[TextProcessor #${requestId}] Parsed result keys:`, Object.keys(parsedResult))

            // Store document and result if requested
            if (options.storeResults && options.documentId) {
                console.log(`[TextProcessor #${requestId}] Storing processing results for document: ${options.documentId}`)
                await storeProcessingResults(options.documentId, parsedResult)
            }

            // Clear the timeout
            clearTimeout(timeoutId)

            return {
                success: true,
                result: parsedResult
            }
        } catch (error) {
            // Clear the timeout
            clearTimeout(timeoutId)

            console.error(`[TextProcessor #${requestId}] Error processing text:`, error)
            throw error
        }
    } catch (error) {
        console.error(`[TextProcessor #${requestId}] Processing failed:`, error)
        return {
            success: false,
            error: error.message
        }
    }
}

/**
 * Process a batch of text documents
 *
 * @param {Array<Object>} batch - Array of text documents to process
 * @param {Object} options - Processing options
 * @returns {Promise<Object>} Processing results and errors
 */
export const processTextBatch = async (batch, options = {}) => {
    console.log(`Processing batch of ${batch.length} documents...`)

    const results = []
    const errors = []

    for (const item of batch) {
        try {
            const text = item.text || item.content
            if (!text) {
                throw new Error('No text content found in batch item')
            }

            const itemOptions = {
                ...options,
                metadata: {
                    ...options.metadata,
                    ...item.metadata
                },
                documentId: item.id || item.documentId
            }

            const result = await processText(text, itemOptions)

            if (result.success) {
                results.push({
                    id: item.id || item.documentId,
                    result: result.result
                })
            } else {
                throw new Error(result.error)
            }
        } catch (error) {
            console.error('Error processing batch item:', error)
            errors.push({
                id: item.id || item.documentId,
                error: error.message
            })
        }
    }

    return { results, errors }
}

/**
 * Get the processing status for a document
 *
 * @param {string} documentId - The ID of the document
 * @returns {Object} The processing status
 */
export const getProcessingStatus = async (documentId) => {
    if (!documentId) {
        return { status: 'error', error: 'Document ID is required' }
    }

    // Check if we have the status in memory
    if (processingStatus.has(documentId)) {
        return processingStatus.get(documentId)
    }

    // Check the database for status
    try {
        const { data, error } = await supabase.from('documents').select('id, status, updated_at').eq('id', documentId).single()

        if (error || !data) {
            return { status: 'error', error: 'Document not found' }
        }

        return {
            status: data.status,
            lastUpdated: data.updated_at
        }
    } catch (error) {
        console.error('Error checking document status:', error)
        return { status: 'error', error: error.message }
    }
}

/**
 * Store processing results in the database
 *
 * @param {string} documentId - The ID of the document
 * @param {Object} results - The processing results
 * @returns {Promise<boolean>} Success indicator
 */
const storeProcessingResults = async (documentId, results) => {
    if (!documentId || !results) {
        console.error('Missing document ID or results for storage')
        return false
    }

    try {
        // Prepare document metadata entries
        const metadataEntries = []

        // Convert result object into individual metadata entries
        for (const [key, value] of Object.entries(results)) {
            if (value) {
                metadataEntries.push({
                    document_id: documentId,
                    field_name: key,
                    field_value: typeof value === 'string' ? value : JSON.stringify(value),
                    field_prompt: `Extract ${key}`,
                    is_predefined: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
            }
        }

        // Insert all metadata entries in a batch
        if (metadataEntries.length > 0) {
            const { data, error } = await supabase.from('document_metadata').insert(metadataEntries)

            if (error) {
                console.error('Error storing document metadata:', error)
                return false
            }
        }

        // Update document status to processed
        await supabase
            .from('documents')
            .update({
                status: 'processed',
                updated_at: new Date().toISOString()
            })
            .eq('id', documentId)

        return true
    } catch (error) {
        console.error('Error storing processing results:', error)
        return false
    }
}

/**
 * Process text and store as a document with metadata
 *
 * This function handles the full workflow of:
 * 1. Creating a document record
 * 2. Processing the text with AnswerAI
 * 3. Storing the analysis results as document metadata
 *
 * @param {string} text - The text content to process
 * @param {Object} options - Processing options
 * @param {string} options.sourceId - The ID of the data source
 * @param {string} options.title - Title for the document
 * @param {string} options.chatflowId - The ID of the chatflow to use for analysis
 * @param {string} options.format - The format of the text (plain, html, markdown, etc.)
 * @param {string} options.fileType - Type of file (default: 'transcript')
 * @param {boolean} options.skipAnalysis - Skip the AnswerAI analysis step (default: false)
 * @returns {Promise<Object>} The processing result with document ID
 */
export const processAndStoreText = async (text, options = {}) => {
    console.log('Processing and storing text document')

    try {
        // Validate required options
        if (!options.sourceId) {
            throw new Error('sourceId is required')
        }

        if (!options.skipAnalysis && !options.chatflowId) {
            console.warn('No chatflowId provided for analysis, document will be created without analysis')
            options.skipAnalysis = true
        }

        if (!text) {
            throw new Error('Text content is required')
        }

        // Calculate word and token counts
        const wordCount = text.split(/\s+/).length
        const tokenCount = Math.ceil(wordCount * 1.3) // Rough estimate

        // Create document record first
        const documentId = uuidv4()
        const document = {
            id: documentId,
            source_id: options.sourceId,
            title: options.title || 'Transcript',
            content: text,
            content_summary: text.substring(0, 200) + (text.length > 200 ? '...' : ''),
            token_count: tokenCount,
            word_count: wordCount,
            file_type: options.fileType || 'transcript',
            status: 'processing',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }

        // Insert document record
        const { data: documentData, error: documentError } = await supabase.from('documents').insert([document]).select().single()

        if (documentError) {
            console.error('Error creating document record:', documentError)
            throw new Error(`Failed to create document record: ${documentError.message}`)
        }

        console.log(`Document record created with ID: ${documentId}`)

        let analysisResult = null
        let processingError = null

        // Process the text with AnswerAI if not skipping analysis
        if (!options.skipAnalysis) {
            try {
                const processingResult = await processText(text, {
                    ...options,
                    documentId: documentId,
                    storeResults: false // We'll store the results manually for more control
                })

                if (processingResult.success) {
                    console.log('Text processing completed successfully')
                    analysisResult = processingResult.result
                } else {
                    console.error(`Text processing failed: ${processingResult.error}`)
                    processingError = processingResult.error
                }
            } catch (analysisError) {
                console.error('Error during text analysis:', analysisError)
                processingError = analysisError.message
            }
        }

        // Store the analysis results in document_metadata if we have them
        if (analysisResult) {
            const metadataEntries = []

            // Convert result object into individual metadata entries
            for (const [key, value] of Object.entries(analysisResult)) {
                if (value) {
                    metadataEntries.push({
                        document_id: documentId,
                        field_name: key,
                        field_value: typeof value === 'string' ? value : JSON.stringify(value),
                        field_prompt: `Extract ${key}`,
                        is_predefined: true,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    })
                }
            }

            // Insert all metadata entries in a batch
            if (metadataEntries.length > 0) {
                const { data: metadataData, error: metadataError } = await supabase.from('document_metadata').insert(metadataEntries)

                if (metadataError) {
                    console.error('Error storing document metadata:', metadataError)
                } else {
                    console.log(`Created ${metadataEntries.length} metadata entries for document`)
                }
            }
        }

        // If processing failed, add an error metadata entry
        if (processingError) {
            const { data, error } = await supabase.from('document_metadata').insert([
                {
                    document_id: documentId,
                    field_name: 'processing_error',
                    field_value: processingError,
                    field_prompt: 'AnswerAI processing error',
                    is_predefined: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }
            ])

            if (error) {
                console.error('Error storing processing error metadata:', error)
            }
        }

        // Update document status - processed if we have analysis, or error if we tried and failed
        const documentStatus = analysisResult ? 'processed' : processingError ? 'error' : 'processed'

        await supabase
            .from('documents')
            .update({
                status: documentStatus,
                updated_at: new Date().toISOString()
            })
            .eq('id', documentId)

        console.log(`Document ${documentId} marked as ${documentStatus}`)

        // Return success with document ID and processing results
        return {
            success: true,
            documentId: documentId,
            document: documentData,
            result: analysisResult,
            error: processingError
        }
    } catch (error) {
        console.error('Error in processAndStoreText:', error)
        return {
            success: false,
            error: error.message
        }
    }
}
