import { supabase } from '../config/db.js'
import { getDocumentStore, insertToVectorStore } from '../services/answerAI/index.js'
import { createAnswerAIDocumentStore } from '../utils/documentProcessor.js'
import { getRecordManagerConfig } from '../config/recordManagerConfig.js'
import { getVectorStoreConfig } from '../config/vectorStoreConfig.js'
import { getEmbeddingConfig } from '../config/embeddingConfig.js'

/**
 * Vectorize the documents in a research view
 * This endpoint:
 * 1. Gets the document store ID from the research view
 * 2. Fetches the document store configuration
 * 3. Calls insertToVectorStore with the configuration
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const vectorizeDocuments = async (req, res) => {
    try {
        const { viewId } = req.params
        // Extract userId from request, defaulting to viewId if not available
        const userId = req.user?.sub || req.session?.userId || viewId || 'default'

        // Get the research view to get the document store ID
        const { data: researchView, error: viewError } = await supabase.from('research_views').select('*').eq('id', viewId).single()

        if (viewError) {
            console.error('Error fetching research view:', viewError)
            return res.status(404).json({ error: 'Research view not found', details: viewError })
        }

        let storeId = researchView.answerai_store_id

        // If document store ID is not set, create a document store
        if (!storeId) {
            console.log('Research view has no document store ID. Creating one...')
            try {
                // Create a document store for this research view
                const docStoreResult = await createAnswerAIDocumentStore(researchView, userId)

                if (!docStoreResult) {
                    return res.status(500).json({
                        error: 'Failed to create document store for this research view'
                    })
                }

                // Refresh research view to get the updated store ID
                const { data: updatedView, error: refreshError } = await supabase
                    .from('research_views')
                    .select('answerai_store_id')
                    .eq('id', viewId)
                    .single()

                if (refreshError || !updatedView?.answerai_store_id) {
                    return res.status(500).json({
                        error: 'Created document store but failed to retrieve the ID',
                        details: refreshError
                    })
                }

                storeId = updatedView.answerai_store_id
                console.log(`Created document store with ID: ${storeId}`)
            } catch (createError) {
                console.error('Error creating document store:', createError)
                return res.status(500).json({
                    error: 'Failed to create document store',
                    details: createError.message
                })
            }
        }

        // Get the document store to get the configurations
        try {
            // First, get the document store details from AnswerAI
            const documentStore = await getDocumentStore(storeId)

            // Get configurations from centralized modules with userId
            const vectorStoreConfig = getVectorStoreConfig(storeId, userId)
            const embeddingConfig = getEmbeddingConfig()
            const recordManagerConfig = getRecordManagerConfig(storeId, userId)

            // Extract name and config from each configuration object if needed
            const config = {
                storeId,
                vectorStoreName: vectorStoreConfig.name,
                vectorStoreConfig: vectorStoreConfig.config,
                embeddingName: embeddingConfig.name,
                embeddingConfig: embeddingConfig.config,
                recordManagerName: recordManagerConfig.name,
                recordManagerConfig: recordManagerConfig.config
            }

            // Call the insertToVectorStore function with the document store configurations
            const result = await insertToVectorStore(storeId, userId, config)

            // Log the statistics for server-side monitoring
            console.log('Vectorization statistics:', {
                numAdded: result.numAdded || 0,
                numDeleted: result.numDeleted || 0,
                numUpdated: result.numUpdated || 0,
                numSkipped: result.numSkipped || 0,
                totalKeys: result.totalKeys || 0
            })

            // Return the complete result including statistics
            return res.json({
                message: 'Vectorization process completed successfully',
                storeId,
                result
            })
        } catch (storeError) {
            console.error('Error with document store:', storeError)
            return res.status(500).json({
                error: 'Failed to get document store or start vectorization',
                details: storeError.message
            })
        }
    } catch (error) {
        console.error('Error vectorizing documents:', error)
        return res.status(500).json({
            error: 'An error occurred while vectorizing documents',
            details: error.message
        })
    }
}
