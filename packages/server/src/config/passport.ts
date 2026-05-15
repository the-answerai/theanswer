import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import { Strategy as OAuth2Strategy } from 'passport-oauth2'
import { configureAuth0Strategy } from '../aai/auth/auth0Strategy'

export default function (passport: any) {
    // Configure Auth0 SSO strategy for browser login flow
    configureAuth0Strategy()
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
        // Validate API_HOST is set for Google OAuth callback
        if (!process.env.API_HOST) {
            console.error(
                '❌ ERROR: API_HOST environment variable is not set.\n' +
                    '   Google OAuth will fail with redirect_uri_mismatch error.\n' +
                    '   Fix: Add API_HOST to your .env file:\n' +
                    '        API_HOST=http://localhost:3000  (for local development)\n' +
                    '        API_HOST=https://yourdomain.com (for production)'
            )
        }

        passport.use(
            `google`,
            new GoogleStrategy(
                {
                    clientID: process.env.GOOGLE_CLIENT_ID ?? '',
                    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
                    callbackURL: `${process.env.API_HOST}/api/v1/google-auth/callback`,
                    proxy: true
                },
                async (accessToken, refreshToken, profile, done) => {
                    const expiresAt = new Date()
                    expiresAt.setHours(expiresAt.getHours() + 1)
                    const newCredential = {
                        fullName: profile.displayName,
                        email: profile.emails?.[0]?.value ?? '',
                        provider: profile.provider,
                        providerId: profile.id,
                        googleAccessToken: accessToken,
                        googleRefreshToken: refreshToken,
                        expiresAt
                    }
                    try {
                        done(null, newCredential as any)
                    } catch (err) {
                        console.error('Passport Error:', err)
                        done(err, undefined)
                    }
                }
            )
        )
    }

    if (process.env.SALESFORCE_CLIENT_ID && process.env.SALESFORCE_CLIENT_SECRET && process.env.SALESFORCE_INSTANCE_URL) {
        passport.use(
            `salesforce-dynamic`,
            new OAuth2Strategy(
                {
                    authorizationURL: `${process.env.SALESFORCE_INSTANCE_URL}/services/oauth2/authorize`,
                    tokenURL: `${process.env.SALESFORCE_INSTANCE_URL}/services/oauth2/token`,
                    clientID: process.env.SALESFORCE_CLIENT_ID,
                    clientSecret: process.env.SALESFORCE_CLIENT_SECRET,
                    callbackURL: `${process.env.API_HOST}/api/v1/salesforce-auth/callback`,
                    scope: 'api refresh_token',
                    passReqToCallback: true,
                    pkce: true,
                    state: true
                },
                async (req: any, accessToken: string, refreshToken: string, profile: any, done: any) => {
                    try {
                        // Fetch user info from Salesforce
                        const response = await fetch(`${process.env.SALESFORCE_INSTANCE_URL}/services/oauth2/userinfo`, {
                            headers: {
                                Authorization: `Bearer ${accessToken}`
                            }
                        })
                        const userInfo = await response.json()

                        const newCredential = {
                            refreshToken: refreshToken,
                            userInfo: userInfo
                        }
                        done(null, newCredential)
                    } catch (error) {
                        console.error('Salesforce OAuth Error:', error)
                        done(error, undefined)
                    }
                }
            )
        )
    }

    passport.serializeUser((user: any, done: any) => {
        done(null, user)
    })

    passport.deserializeUser((user: any, done: any) => {
        done(null, false)
    })
}
