import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import { Strategy as OAuth2Strategy } from 'passport-oauth2'

export default function (passport: any) {
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
        passport.use(
            `google`,
            new GoogleStrategy(
                {
                    clientID: process.env.GOOGLE_CLIENT_ID ?? '',
                    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
                    callbackURL: process.env.GOOGLE_CALLBACK_URL ?? '',
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
                        done(null, newCredential)
                    } catch (err) {
                        console.error('Passport Error:', err)
                        done(err, undefined)
                    }
                }
            )
        )
    }

    if (process.env.SALESFORCE_CLIENT_ID && process.env.SALESFORCE_CLIENT_SECRET && process.env.SALESFORCE_INSTANCE_URL) {
        console.log('🔍 [PASSPORT CONFIG] Configuring Salesforce OAuth strategy')
        console.log('🔍 [PASSPORT CONFIG] Strategy config:', {
            authorizationURL: `${process.env.SALESFORCE_INSTANCE_URL}/services/oauth2/authorize`,
            tokenURL: `${process.env.SALESFORCE_INSTANCE_URL}/services/oauth2/token`,
            callbackURL: `${process.env.API_HOST}/api/v1/salesforce-auth/callback`,
            scope: 'api refresh_token',
            state: false,
            pkce: true
        })
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
                    state: false
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
        console.log('✅ [PASSPORT CONFIG] Salesforce strategy registered successfully')
    } else {
        console.warn('⚠️ [PASSPORT CONFIG] Salesforce OAuth not configured - missing environment variables')
    }

    passport.serializeUser((user: any, done: any) => {
        done(null, user)
    })

    passport.deserializeUser((user: any, done: any) => {
        done(null, false)
    })
}
