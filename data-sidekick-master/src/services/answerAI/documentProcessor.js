/**
 * AnswerAI Document Processor Utility
 * Handles standardized document processing using the AnswerAI API
 */
import fetch from 'node-fetch'
import { ANSWERAI_ENDPOINT, API_CALL_TIMEOUT } from '../../config/db.js'
import { v4 as uuidv4 } from 'uuid'
import { getRecordManagerConfig } from '../../config/recordManagerConfig.js'
import { getVectorStoreConfig } from '../../config/vectorStoreConfig.js'
import { getEmbeddingConfig } from '../../config/embeddingConfig.js'

// Get AnswerAI credential IDs from environment variables
const ANSWERAI_TOKEN = process.env.ANSWERAI_TOKEN
// Use the centralized config files instead
// const ANSWERAI_EMBEDDING_CREDENTIAL_ID = process.env.ANSWERAI_EMBEDDING_CREDENTIAL_ID;
// const ANSWERAI_VECTORSTORE_CREDENTIAL_ID = process.env.ANSWERAI_VECTORSTORE_CREDENTIAL_ID;
// const ANSWERAI_RECORDMANAGER_CREDENTIAL_ID = process.env.ANSWERAI_RECORDMANAGER_CREDENTIAL_ID;

// Get database connection details from environment variables
const SUPABASE_URL = process.env.SUPABASE_URL
const DB_HOST = process.env.DB_HOST || '127.0.0.1'
const DB_PORT = process.env.DB_PORT || '54332'
const DB_NAME = process.env.DB_NAME || 'postgres'

// Request counter for debugging
let requestCounter = 0

/**
 * Process a text document using standard configuration
 * @param {string} storeId - The UUID of the document store
 * @param {string} text - The text content to process
 * @param {Object} metadata - Metadata to include with the document
 * @param {string} loaderName - Name to use for the loader (typically URL)
 * @returns {Promise<Object>} The processing result
 */
export const processTextDocument = async (storeId, text, metadata = {}, loaderName = '') => {
    // Increment request counter
    requestCounter++
    const requestId = requestCounter

    try {
        console.log(`[Request #${requestId}] Starting document processing request`)

        // Debug the environment variables first
        console.log(`[Request #${requestId}] ANSWERAI_ENDPOINT value:`, ANSWERAI_ENDPOINT)
        console.log(
            `[Request #${requestId}] ANSWERAI_TOKEN value:`,
            ANSWERAI_TOKEN ? `${ANSWERAI_TOKEN.substring(0, 5)}... (${ANSWERAI_TOKEN.length} chars)` : 'not set'
        )

        if (!ANSWERAI_ENDPOINT || !ANSWERAI_TOKEN) {
            throw new Error('ANSWERAI_ENDPOINT or ANSWERAI_TOKEN not set')
        }

        // Verify storeId is a valid UUID
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(storeId)) {
            throw new Error('storeId must be a valid UUID')
        }

        // Combine base metadata with provided metadata
        const combinedMetadata = {
            source: 'data-sidekick',
            ...metadata
        }

        // Use standard configuration for all text documents
        const params = {
            loaderId: 'plainText',
            storeId: storeId,
            loaderName: (loaderName || 'Plain Text').substring(0, 50),
            loaderConfig: {
                text: text,
                textSplitter: '',
                metadata: JSON.stringify(combinedMetadata),
                omitMetadataKeys: ''
            },
            splitterId: 'recursiveCharacterTextSplitter',
            splitterConfig: {
                chunkSize: '1000',
                chunkOverlap: '100'
            },
            splitterName: 'Recursive Character Text Splitter'
        }

        // Ensure ANSWERAI_ENDPOINT is properly formatted
        let baseEndpoint = ANSWERAI_ENDPOINT
        if (baseEndpoint.endsWith('/')) {
            baseEndpoint = baseEndpoint.slice(0, -1)
        }

        // Construct the URL properly
        const url = baseEndpoint.includes('/api/v1')
            ? `${baseEndpoint}/document-store/loader/process`
            : `${baseEndpoint}/api/v1/document-store/loader/process`

        console.log(`[Request #${requestId}] AnswerAI request details:`)
        console.log(`[Request #${requestId}] 1. URL:`, url)
        console.log(`[Request #${requestId}] 2. Method: POST`)
        console.log(`[Request #${requestId}] 3. Headers:`, {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: 'Bearer [token]'
        })
        console.log(`[Request #${requestId}] 4. Parameters:`, {
            storeId: params.storeId,
            loaderId: params.loaderId,
            loaderName: params.loaderName,
            splitterId: params.splitterId,
            splitterName: params.splitterName,
            textLength: text.length
        })

        // Try to make a diagnostic network request first to check connectivity
        try {
            console.log(`[Request #${requestId}] Testing connection to AnswerAI server...`)
            const testResponse = await fetch(baseEndpoint, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            })

            console.log(`[Request #${requestId}] Connection test result:`, {
                status: testResponse.status,
                statusText: testResponse.statusText,
                isOk: testResponse.ok
            })
        } catch (networkError) {
            console.error(`[Request #${requestId}] Network connectivity test failed:`, networkError.message)
        }

        // Prepare authorization header
        const tokenValue = ANSWERAI_TOKEN.trim()
        const authHeader = `Bearer ${tokenValue}`

        // Make the API request
        console.log(`[Request #${requestId}] Sending request to AnswerAI...`)
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                Authorization: authHeader
            },
            body: JSON.stringify(params)
        })

        console.log(`[Request #${requestId}] AnswerAI response received:`, {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok
        })

        // Handle the response
        if (!response.ok) {
            let errorText
            try {
                errorText = await response.text()
                console.log(`[Request #${requestId}] Error response body:`, errorText)
            } catch (e) {
                errorText = 'Could not read error response'
            }

            throw new Error(`AnswerAI API returned ${response.status}: ${errorText}`)
        }

        const result = await response.json()
        console.log(`[Request #${requestId}] AnswerAI success response:`, {
            fileId: result.file?.id,
            status: result.file?.status,
            storeName: result.storeName
        })

        return result
    } catch (error) {
        console.error(`[Request #${requestId}] Error processing document with AnswerAI:`, error)
        throw error
    }
}

