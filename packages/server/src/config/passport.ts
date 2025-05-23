import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import { Strategy as ZoomStrategy, type ZoomProfile } from '@giorgosavgeris/passport-zoom-oauth2'
import type { PassportStatic } from 'passport'

export default function (passport: PassportStatic) {
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
        passport.use(
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
                        console.error('Passport Google OAuth Error:', err)
                        done(err instanceof Error ? err : new Error('Unknown error'), undefined)
                    }
                }
            )
        )
    }

    if (process.env.ZOOM_CLIENT_ID && process.env.ZOOM_CLIENT_SECRET) {
        passport.use(
            new ZoomStrategy(
                {
                    clientID: process.env.ZOOM_CLIENT_ID ?? '',
                    clientSecret: process.env.ZOOM_CLIENT_SECRET ?? '',
                    callbackURL: process.env.ZOOM_CALLBACK_URL ?? ''
                },
                async (accessToken: string, refreshToken: string, profile: ZoomProfile, done) => {
                    const expiresAt = new Date()
                    expiresAt.setHours(expiresAt.getHours() + 1)

                    // Try multiple ways to get the email from Zoom profile
                    const possibleEmails = [
                        profile.email,
                        profile.emails?.[0]?.value,
                        profile._json?.email as string,
                        profile._raw?.email as string
                    ].filter(Boolean)

                    const newCredential = {
                        fullName: profile.displayName ?? profile.account_id,
                        email: possibleEmails[0] ?? '',
                        provider: 'zoom',
                        providerId: profile.account_id ?? profile.id,
                        zoomAccessToken: accessToken,
                        zoomRefreshToken: refreshToken,
                        expiresAt
                    }

                    try {
                        done(null, newCredential)
                    } catch (err) {
                        console.error('Passport Zoom OAuth Error:', err)
                        done(err instanceof Error ? err : new Error('Unknown error'), undefined)
                    }
                }
            )
        )
    }

    passport.serializeUser((user: unknown, done) => {
        done(null, user)
    })

    passport.deserializeUser((user: unknown, done) => {
        done(null, false)
    })
}
