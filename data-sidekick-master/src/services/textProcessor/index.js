/**
 * Text Processor Service
 *
 * A generic service for processing text content through AnswerAI with configurable
 * chatflow IDs and processing options. This service handles sending text to AnswerAI,
 * processing the response, and storing the results.
 */

// Export core processing functions
export { processText, processTextBatch, getProcessingStatus, processAndStoreText } from './processor.js'

// Export utility functions
export { extractMetadata, formatTextForProcessing, parseAnalysisResponse, validateConfig } from './utils.js'

/**
 * Test the connection to the AnswerAI API for text processing
 * @returns {Object} Status of the connection test
 */
export const testConnection = async () => {
    try {
        const { validateConfig } = await import('./utils.js')

        console.log('Starting Text Processor connection test...')
        const config = validateConfig()

        if (!config.isValid) {
            return {
                success: false,
                error: 'Invalid configuration',
                details: config.errors
            }
        }

        // Try to make a simple request to the AnswerAI endpoint
        try {
            const response = await fetch(config.endpoint, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            })

            return {
                success: response.ok,
                status: response.status,
                statusText: response.statusText,
                config: {
                    endpoint: config.endpoint
                }
            }
        } catch (apiError) {
            return {
                success: false,
                error: apiError.message,
                config: {
                    endpoint: config.endpoint
                }
            }
        }
    } catch (error) {
        console.error('Error testing Text Processor connection:', error)
        return {
            success: false,
            error: error.message,
            stack: error.stack
        }
    }
}