/**
 * Check if a document processing job is complete
 * @param {string} storeId - The UUID of the document store
 * @param {string} fileId - The ID of the processed file
 * @returns {Promise<Object>} Status information
 */
export const checkProcessingStatus = async (storeId, fileId) => {
    // Implementation placeholder
}

/**
 * Upsert a text document using the newer document-store/upsert API
 * This is the recommended method for adding documents to the store
 *
 * @param {string} storeId - The UUID of the document store
 * @param {string} text - The text content to process
 * @param {Object} metadata - Metadata to include with the document
 * @param {string} [docId] - Optional document ID for replacing existing document (ignored for new documents)
 * @param {boolean} [replaceExisting] - Whether to replace existing document if docId is provided
 * @param {string} [userId] - Optional user ID for namespace
 * @returns {Promise<Object>} The processing result
 */
export const upsertTextDocument = async (storeId, text, metadata = {}, docId = null, replaceExisting = false, userId = 'default') => {
    // Increment request counter
    requestCounter++
    const requestId = requestCounter

    try {
        console.log(`[Request #${requestId}] ============== STARTING DOCUMENT UPSERT ==============`)
        console.log(`[Request #${requestId}] Starting document upsert request for store ID: ${storeId}`)

        // Debug the environment variables first
        console.log(`[Request #${requestId}] ANSWERAI_ENDPOINT value:`, ANSWERAI_ENDPOINT)
        console.log(
            `[Request #${requestId}] ANSWERAI_TOKEN value:`,
            ANSWERAI_TOKEN ? `${ANSWERAI_TOKEN.substring(0, 5)}... (${ANSWERAI_TOKEN.length} chars)` : 'not set'
        )

        // Get configurations from centralized modules with userId
        const recordManagerConfig = getRecordManagerConfig(storeId, userId)
        const vectorStoreConfig = getVectorStoreConfig(storeId, userId)
        const embeddingConfig = getEmbeddingConfig()

        console.log(`[Request #${requestId}] EMBEDDING Config:`, embeddingConfig)
        console.log(`[Request #${requestId}] VECTORSTORE Config:`, vectorStoreConfig)
        console.log(`[Request #${requestId}] RECORDMANAGER Config:`, recordManagerConfig)

        if (!ANSWERAI_ENDPOINT || !ANSWERAI_TOKEN) {
            throw new Error('ANSWERAI_ENDPOINT or ANSWERAI_TOKEN not set')
        }

        // Verify storeId is a valid UUID
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(storeId)) {
            throw new Error('storeId must be a valid UUID')
        }

        // Combine base metadata with provided metadata
        const combinedMetadata = {
            source: 'data-sidekick',
            ...metadata
        }

        // Create a unique source identifier for the document
        // This will be used as loaderName which is more reliable than docId
        let sourceIdentifier = ''
        if (metadata.url) {
            sourceIdentifier = metadata.url
        } else if (metadata.filename) {
            sourceIdentifier = metadata.filename
        } else if (docId) {
            sourceIdentifier = `document-${docId}`
        } else {
            // Fallback to timestamp if no other identifier is available
            sourceIdentifier = `document-${Date.now()}`
        }

        // Restore the complete configuration to ensure all necessary details are sent
        const requestBody = {
            metadata: combinedMetadata,
            replaceExisting: replaceExisting,
            loaderName: sourceIdentifier.substring(0, 100), // Keep loaderName for document identification
            loader: {
                name: 'plainText',
                config: {
                    text: text,
                    sourceId: sourceIdentifier
                }
            },
            splitter: {
                name: 'recursiveCharacterTextSplitter',
                config: {
                    chunkSize: '1000',
                    chunkOverlap: '100'
                }
            },
            // Use the centralized embedding config
            embedding: embeddingConfig,
            // Use the centralized vector store config
            vectorStore: vectorStoreConfig,
            // Use the centralized record manager config
            recordManager: recordManagerConfig
        }

        // Ensure ANSWERAI_ENDPOINT is properly formatted
        let baseEndpoint = ANSWERAI_ENDPOINT
        if (baseEndpoint.endsWith('/')) {
            baseEndpoint = baseEndpoint.slice(0, -1)
        }

        // Construct the URL properly for the upsert endpoint
        const url = baseEndpoint.includes('/api/v1')
            ? `${baseEndpoint}/document-store/upsert/${storeId}`
            : `${baseEndpoint}/api/v1/document-store/upsert/${storeId}`

        // Set up headers
        const headers = {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${ANSWERAI_TOKEN}`
        }

        // Stringify the request body
        const requestBodyString = JSON.stringify(requestBody)

        // Log details for debugging
        console.log(`[Request #${requestId}] ============== DETAILED REQUEST INFO ==============`)
        console.log(`[Request #${requestId}] REQUEST URL:`, url)
        console.log(`[Request #${requestId}] REQUEST METHOD: POST`)
        console.log(`[Request #${requestId}] REQUEST HEADERS:`, JSON.stringify(headers, null, 2).replace(ANSWERAI_TOKEN, '***TOKEN***'))
        console.log(`[Request #${requestId}] REQUEST BODY (summarized):`, {
            metadata: combinedMetadata,
            replaceExisting: replaceExisting,
            loaderName: sourceIdentifier.substring(0, 100),
            loader: {
                name: requestBody.loader.name,
                config: {
                    // Show truncated text
                    text: text.length > 100 ? `${text.substring(0, 100)}... (${text.length} chars)` : text,
                    sourceId: sourceIdentifier
                }
            },
            splitter: {
                name: requestBody.splitter.name,
                config: requestBody.splitter.config
            },
            embedding: {
                name: requestBody.embedding.name,
                config: {
                    ...requestBody.embedding.config,
                    // Don't show full credential
                    credential: requestBody.embedding.config.credential
                        ? `${requestBody.embedding.config.credential.substring(0, 8)}...`
                        : 'undefined'
                }
            },
            vectorStore: {
                name: requestBody.vectorStore.name,
                config: {
                    ...requestBody.vectorStore.config,
                    // Don't show full credential
                    credential: requestBody.vectorStore.config.credential
                        ? `${requestBody.vectorStore.config.credential.substring(0, 8)}...`
                        : 'undefined'
                }
            },
            recordManager: {
                name: requestBody.recordManager.name,
                config: {
                    ...requestBody.recordManager.config,
                    // Don't show full credential
                    credential: requestBody.recordManager.config.credential
                        ? `${requestBody.recordManager.config.credential.substring(0, 8)}...`
                        : 'undefined'
                }
            }
        })
        console.log(`[Request #${requestId}] FULL REQUEST BODY STRING START --->`)
        console.log(requestBodyString)
        console.log('<--- FULL REQUEST BODY STRING END')
        console.log(`[Request #${requestId}] ============== END DETAILED REQUEST INFO ==============`)

        // Make the API request with proper headers and body
        console.log(`[Request #${requestId}] Sending request to ${url}...`)
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: requestBodyString
        })

        // Check if the request was successful
        const responseStatus = response.status
        const responseHeaders = Object.fromEntries(response.headers.entries())

        if (!response.ok) {
            const errorText = await response.text()
            console.error(`[Request #${requestId}] API ERROR (${response.status}):`)
            console.error(`[Request #${requestId}] Response Headers:`, responseHeaders)
            console.error(`[Request #${requestId}] Response Body:`, errorText)

            throw new Error(`AnswerAI API error (${response.status}): ${errorText}`)
        }

        // Parse the response
        const result = await response.json()
        console.log(`[Request #${requestId}] API SUCCESS (${response.status}):`)
        console.log(`[Request #${requestId}] Response Headers:`, responseHeaders)
        console.log(`[Request #${requestId}] Response Body:`, JSON.stringify(result, null, 2))
        console.log(`[Request #${requestId}] AnswerAI upsert successful:`, {
            numAdded: result.numAdded || 0,
            numDeleted: result.numDeleted || 0,
            numUpdated: result.numUpdated || 0,
            numSkipped: result.numSkipped || 0
        })
        console.log(`[Request #${requestId}] ============== END DOCUMENT UPSERT ==============`)

        return result
    } catch (error) {
        console.error(`[Request #${requestId}] ERROR DURING UPSERT:`, error)
        console.error(`[Request #${requestId}] Error Stack:`, error.stack)
        console.error(`[Request #${requestId}] ============== END DOCUMENT UPSERT (WITH ERROR) ==============`)
        throw error
    }
}
