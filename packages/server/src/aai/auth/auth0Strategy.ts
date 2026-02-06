/* eslint-disable no-console */
import passport from 'passport'
import { Strategy as Auth0Strategy, Profile, StrategyOptionWithRequest, ExtraVerificationParams } from 'passport-auth0'
import { Request } from 'express'

/**
 * Configure Auth0 passport strategy for browser SSO login flow.
 * This complements the existing JWT validation (express-oauth2-jwt-bearer)
 * which handles API requests.
 *
 * Flow:
 * 1. User clicks "Login with Auth0" → redirects to Auth0
 * 2. Auth0 authenticates user → redirects to callback URL
 * 3. This strategy extracts profile → aaiPostAuthMiddleware creates user
 * 4. Session established → user can access protected routes
 */
export const configureAuth0Strategy = () => {
    const domain = process.env.AUTH0_DOMAIN
    const clientID = process.env.AUTH0_CLIENT_ID
    const clientSecret = process.env.AUTH0_CLIENT_SECRET
    const callbackURL = process.env.AUTH0_CALLBACK_URL || `${process.env.API_HOST || 'http://localhost:3000'}/api/v1/auth0/callback`

    if (!domain || !clientID || !clientSecret) {
        console.log('[Auth0 SSO] Missing AUTH0_DOMAIN, AUTH0_CLIENT_ID, or AUTH0_CLIENT_SECRET - Auth0 SSO disabled')
        return
    }

    // Strategy options - use type assertion for options not in types
    const strategyOptions: StrategyOptionWithRequest = {
        domain,
        clientID,
        clientSecret,
        callbackURL,
        passReqToCallback: true
    }

    passport.use(
        'auth0',
        new Auth0Strategy(
            strategyOptions,
            async (
                req: Request,
                accessToken: string,
                refreshToken: string,
                extraParams: ExtraVerificationParams,
                profile: Profile,
                done: (error: any, user?: any) => void
            ) => {
                try {
                    const email = profile.emails?.[0]?.value
                    if (!email) {
                        console.error('[Auth0 SSO] No email in profile for user:', profile.id)
                        return done({ name: 'AUTH0_NO_EMAIL', message: 'Email not found in Auth0 profile' })
                    }

                    // Extract Auth0 organization info (if using Auth0 Organizations feature)
                    const orgId = (profile._json as any)?.org_id
                    const orgName = (profile._json as any)?.org_name

                    // Extract custom roles claim (configured in Auth0 Actions)
                    const roles = ((profile._json as any)?.['https://theanswer.ai/roles'] || []) as string[]

                    // Return minimal profile - aaiPostAuthMiddleware handles full user creation
                    const passportUser = {
                        auth0Id: profile.id,
                        sub: profile.id, // For compatibility with JWT authentication path
                        email,
                        name: profile.displayName || email,
                        org_id: orgId,
                        org_name: orgName,
                        roles,
                        // Store tokens for potential refresh needs
                        accessToken,
                        refreshToken
                    }

                    console.log('[Auth0 SSO] User authenticated:', { email, orgId, roles })
                    done(null, passportUser)
                } catch (error) {
                    console.error('[Auth0 SSO] Strategy error:', error)
                    done(error)
                }
            }
        )
    )

    console.log('[Auth0 SSO] Strategy configured with callback:', callbackURL)
}

export default configureAuth0Strategy
