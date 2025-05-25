/**
 * Functions for working with AnswerAI document stores
 */
import { v4 as uuidv4 } from 'uuid'
import { supabase } from '../../config/db.js'
import { makeApiRequest } from './client.js'
import { getRecordManagerConfig, getRecordManagerConfigAsJson } from '../../config/recordManagerConfig.js'
import { getVectorStoreConfig, getVectorStoreConfigAsJson } from '../../config/vectorStoreConfig.js'
import { getEmbeddingConfig, getEmbeddingConfigAsJson } from '../../config/embeddingConfig.js'

// Directly use our configuration files for validation
// const ANSWERAI_EMBEDDING_CREDENTIAL_ID = process.env.ANSWERAI_EMBEDDING_CREDENTIAL_ID;
// const ANSWERAI_VECTORSTORE_CREDENTIAL_ID = process.env.ANSWERAI_VECTORSTORE_CREDENTIAL_ID;
// const ANSWERAI_RECORDMANAGER_CREDENTIAL_ID = process.env.ANSWERAI_RECORDMANAGER_CREDENTIAL_ID;

// Get database connection details from environment variables
const SUPABASE_URL = process.env.SUPABASE_URL
const DB_HOST = process.env.DB_HOST || '127.0.0.1'
const DB_PORT = process.env.DB_PORT || '54332'
const DB_NAME = process.env.DB_NAME || 'postgres'

/**
 * Create a document store in AnswerAI for a research view
 * @param {Object} researchView - The research view object
 * @param {string} [userId] - Optional user ID for namespace
 * @returns {Object|null} - The created document store or null if failed
 */
export const createDocumentStore = async (researchView, userId = 'default') => {
    try {
        if (!researchView) {
            console.error('No research view provided to createDocumentStore')
            return null
        }

        // Log configuration status
        console.log('===== AnswerAI Configuration Check =====')
        console.log('EMBEDDING Config: ', getEmbeddingConfig())
        console.log('VECTORSTORE Config: ', getVectorStoreConfig('validation-only', userId))
        console.log('RECORDMANAGER Config: ', getRecordManagerConfig('validation-only', userId))
        console.log('===================================')

        // Validation is no longer needed as there are no credentials to validate

        console.log(`Creating AnswerAI document store for research view: ${researchView.id} (${researchView.name})`)

        // Use research view ID as the document store ID if available, otherwise generate a UUID
        // This ensures the research view ID and document store ID are aligned when possible
        const storeId = researchView.id || researchView.answerai_store_id || uuidv4()

        // Prepare the document store data exactly matching the expected format
        const documentStoreData = {
            id: storeId,
            name: researchView.name,
            description: researchView.description || `Document store for research view: ${researchView.name}`,
            loaders: JSON.stringify({
                loaders: [
                    {
                        id: uuidv4(),
                        name: 'Data Sidekick Loader'
                    }
                ]
            }),
            whereUsed: JSON.stringify({
                researchViewId: researchView.id
            }),
            status: 'SYNC',
            // Use the centralized config for vector store with userId
            vectorStoreConfig: getVectorStoreConfigAsJson(storeId, userId),
            // Use the centralized config for embedding
            embeddingConfig: getEmbeddingConfigAsJson(),
            // Use the centralized config for record manager with userId
            recordManagerConfig: getRecordManagerConfigAsJson(storeId, userId),
            createdDate: new Date().toISOString(),
            updatedDate: new Date().toISOString()
        }

        // Make the API request
        const result = await makeApiRequest('/document-store/store', 'POST', documentStoreData)

        // Update the research view with the document store ID if needed
        if (!researchView.answerai_store_id) {
            const { error: updateError } = await supabase
                .from('research_views')
                .update({
                    answerai_store_id: storeId,
                    updated_at: new Date().toISOString()
                })
                .eq('id', researchView.id)

            if (updateError) {
                console.error(`Error updating research view with document store ID: ${updateError.message}`)
            }
        }

        console.log('Successfully created AnswerAI document store with ID:', storeId)
        return result
    } catch (error) {
        console.error(`Error creating AnswerAI document store for research view ${researchView?.id}:`, error)
        return null
    }
}

/**
 * Process a document through the document-store/refresh API
 * @param {Object} params - The parameters for processing
 * @returns {Object} The processed document response
 */
export const processDocument = async (params) => {
    try {
        // Make the API request
        const { storeId } = params
        const result = await makeApiRequest('/document-store/loader/process', 'POST', params)

        console.log('AnswerAI document process API response:', result)
        return result
    } catch (error) {
        console.error('Error processing document through AnswerAI:', error)
        throw error
    }
}

/**
 * Insert documents into the vector store
 * @param {string} storeId - The document store ID
 * @param {string} [userId] - Optional user ID for namespace
 * @param {Object} [config] - Optional configuration overrides
 * @returns {Object} The response from the vector store insert API
 */
export const insertToVectorStore = async (storeId, userId = 'default', config = {}) => {
    try {
        console.log(`Inserting documents into vector store for store ID: ${storeId}`)

        // Get configurations from the centralized modules with userId
        const recordManagerConfig = getRecordManagerConfig(storeId, userId)
        const vectorStoreConfig = getVectorStoreConfig(storeId, userId)
        const embeddingConfig = getEmbeddingConfig()

        // Default configuration for vector store insertion
        const defaultConfig = {
            embeddingConfig: embeddingConfig.config,
            embeddingName: embeddingConfig.name,
            vectorStoreConfig: vectorStoreConfig.config,
            vectorStoreName: vectorStoreConfig.name,
            recordManagerConfig: recordManagerConfig.config,
            recordManagerName: recordManagerConfig.name
        }

        // Merge the default config with any provided overrides
        const mergedConfig = {
            ...defaultConfig,
            ...config,
            // Ensure storeId is always set correctly
            storeId
        }

        // Make the API request
        const result = await makeApiRequest(`/document-store/upsert/${storeId}`, 'POST', mergedConfig)

        console.log('AnswerAI vector store insert response:', result)
        return result
    } catch (error) {
        console.error(`Error inserting documents into vector store for store ID ${storeId}:`, error)
        throw error
    }
}

/**
 * Get document store details by ID
 * @param {string} storeId - The document store ID
 * @returns {Object} The document store details
 */
export const getDocumentStore = async (storeId) => {
    try {
        return await makeApiRequest(`/document-store/store/${storeId}`, 'GET')
    } catch (error) {
        console.error(`Error getting document store with ID ${storeId}:`, error)
        throw error
    }
}

/**
 * List all document stores
 * @returns {Array} List of document stores
 */
export const listDocumentStores = async () => {
    try {
        return await makeApiRequest('/document-store/stores', 'GET')
    } catch (error) {
        console.error('Error listing document stores:', error)
        throw error
    }
}
