// Auth0 v4 configuration
// In v4, we don't need initAuth0. The configuration is handled by environment variables.
import {
    // getSession,
    // updateSession,
    // withApiAuthRequired,
    withPageAuthRequired
    // handleAuth,
    // handleCallback,
    // handleLogin,
    // handleLogout,
    // handleProfile
} from '@auth0/nextjs-auth0'
import { Auth0Client } from '@auth0/nextjs-auth0/server'

const getBaseUrl = () => {
    let baseURL
    // console.log('Determining base URL...')

    if (process.env.VERCEL_PREVIEW_URL) {
        baseURL = `https://${process.env.VERCEL_PREVIEW_URL}`
        // console.log('Using VERCEL_PREVIEW_URL', { baseURL })
    }
    if (process.env.VERCEL_URL) {
        baseURL = `https://${process.env.VERCEL_URL}`
        // console.log('Using VERCEL_URL', { baseURL })
    }
    if (process.env.AUTH0_BASE_URL) {
        baseURL = process.env.AUTH0_BASE_URL
        // console.log('Using AUTH0_BASE_URL', { baseURL })
    }

    if (baseURL) {
        // console.log('Final base URL determined', { baseURL })
        return baseURL
    }

    const error = 'No valid baseURL found. Set either VERCEL_PREVIEW_URL, VERCEL_URL, or AUTH0_BASE_URL environment variable.'

    throw new Error(error)
}

const domain = process.env.AUTH0_ISSUER_BASE_URL?.replace('https://', '')?.replace('https://', '')

// Log Auth0 configuration for debugging
const baseURL = getBaseUrl()
const authConfig = {
    secret: process.env.AUTH0_SECRET,
    // issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
    appBaseUrl: baseURL,
    domain: domain,
    clientId: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    authorizationParameters: {
        response_type: 'code',
        scope: 'openid profile email',
        audience: process.env.AUTH0_AUDIENCE ?? 'https://theanswer.ai'
    },
    session: {
        cookie: {
            domain: process.env.AUTH0_DOMAIN
        }
    },
    // routes: {
    //     callback: '/api/auth/callback'
    //     // postLogoutRedirect: '/'
    // },

    organizationId: process.env.AUTH0_ORGANIZATION_ID
}

// console.log('Auth0 configuration', authConfig)

// Export configuration for use with Auth0 v4
// In v4, the SDK automatically picks up these environment variables:
// AUTH0_SECRET, AUTH0_ISSUER_BASE_URL, AUTH0_BASE_URL, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET
// Additional configuration can be done via AUTH0_* environment variables

// For backward compatibility, we export the auth0 SDK methods directly

// Export the configuration for custom usage
export const auth0Config = {
    ...authConfig,
    baseURL,
    domain
}

export const auth0 = new Auth0Client({
    ...auth0Config,
    async beforeSessionSaved(session, idToken) {
        console.log('🔐 beforeSessionSaved CALLED')
        console.log('📋 ID Token param:', JSON.stringify(idToken, null, 2))
        console.log('📋 Session param:', JSON.stringify(session, null, 2))
        console.log('👤 Session.user BEFORE:', JSON.stringify(session?.user, null, 2))

        // The claims are already in session.user from the ID token
        // We just need to map the namespaced claims to cleaner property names
        const user = session?.user || session

        session.user = {
            ...user,
            // Map namespaced roles claim to session.user.roles
            roles: user['https://theanswer.ai/roles'] || [],
            // Preserve existing org claims (already in ID token)
            org_id: user.org_id,
            org_name: user.org_name,
            // Preserve domain claims
            chatflowDomain: user.chatflowDomain,
            answersDomain: user.answersDomain,
            // Preserve Stripe customer ID if present
            stripeCustomerId: user.stripeCustomerId
        }

        console.log('👤 Session.user AFTER:', JSON.stringify(session?.user, null, 2))
        return session
    }
})

export default auth0
