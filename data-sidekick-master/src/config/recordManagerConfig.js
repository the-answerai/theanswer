/**
 * Record Manager Configuration
 * This file centralizes all record manager configuration settings used throughout the application.
 */

/**
 * Get the record manager configuration object
 * @param {string} storeId - The document store ID
 * @param {string} [userId] - Optional user ID for namespace
 * @param {Object} [overrides] - Optional configuration overrides
 * @returns {Object} - The record manager configuration
 */
export const getRecordManagerConfig = (storeId, userId = 'default', overrides = {}) => {
    if (!storeId) {
        throw new Error('storeId is required for record manager configuration')
    }

    // Create a dynamic namespace using userId and storeId
    const namespace = `recordmanager_${userId}_${storeId}`

    const defaultConfig = {
        name: 'aaiRecordManager',
        config: {
            additionalConfig: '',
            namespace: namespace,
            cleanup: 'full',
            sourceIdKey: 'source'
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
 * Validate that the record manager configuration is complete
 * @returns {boolean} - True if configuration is valid, false otherwise
 */
export const validateRecordManagerConfig = () => {
    return true // No credentials to validate
}

/**
 * Get record manager configuration as JSON string for APIs that require it
 * @param {string} storeId - The document store ID
 * @param {string} [userId] - Optional user ID for namespace
 * @param {Object} [overrides] - Optional configuration overrides
 * @returns {string} - JSON string of the configuration
 */
export const getRecordManagerConfigAsJson = (storeId, userId = 'default', overrides = {}) => {
    return JSON.stringify(getRecordManagerConfig(storeId, userId, overrides).config)
}

export default {
    getRecordManagerConfig,
    validateRecordManagerConfig,
    getRecordManagerConfigAsJson
}
