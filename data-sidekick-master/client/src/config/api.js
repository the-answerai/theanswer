const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export const getApiUrl = (endpoint) => {
    // Remove any leading 'api/' or '/api/' since it's included in the base URL
    const cleanEndpoint = endpoint.replace(/^\/?(api\/)?/, '')
    return `${API_URL}/api/${cleanEndpoint}`
}

export default {
    getApiUrl
}
