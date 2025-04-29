// utils/auth0.js
import { initAuth0 } from '@auth0/nextjs-auth0'

const getBaseUrl = () => {
    let baseURL
    if (process.env.VERCEL_PREVIEW_URL) {
        baseURL = `https://${process.env.VERCEL_PREVIEW_URL}`
    }
    if (process.env.VERCEL_URL) {
        baseURL = `https://${process.env.VERCEL_URL}`
    }
    if (process.env.AUTH0_BASE_URL) {
        baseURL = process.env.AUTH0_BASE_URL
    }
    if (baseURL) return baseURL
    throw new Error('No valid baseURL found. Set either VERCEL_PREVIEW_URL, VERCEL_URL, or AUTH0_BASE_URL environment variable.')
}

// Get full hostname instead of just domain (to avoid sharing cookies across subdomains)
const getFullHostname = () => {
    const baseUrl = getBaseUrl()
    try {
        const url = new URL(baseUrl)
        return url.hostname // Return the full hostname including subdomain
    } catch (error) {
        // Fallback to old behavior if URL parsing fails
        return process.env.AUTH0_BASE_URL?.replace('https://', '')?.replace('http://', '')?.split(':')[0]
    }
}

// For backward compatibility
const domain = process.env.AUTH0_BASE_URL?.replace('https://', '')?.replace('http://', '')?.split(':')[0]?.split('.')?.slice(-2)?.join('.')

// Default to specific hostname (isolation) unless explicitly disabled
const shouldShareCookies = process.env.SHARE_COOKIES_ACROSS_SUBDOMAINS === 'true'

export default initAuth0({
    secret: process.env.AUTH0_SECRET,
    issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
    baseURL: getBaseUrl(),
    clientID: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    idTokenSigningAlg: process.env.AUTH0_TOKEN_SIGN_ALG ?? 'HS256',
    session: {
        cookie: {
            domain: shouldShareCookies ? domain : getFullHostname()
        }
    },
    routes: {
        callback: '/api/auth/callback',
        postLogoutRedirect: '/'
    }
})
