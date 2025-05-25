/**
 * Utility functions for the AnswerAI service
 */
import { supabase } from '../../config/db.js'

/**
 * Get the research view ID for a document chunk
 * @param {Object} chunk The document chunk
 * @returns {string} The research view ID
 */
export const getResearchViewIdFromChunk = async (chunk) => {
    try {
        const { data, error } = await supabase.from('documents').select('source_id').eq('id', chunk.document_id).single()

        if (error) throw error

        const { data: source, error: sourceError } = await supabase
            .from('data_sources')
            .select('research_view_id')
            .eq('id', data.source_id)
            .single()

        if (sourceError) throw sourceError

        return source.research_view_id
    } catch (error) {
        console.error(`Error getting research view ID for chunk ${chunk.id}:`, error)
        return null
    }
}

/**
 * Get the research view ID for a document
 * @param {Object} document The document
 * @returns {string} The research view ID
 */
export const getResearchViewIdFromDocument = async (document) => {
    try {
        const { data: source, error } = await supabase.from('data_sources').select('research_view_id').eq('id', document.source_id).single()

        if (error) throw error

        return source.research_view_id
    } catch (error) {
        console.error(`Error getting research view ID for document ${document.id}:`, error)
        return null
    }
}

/**
 * Get research view by ID
 * @param {string} researchViewId The research view ID
 * @returns {Object} The research view
 */
export const getResearchViewById = async (researchViewId) => {
    try {
        const { data, error } = await supabase.from('research_views').select('*').eq('id', researchViewId).single()

        if (error) throw error
        return data
    } catch (error) {
        console.error(`Error getting research view with ID ${researchViewId}:`, error)
        return null
    }
}

/**
 * Get document store ID from research view
 * @param {string} researchViewId The research view ID
 * @returns {string} The document store ID
 */
export const getDocumentStoreIdFromResearchView = async (researchViewId) => {
    try {
        const researchView = await getResearchViewById(researchViewId)
        if (!researchView) {
            throw new Error(`Research view with ID ${researchViewId} not found`)
        }

        return researchView.answerai_store_id
    } catch (error) {
        console.error(`Error getting document store ID for research view ${researchViewId}:`, error)
        return null
    }
}
