import session from 'express-session'
import { Express } from 'express'
import passport from 'passport'
import { configureAuth0Strategy } from './auth0Strategy'

/**
 * Setup AAI session middleware and passport initialization.
 * This is required for passport-based authentication flows (Auth0 SSO).
 *
 * Note: This runs BEFORE the enterprise passport middleware if both are enabled.
 * The session store can be extended to use Redis/DB for production.
 */
export const setupAAISession = (app: Express) => {
    const sessionSecret = process.env.EXPRESS_SESSION_SECRET || 'aai-session-secret'
    const secureCookie = process.env.APP_URL?.startsWith('https') || process.env.SECURE_COOKIES === 'true'

    // Session configuration
    const sessionConfig: session.SessionOptions = {
        secret: sessionSecret,
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: secureCookie,
            httpOnly: true,
            sameSite: 'lax' as const,
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        }
    }

    // Apply session middleware
    app.use(session(sessionConfig))

    // Initialize passport
    app.use(passport.initialize())
    app.use(passport.session())

    // Configure passport serialization
    // We serialize the full user object since aaiPostAuthMiddleware enriches it
    passport.serializeUser((user: any, done) => {
        done(null, user)
    })

    passport.deserializeUser((user: any, done) => {
        // For now, return the serialized user as-is
        // Could enhance to re-fetch user from DB if needed
        done(null, user)
    })

    // Configure Auth0 strategy (if env vars present)
    configureAuth0Strategy()

    console.log('[AAI Session] Session middleware initialized', {
        secure: secureCookie,
        maxAge: '24h'
    })
}

export default setupAAISession
