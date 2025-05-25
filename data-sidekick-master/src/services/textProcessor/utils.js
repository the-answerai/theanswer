/**
 * Text Processor Utilities
 *
 * Helper functions for text manipulation, metadata extraction,
 * and configuration validation.
 */

/**
 * Validate the configuration for the text processor
 * @returns {Object} Validation result with isValid flag and any errors
 */
export const validateConfig = () => {
    const errors = []

    // Check for required environment variables
    if (!process.env.ANSWERAI_ENDPOINT) {
        errors.push('ANSWERAI_ENDPOINT environment variable is not set')
    }

    // Format the endpoint URL properly
    let endpoint = process.env.ANSWERAI_ENDPOINT || ''

    // Remove trailing slash if present
    if (endpoint.endsWith('/')) {
        endpoint = endpoint.slice(0, -1)
    }

    // Check if the endpoint already includes /api/v1
    const hasApiPath = endpoint.includes('/api/v1')

    // Log configuration for debugging
    console.log('AnswerAI Endpoint Configuration:', {
        original: process.env.ANSWERAI_ENDPOINT,
        formatted: endpoint,
        hasApiPath
    })

    return {
        isValid: errors.length === 0,
        errors,
        endpoint,
        hasApiPath
    }
}

/**
 * Extract metadata from text content
 * @param {string} text - The text content to analyze
 * @param {Object} options - Options for metadata extraction
 * @returns {Object} Extracted metadata
 */
export const extractMetadata = (text, options = {}) => {
    const metadata = {
        wordCount: countWords(text),
        charCount: text.length,
        language: detectLanguage(text),
        ...options.additionalMetadata
    }

    return metadata
}

/**
 * Format text for processing based on the source format
 * @param {string} text - The raw text content
 * @param {string} format - The format of the text (plain, html, markdown, etc.)
 * @returns {string} Formatted text ready for processing
 */
export const formatTextForProcessing = (text, format = 'plain') => {
    if (!text) return ''

    switch (format.toLowerCase()) {
        case 'html':
            return stripHtmlTags(text)
        case 'markdown':
            return text // For now, we'll send markdown as-is
        case 'json':
            try {
                // If it's JSON, we'll try to extract text content from it
                const parsed = JSON.parse(text)
                if (typeof parsed === 'string') {
                    return parsed
                }
                if (parsed.text || parsed.content) {
                    return parsed.text || parsed.content
                }
                return JSON.stringify(parsed, null, 2)
            } catch (e) {
                console.warn('Failed to parse JSON text:', e.message)
                return text
            }
        default:
            return text
    }
}

/**
 * Parse the response from the AnswerAI API for analysis
 * @param {Object} response - The raw response from AnswerAI
 * @returns {Object} Parsed and structured analysis result
 */
export const parseAnalysisResponse = (response) => {
    // Check and handle different response formats from AnswerAI
    try {
        // If the response is a string, return it as summary
        if (typeof response === 'string') {
            return { summary: response }
        }

        // If the response has nested properties like 'text' or 'value'
        if (response.text) {
            try {
                // Try to parse it as JSON first
                return JSON.parse(response.text)
            } catch (e) {
                // If not parseable as JSON, treat as a summary
                return { summary: response.text }
            }
        }

        // If we have a json property, use that
        if (response.json) {
            return typeof response.json === 'string' ? JSON.parse(response.json) : response.json
        }

        // If we have a structured response with fields like 'summary', 'coaching', etc.
        const fields = ['summary', 'coaching', 'topics', 'sentiment', 'entities', 'keywords']
        const result = {}

        for (const field of fields) {
            // Check for presence in response or nested under 'result'
            if (response[field]) {
                result[field] = response[field]
            } else if (response.result?.[field]) {
                result[field] = response.result[field]
            }
        }

        // If we found structured fields, return them
        if (Object.keys(result).length > 0) {
            return result
        }

        // Otherwise, return the full response as is
        return response
    } catch (error) {
        console.error('Error parsing AnswerAI response:', error)

        // Return a simplified object with the error
        return {
            error: error.message,
            rawResponse: typeof response === 'string' ? response : JSON.stringify(response)
        }
    }
}

/**
 * Detect the language of a text (simplified)
 * @param {string} text - The text to analyze
 * @returns {string} The detected language code
 */
const detectLanguage = (text) => {
    // This is a very simplified detection
    // In production, you'd use a proper language detection library
    if (!text) return 'unknown'

    // For now, just assume English
    return 'en'
}

/**
 * Count words in a text string
 * @param {string} text - The text to count words in
 * @returns {number} Word count
 */
const countWords = (text) => {
    if (!text) return 0
    return text.trim().split(/\s+/).length
}

/**
 * Strip HTML tags from text
 * @param {string} html - The HTML text to strip tags from
 * @returns {string} Plain text without HTML tags
 */
const stripHtmlTags = (html) => {
    if (!html) return ''
    return html
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
}
