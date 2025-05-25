// Auth0 configuration for the Data Sidekick application
const AUTH0_CONFIG = {
    domain: import.meta.env.VITE_AUTH0_DOMAIN || 'answer-ai.us.auth0.com',
    clientId: import.meta.env.VITE_AUTH0_CLIENT_ID || 'kMlWwgBvKJw61Z63Hc3KZFiCCPFUVeTq', // Data Sidekick client ID
    authorizationParams: {
        // Set redirect URI based on environment
        redirect_uri:
            import.meta.env.VITE_AUTH0_CALLBACK_URL ||
            (import.meta.env.PROD ? 'https://data-sidekick.answeragent.ai/callback' : 'http://localhost:5173/callback'),
        scope: 'openid profile email'
    },
    cacheLocation: 'localstorage'
}

export default AUTH0_CONFIG
