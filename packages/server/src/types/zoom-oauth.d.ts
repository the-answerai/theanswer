declare module '@giorgosavgeris/passport-zoom-oauth2' {
    import { Strategy as PassportStrategy } from 'passport-strategy'

    export interface ZoomProfile {
        id: string
        account_id: string
        displayName?: string
        email?: string
        emails?: Array<{ value: string; type?: string }>
        provider: string
        _json?: Record<string, unknown>
        _raw?: Record<string, unknown>
        [key: string]: unknown
    }

    export interface ZoomStrategyOptions {
        clientID: string
        clientSecret: string
        callbackURL: string
        [key: string]: unknown
    }

    export type ZoomVerifyCallback = (
        accessToken: string,
        refreshToken: string,
        profile: ZoomProfile,
        done: (error?: Error | null, user?: unknown) => void
    ) => void

    export class Strategy extends PassportStrategy {
        constructor(options: ZoomStrategyOptions, verify: ZoomVerifyCallback)
    }
}
