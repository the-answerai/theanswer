import express, { Request, Response, NextFunction } from 'express'
import passport from 'passport'
import { DataSource } from 'typeorm'
import { aaiPostAuthMiddleware } from '../../middlewares/authentication/aaiPostAuthMiddleware'

/**
 * Create Auth0 router for SSO login flow.
 *
 * Routes:
 * - GET /api/v1/auth0/login - Initiate Auth0 login (redirects to Auth0)
 * - GET /api/v1/auth0/callback - Handle Auth0 callback after authentication
 * - GET /api/v1/auth0/logout - Logout and clear session
 */
export const createAuth0Router = (AppDataSource: DataSource) => {
    const router = express.Router()

    /**
     * Initiate Auth0 login flow.
     * Query params:
     * - organization: Optional Auth0 organization ID to pre-select
     * - returnTo: Optional URL to redirect after successful login
     */
    router.get('/login', (req: Request, res: Response, next: NextFunction) => {
        const organization = req.query.organization as string
        const returnTo = req.query.returnTo as string

        // Store returnTo in session for use after callback
        if (returnTo) {
            ;(req.session as any).returnTo = returnTo
        }

        const authOptions: any = {
            scope: 'openid email profile'
        }

        // Pass organization hint if provided (Auth0 Organizations feature)
        if (organization) {
            authOptions.organization = organization
        }

        passport.authenticate('auth0', authOptions)(req, res, next)
    })

    /**
     * Auth0 callback handler.
     * After successful Auth0 authentication:
     * 1. Passport extracts profile
     * 2. aaiPostAuthMiddleware creates/updates user and sets up workspaces
     * 3. Session is established
     * 4. User is redirected to app
     */
    router.get(
        '/callback',
        // First: passport authenticates with Auth0
        (req: Request, res: Response, next: NextFunction) => {
            passport.authenticate('auth0', { session: false }, (err: any, user: any, info: any) => {
                if (err) {
                    console.error('[Auth0 Callback] Authentication error:', err)
                    const errorMsg = encodeURIComponent(err.message || 'Authentication failed')
                    return res.redirect(`/signin?error=${errorMsg}`)
                }

                if (!user) {
                    console.error('[Auth0 Callback] No user returned:', info)
                    return res.redirect('/signin?error=no_user')
                }

                // Attach user to request for aaiPostAuthMiddleware
                req.user = user
                next()
            })(req, res, next)
        },
        // Second: aaiPostAuthMiddleware enriches user with AAI data
        aaiPostAuthMiddleware(AppDataSource),
        // Third: establish session and redirect
        async (req: Request, res: Response) => {
            if (!req.user) {
                console.error('[Auth0 Callback] User lost after post-auth middleware')
                return res.redirect('/signin?error=auth_failed')
            }

            // Regenerate session to prevent session fixation
            req.session.regenerate((regenerateErr) => {
                if (regenerateErr) {
                    console.error('[Auth0 Callback] Session regeneration failed:', regenerateErr)
                    return res.redirect('/signin?error=session_failed')
                }

                // Login user into session
                req.login(req.user!, { session: true }, (loginErr) => {
                    if (loginErr) {
                        console.error('[Auth0 Callback] Login failed:', loginErr)
                        return res.redirect('/signin?error=login_failed')
                    }

                    // Get return URL from session or default
                    const returnTo = (req.session as any).returnTo || '/chatflows'
                    delete (req.session as any).returnTo

                    console.log('[Auth0 Callback] Login successful, redirecting to:', returnTo)
                    res.redirect(returnTo)
                })
            })
        }
    )

    /**
     * Logout handler.
     * Clears local session and redirects to Auth0 logout endpoint.
     */
    router.get('/logout', (req: Request, res: Response) => {
        // Clear passport session
        req.logout(() => {
            // Destroy session
            req.session.destroy((err) => {
                if (err) {
                    console.error('[Auth0 Logout] Session destroy error:', err)
                }

                // Build Auth0 logout URL
                const domain = process.env.AUTH0_DOMAIN
                const clientId = process.env.AUTH0_CLIENT_ID
                const returnTo = `${process.env.APP_URL || req.headers.origin || 'http://localhost:3000'}/signin`

                if (domain && clientId) {
                    // Redirect to Auth0 logout
                    const logoutUrl = `https://${domain}/v2/logout?` + `client_id=${clientId}&` + `returnTo=${encodeURIComponent(returnTo)}`
                    res.redirect(logoutUrl)
                } else {
                    // Just redirect to signin if Auth0 not configured
                    res.redirect(returnTo)
                }
            })
        })
    })

    /**
     * Check if Auth0 SSO is enabled
     */
    router.get('/status', (req: Request, res: Response) => {
        const enabled = !!(process.env.AUTH0_DOMAIN && process.env.AUTH0_CLIENT_ID && process.env.AUTH0_CLIENT_SECRET)
        res.json({
            enabled,
            provider: 'auth0'
        })
    })

    return router
}

export default createAuth0Router
