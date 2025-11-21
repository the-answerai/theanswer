import axios from 'axios'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { StatusCodes } from 'http-status-codes'

interface TokenResponse {
    access_token: string
    expires_in: number
    token_type: string
}

/**
 * Manages Auth0 Machine-to-Machine (M2M) tokens for data-sidekick API
 *
 * Implements token caching to avoid hitting Auth0 rate limits.
 * Tokens are refreshed automatically when expired.
 *
 * @example
 * ```typescript
 * const token = await auth0M2MTokenManager.getAccessToken()
 * // Use token in Authorization header
 * ```
 */
class Auth0M2MTokenManager {
    private token: string | null = null
    private tokenExpiry: number = 0
    private readonly tokenUrl: string
    private readonly clientId: string
    private readonly clientSecret: string
    private readonly audience: string
    private readonly enabled: boolean

    constructor() {
        this.tokenUrl = `${process.env.AUTH0_ISSUER_BASE_URL}/oauth/token`
        this.clientId = process.env.DATA_SIDEKICK_CLIENT_ID || ''
        this.clientSecret = process.env.DATA_SIDEKICK_CLIENT_SECRET || ''
        this.audience = process.env.DATA_SIDEKICK_AUDIENCE || 'https://data-sidekick-api'

        // Check if M2M is properly configured
        this.enabled = !!(this.clientId && this.clientSecret && process.env.AUTH0_ISSUER_BASE_URL)

        if (!this.enabled) {
            console.warn('[Auth0M2M] M2M authentication disabled - missing configuration:')
            if (!this.clientId) console.warn('  - DATA_SIDEKICK_CLIENT_ID not set')
            if (!this.clientSecret) console.warn('  - DATA_SIDEKICK_CLIENT_SECRET not set')
            if (!process.env.AUTH0_ISSUER_BASE_URL) console.warn('  - AUTH0_ISSUER_BASE_URL not set')
            console.warn('[Auth0M2M] Data engine API calls will fail unless service key authentication is configured')
        } else {
            console.log('[Auth0M2M] Initialized with audience:', this.audience)
        }
    }

    /**
     * Get access token (cached or fetch new)
     * Automatically refreshes token when expired
     *
     * @returns {Promise<string>} Access token for data-sidekick API
     * @throws {InternalFlowiseError} If token acquisition fails
     */
    async getAccessToken(): Promise<string> {
        if (!this.enabled) {
            throw new InternalFlowiseError(
                StatusCodes.INTERNAL_SERVER_ERROR,
                'Error: auth0M2M.getAccessToken - M2M authentication not configured. Set DATA_SIDEKICK_CLIENT_ID and DATA_SIDEKICK_CLIENT_SECRET environment variables.'
            )
        }

        // Return cached token if still valid (with 5 min buffer)
        if (this.token && Date.now() < this.tokenExpiry - 300000) {
            return this.token
        }

        try {
            console.log('[Auth0M2M] Requesting new M2M token from Auth0...')

            const response = await axios.post<TokenResponse>(
                this.tokenUrl,
                {
                    grant_type: 'client_credentials',
                    client_id: this.clientId,
                    client_secret: this.clientSecret,
                    audience: this.audience
                },
                {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 10000
                }
            )

            this.token = response.data.access_token
            this.tokenExpiry = Date.now() + response.data.expires_in * 1000

            console.log(`[Auth0M2M] Token obtained successfully (expires in ${response.data.expires_in} seconds)`)
            return this.token
        } catch (error: any) {
            console.error('[Auth0M2M] Failed to obtain token:', {
                error: error.message,
                response: error.response?.data,
                status: error.response?.status
            })

            // Clear cached token on error
            this.clearToken()

            const errorMessage = error.response?.data?.error_description || error.response?.data?.error || error.message

            throw new InternalFlowiseError(
                StatusCodes.INTERNAL_SERVER_ERROR,
                `Error: auth0M2M.getAccessToken - Failed to obtain M2M token: ${errorMessage}`
            )
        }
    }

    /**
     * Clear cached token (useful for testing or force refresh)
     */
    clearToken() {
        this.token = null
        this.tokenExpiry = 0
        console.log('[Auth0M2M] Token cache cleared')
    }

    /**
     * Check if token is currently cached and valid
     *
     * @returns {boolean} True if valid token is cached
     */
    hasValidToken(): boolean {
        return !!(this.token && Date.now() < this.tokenExpiry - 300000)
    }

    /**
     * Check if M2M authentication is enabled
     *
     * @returns {boolean} True if properly configured
     */
    isEnabled(): boolean {
        return this.enabled
    }
}

export const auth0M2MTokenManager = new Auth0M2MTokenManager()
