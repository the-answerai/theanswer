/**
 * Auth0 configuration for server-side authentication
 */
const createConfig = (env) => {
    // Validate required environment variables
    const requiredVars = ['AUTH0_SECRET', 'AUTH0_BASE_URL', 'AUTH0_CLIENT_ID', 'AUTH0_CLIENT_SECRET', 'AUTH0_ISSUER_BASE_URL']

    const missingVars = requiredVars.filter((varName) => !env[varName])
    if (missingVars.length > 0) {
        console.warn('Missing recommended Auth0 environment variables:', missingVars)
        console.warn('Authentication may not work correctly without these variables.')
    }

    // Check if we're using HTTPS by looking at the baseURL
    const isHttps = env.AUTH0_BASE_URL?.startsWith('https://') || false

    // Default values for local development if not provided
    const baseURL = env.AUTH0_BASE_URL || 'http://localhost:5173'
    const clientID = env.AUTH0_CLIENT_ID
    const clientSecret = env.AUTH0_CLIENT_SECRET
    const issuerBaseURL = env.AUTH0_ISSUER_BASE_URL || 'https://answer-ai.us.auth0.com'
    const secret = env.AUTH0_SECRET || 'a-long-random-string-for-development-only'
    const logoutURL = env.AUTH0_LOGOUT_URL || baseURL

    const config = {
        authRequired: false,
        auth0Logout: true,
        secret,
        baseURL,
        clientID,
        clientSecret,
        issuerBaseURL,
        routes: {
            callback: '/api/auth/callback',
            login: '/api/auth/login',
            logout: '/api/auth/logout',
            postLogoutRedirect: logoutURL
        },
        session: {
            absoluteDuration: 24 * 60 * 60, // 24 hours in seconds
            rolling: true,
            cookie: {
                secure: isHttps, // Only use secure cookies with HTTPS
                sameSite: 'Lax'
            }
        },
        authorizationParams: {
            response_type: 'code',
            scope: 'openid profile email'
        }
    }

    // Log configuration for debugging
    console.log('Auth0 Config Details:', {
        baseURL: config.baseURL,
        issuerBaseURL: config.issuerBaseURL,
        clientID: config.clientID,
        fullCallbackURL: `${baseURL}${config.routes.callback}`,
        routes: config.routes,
        postLogoutRedirect: config.routes.postLogoutRedirect,
        secret: config.secret ? 'Present' : 'Missing',
        clientSecret: config.clientSecret ? 'Present' : 'Missing',
        session: {
            ...config.session,
            cookie: config.session.cookie
        }
    })

    return config
}

export default createConfig
