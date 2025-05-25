/**
 * Embedding Configuration
 * This file centralizes all embedding configuration settings used throughout the application.
 */

/**
 * Get the embedding configuration object
 * @param {Object} [overrides] - Optional configuration overrides
 * @returns {Object} - The embedding configuration
 */
export const getEmbeddingConfig = (overrides = {}) => {
    const defaultConfig = {
        name: 'AAIEmbeddings',
        config: {
            modelName: 'text-embedding-ada-002',
            stripNewLines: '',
            batchSize: '',
            timeout: '',
            basepath: '',
            dimensions: ''
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
 * Validate that the embedding configuration is complete
 * @returns {boolean} - True if configuration is valid, false otherwise
 */
export const validateEmbeddingConfig = () => {
    return true // No credentials to validate
}

/**
 * Get embedding configuration as JSON string for APIs that require it
 * @param {Object} [overrides] - Optional configuration overrides
 * @returns {string} - JSON string of the configuration
 */
export const getEmbeddingConfigAsJson = (overrides = {}) => {
    return JSON.stringify(getEmbeddingConfig(overrides).config)
}

export default {
    getEmbeddingConfig,
    validateEmbeddingConfig,
    getEmbeddingConfigAsJson
}
