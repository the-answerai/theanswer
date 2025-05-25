// Configuration for external URLs used in the application
// These are loaded from environment variables

// Studio URL
export const getStudioUrl = () => {
    return import.meta.env.VITE_STUDIO_URL || 'http://localhost:3000'
}

// Documentation URL
export const getDocsUrl = () => {
    return import.meta.env.VITE_DOCS_URL || 'http://localhost:4242'
}

export default {
    getStudioUrl,
    getDocsUrl
}
