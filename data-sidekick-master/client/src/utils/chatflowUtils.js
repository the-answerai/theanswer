/**
 * Utilities for working with AnswerAI chatflows
 */

/**
 * Get the chatflow iframe URL for a research view
 *
 * @param {Object} researchView - The research view object
 * @returns {string|null} - The chatflow URL or null if no chatflow ID is available
 */
export const getChatflowUrl = (researchView) => {
    if (!researchView || !researchView.answerai_chatflow_id) {
        return null
    }

    const chatflowId = researchView.answerai_chatflow_id
    const baseUrl = import.meta.env.VITE_ANSWERAI_URL || 'http://localhost:4000'

    return `${baseUrl}/chatbot/${chatflowId}`
}

/**
 * Get the direct API endpoint for a chatflow
 *
 * @param {Object} researchView - The research view object
 * @returns {string|null} - The chatflow API URL or null if no chatflow ID is available
 */
export const getChatflowApiUrl = (researchView) => {
    if (!researchView || !researchView.answerai_chatflow_id) {
        return null
    }

    const chatflowId = researchView.answerai_chatflow_id
    const baseUrl = import.meta.env.VITE_ANSWERAI_URL || 'http://localhost:4000'

    return `${baseUrl}/prediction/${chatflowId}`
}

/**
 * Check if a research view has a chatflow
 *
 * @param {Object} researchView - The research view object
 * @returns {boolean} - True if the research view has a chatflow ID
 */
export const hasChatflow = (researchView) => {
    return Boolean(researchView?.answerai_chatflow_id)
}
