declare module 'passport-forcedotcom' {
    import { Strategy as PassportStrategy } from 'passport-strategy'

    export interface StrategyOptions {
        clientID: string
        clientSecret: string
        callbackURL: string
        authorizationURL?: string
        tokenURL?: string
        scope?: string | string[]
        passReqToCallback?: boolean
        pkce?: boolean
        state?: boolean
        codeChallenge?: string
        codeChallengeMethod?: 'S256' | 'plain'
    }

    export interface Profile {
        id: string
        displayName?: string
        name?: {
            familyName?: string
            givenName?: string
            middleName?: string
        }
        emails?: Array<{
            value: string
            type?: string
        }>
        photos?: Array<{
            value: string
        }>
        provider: string
        _raw: string
        _json: any
    }

    export type VerifyFunction = (
        accessToken: string,
        refreshToken: string,
        profile: Profile,
        done: (error?: any, user?: any, info?: any) => void
    ) => void

    export type VerifyFunctionWithRequest = (
        req: any,
        accessToken: string,
        refreshToken: string,
        profile: Profile,
        done: (error?: any, user?: any, info?: any) => void
    ) => void

    export class Strategy extends PassportStrategy {
        constructor(options: StrategyOptions, verify: VerifyFunction | VerifyFunctionWithRequest)
        name: string
        authenticate(req: any, options?: any): void
    }
}
