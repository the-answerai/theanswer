/**
 * AnswerAI Service
 * Provides integration with the AnswerAI API for document processing,
 * embeddings, vector stores, and AI services.
 */

// Export client utility functions
export { logConfigDetails, isValidJWT, formatApiUrl, getAuthHeader, makeApiRequest } from './client.js'

// Export document store functions
export { createDocumentStore, processDocument, insertToVectorStore, getDocumentStore, listDocumentStores } from './documentStore.js'

// Export AI service functions
export { generateEmbeddings, suggestCategory } from './aiService.js'

// Export utility functions
export {
    getResearchViewIdFromChunk,
    getResearchViewIdFromDocument,
    getResearchViewById,
    getDocumentStoreIdFromResearchView
} from './utils.js'

// Add the export for upsertTextDocument
export { processTextDocument, upsertTextDocument, checkProcessingStatus } from './documentProcessor.js'

/**
 * Test the connection to the AnswerAI API
 * @returns {Object} Status of the connection test
 */
export const testConnection = async () => {
    try {
        const { logConfigDetails, isValidJWT, makeApiRequest } = await import('./client.js')

        console.log('Starting AnswerAI connection test...')
        const config = logConfigDetails()

        // Try to get a list of document stores as a simple test
        console.log('Sending test request to AnswerAI API...')
        try {
            const result = await makeApiRequest('/document-store/stores', 'GET')
            console.log('AnswerAI API test successful')

            return {
                success: true,
                data: result,
                isValidToken: isValidJWT(process.env.ANSWERAI_TOKEN),
                config
            }
        } catch (apiError) {
            return {
                success: false,
                error: apiError.message,
                status: apiError.status,
                isValidToken: isValidJWT(process.env.ANSWERAI_TOKEN),
                config
            }
        }
    } catch (error) {
        console.error('Error testing AnswerAI connection:', error)
        return {
            success: false,
            error: error.message,
            stack: error.stack,
            config: (await import('./client.js')).logConfigDetails()
        }
    }
}
