/**
 * Client helper for interacting with the AnswerAI API
 * Handles common configuration, authentication, and request formatting
 */
import fetch from 'node-fetch'

// AnswerAI API endpoint from environment variables
const ANSWERAI_ENDPOINT = process.env.ANSWERAI_ENDPOINT
const ANSWERAI_TOKEN = process.env.ANSWERAI_TOKEN

/**
 * Log details about the environment and configuration
 * @returns {Object} Config details
 */
export const logConfigDetails = () => {
    const config = {
        endpointConfigured: !!ANSWERAI_ENDPOINT,
        tokenConfigured: !!ANSWERAI_TOKEN,
        endpointPrefix: ANSWERAI_ENDPOINT ? `${ANSWERAI_ENDPOINT.substring(0, 10)}...` : 'Not set',
        tokenPrefix: ANSWERAI_TOKEN ? `${ANSWERAI_TOKEN.substring(0, 5)}...` : 'Not set',
        tokenLength: ANSWERAI_TOKEN ? ANSWERAI_TOKEN.length : 0
    }

    console.log('AnswerAI Configuration:', config)
    return config
}

/**
 * Validate JWT token format
 * @param {string} token The JWT token to validate
 * @returns {boolean} Whether the token is valid
 */
export const isValidJWT = (token) => {
    if (!token) return false

    // Check if token starts with 'ia-' prefix, which indicates it's an AnswerAI API key format
    if (token.startsWith('ia-')) {
        return true // Accept AnswerAI API key format
    }

    // A JWT consists of three parts separated by dots
    const parts = token.split('.')
    if (parts.length !== 3) {
        console.error('JWT token does not have 3 parts')
        return false
    }

    // Each part should be base64url encoded
    try {
        const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString())
        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString())

        // Check if header has typical JWT fields
        if (!header.alg) {
            console.error('JWT token header missing algorithm')
            return false
        }

        // Signature exists (we don't validate it cryptographically here)
        if (!parts[2]) {
            console.error('JWT token missing signature')
            return false
        }

        return true
    } catch (error) {
        console.error('Error parsing JWT token:', error.message)
        return false
    }
}

/**
 * Format the AnswerAI API endpoint URL
 * @param {string} endpoint The endpoint path (without base URL)
 * @returns {string} The fully formatted URL
 */
export const formatApiUrl = (endpoint) => {
    if (!ANSWERAI_ENDPOINT) {
        throw new Error('ANSWERAI_ENDPOINT not set')
    }

    // Ensure ANSWERAI_ENDPOINT is properly formatted
    let baseEndpoint = ANSWERAI_ENDPOINT
    if (baseEndpoint.endsWith('/')) {
        baseEndpoint = baseEndpoint.slice(0, -1)
    }

    // Ensure endpoint starts with a slash if not empty
    let formattedEndpoint = endpoint || ''
    if (formattedEndpoint && !formattedEndpoint.startsWith('/')) {
        formattedEndpoint = `/${formattedEndpoint}`
    }

    // Construct the URL properly with /api/v1 if not already included
    return baseEndpoint.includes('/api/v1') ? `${baseEndpoint}${formattedEndpoint}` : `${baseEndpoint}/api/v1${formattedEndpoint}`
}

/**
 * Get authorization header for AnswerAI API requests
 * @returns {string} The authorization header
 */
export const getAuthHeader = () => {
    if (!ANSWERAI_TOKEN) {
        throw new Error('ANSWERAI_TOKEN not set')
    }

    const tokenValue = ANSWERAI_TOKEN.trim()
    return `Bearer ${tokenValue}`
}

/**
 * Make a request to the AnswerAI API
 * @param {string} endpoint The API endpoint path
 * @param {string} method The HTTP method
 * @param {Object} [body] The request body
 * @returns {Promise<Object>} The API response
 */
export const makeApiRequest = async (endpoint, method = 'GET', body = null) => {
    try {
        // Verify configuration
        if (!ANSWERAI_ENDPOINT || !ANSWERAI_TOKEN) {
            logConfigDetails()
            throw new Error('ANSWERAI_ENDPOINT or ANSWERAI_TOKEN not set')
        }

        const url = formatApiUrl(endpoint)
        console.log(`Calling AnswerAI API (${method}) at URL:`, url)

        // Prepare request options
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                Authorization: getAuthHeader()
            }
        }

        // Add body for non-GET requests
        if (body && method !== 'GET') {
            options.body = JSON.stringify(body)

            // Log request parameters (excluding sensitive information)
            console.log(
                'Request parameters:',
                Object.keys(body).reduce((acc, key) => {
                    // Skip logging full content of sensitive fields
                    if (typeof body[key] === 'object') {
                        acc[key] = '[Object]'
                    } else if (typeof body[key] === 'string' && body[key].length > 100) {
                        acc[key] = `${body[key].substring(0, 50)}... (truncated)`
                    } else {
                        acc[key] = body[key]
                    }
                    return acc
                }, {})
            )
        }

        // Make the API request
        const response = await fetch(url, options)

        // Handle the response
        if (!response.ok) {
            let errorText
            try {
                errorText = await response.text()
            } catch (e) {
                errorText = 'Could not read error response'
            }

            console.error('AnswerAI API error response:', {
                status: response.status,
                statusText: response.statusText,
                url,
                body: errorText
            })

            throw new Error(`AnswerAI API returned ${response.status}: ${errorText}`)
        }

        const result = await response.json()
        return result
    } catch (error) {
        console.error(`Error in AnswerAI API request to ${endpoint}:`, error)
        throw error
    }
}
