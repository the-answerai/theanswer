/**
 * Vector Store Configuration
 * This file centralizes all vector store configuration settings used throughout the application.
 */

// Get database connection details from environment variables
const SUPABASE_URL = process.env.SUPABASE_URL || 'http://127.0.0.1:54331'

/**
 * Get the vector store configuration object
 * @param {string} storeId - The document store ID
 * @param {string} [userId] - Optional user ID for namespace
 * @param {Object} [overrides] - Optional configuration overrides
 * @returns {Object} - The vector store configuration
 */
export const getVectorStoreConfig = (storeId, userId = 'default', overrides = {}) => {
    if (!storeId) {
        throw new Error('storeId is required for vector store configuration')
    }

    // Create a dynamic namespace using userId and storeId
    const namespace = `vectorstore_${userId}_${storeId}`

    const defaultConfig = {
        name: 'aaiVectorStore',
        config: {
            document: '',
            embeddings: '',
            recordManager: '',
            namespace: namespace,
            fileUpload: '',
            pineconeTextKey: '',
            pineconeMetadataFilter: '',
            topK: '',
            searchType: 'similarity',
            fetchK: '',
            lambda: ''
        }
    }

    // Apply any overrides to the default configuration
    return {
        ...defaultConfig,
        config: {
            ...defaultConfig.config,
            ...(overrides.config || {})
        }
    }
}

/**
 * Validate that the vector store configuration is complete
 * @returns {boolean} - True if configuration is valid, false otherwise
 */
export const validateVectorStoreConfig = () => {
    return true // No credentials to validate
}

/**
 * Get vector store configuration as JSON string for APIs that require it
 * @param {string} storeId - The document store ID
 * @param {string} [userId] - Optional user ID for namespace
 * @param {Object} [overrides] - Optional configuration overrides
 * @returns {string} - JSON string of the configuration
 */
export const getVectorStoreConfigAsJson = (storeId, userId = 'default', overrides = {}) => {
    return JSON.stringify(getVectorStoreConfig(storeId, userId, overrides).config)
}

export default {
    getVectorStoreConfig,
    validateVectorStoreConfig,
    getVectorStoreConfigAsJson
}
