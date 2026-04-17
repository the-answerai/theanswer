/**
 * AAI Session Enrichment Utility
 *
 * Enriches Auth0 session with Flowise user data (workspaces, permissions, features).
 * Used by Auth0 afterCallback hook to enrich user at login time.
 *
 * Server-side enrichment source: packages/server/src/aai/auth/enrichUserData.ts
 * Type definitions: packages-answers/ui/src/types/user.ts
 */

export interface EnrichSessionOptions {
    /** Override the Flowise API host */
    apiHost?: string
    /** Timeout in milliseconds (default: 5000) */
    timeout?: number
}

/**
 * Enriches an Auth0 session with Flowise user data.
 *
 * Calls Flowise /api/v1/auth/me to get enriched user data including:
 * - activeWorkspaceId, assignedWorkspaces
 * - permissions, features
 * - isOrganizationAdmin, organizationId
 * - stripeCustomerId, defaultChatflowId
 *
 * @param session - Auth0 session object
 * @param options - Optional configuration
 * @returns Enriched session with merged user data
 */
export async function enrichSessionWithFlowise(session: any, options: EnrichSessionOptions = {}): Promise<any> {
    if (!session?.user) {
        return session
    }

    let apiHost =
        options.apiHost ||
        process.env.FLOWISE_DOMAIN ||
        process.env.API_HOST ||
        (process.env.NODE_ENV === 'development' ? 'http://localhost:4000' : null) ||
        session.user?.chatflowDomain

    // Ensure apiHost is an absolute URL
    if (apiHost && !apiHost.startsWith('http')) {
        // If it's a base64 encoded domain, decode it
        if (/^[A-Za-z0-9+/=]+$/.test(apiHost)) {
            try {
                const decoded = Buffer.from(apiHost, 'base64').toString('utf-8')
                if (decoded.includes('localhost') || decoded.includes('.')) {
                    apiHost = `http://${decoded}`
                }
            } catch {
                // Not base64, treat as hostname
                apiHost = `http://${apiHost}`
            }
        } else {
            apiHost = `http://${apiHost}`
        }
    }

    if (!apiHost || !session.accessToken) {
        console.debug('[AAI enrichSession] Missing apiHost or accessToken, skipping enrichment')
        return session
    }

    const timeout = options.timeout ?? 5000

    try {
        console.log(`[AAI enrichSession] Calling ${apiHost}/api/v1/auth/me`)
        console.log(`[AAI enrichSession] Token present: ${!!session.accessToken}, Token length: ${session.accessToken?.length || 0}`)

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)

        const response = await fetch(`${apiHost}/api/v1/auth/me`, {
            headers: {
                Authorization: `Bearer ${session.accessToken}`,
                'Content-Type': 'application/json',
                'x-request-from': 'aai'
            },
            signal: controller.signal,
            cache: 'no-store'
        })

        clearTimeout(timeoutId)

        if (response.ok) {
            const data = await response.json()
            const enrichedUser = data.user || data

            if (enrichedUser) {
                // Save Auth0 roles before merge — the ID token carries https://theanswer.ai/roles
                // but the access token (used by Flowise) often does not, so Flowise returns roles: []
                const auth0Roles = session.user?.['https://theanswer.ai/roles']

                // Merge Auth0 user with Flowise enriched data (Flowise takes priority)
                session.user = { ...session.user, ...enrichedUser }

                // Restore Auth0 roles if Flowise couldn't extract them from the access token
                if (auth0Roles?.length && (!session.user.roles || session.user.roles.length === 0)) {
                    session.user.roles = Array.isArray(auth0Roles) ? auth0Roles : [auth0Roles]
                }

                console.debug('[AAI enrichSession] User enriched successfully with fields:', Object.keys(enrichedUser).join(', '))
            }
        } else {
            const errorText = await response.text().catch(() => 'unknown')
            console.warn(`[AAI enrichSession] Flowise returned ${response.status}: ${errorText}`)
        }
    } catch (error: any) {
        if (error.name === 'AbortError') {
            console.warn('[AAI enrichSession] Request timed out')
        } else {
            console.warn('[AAI enrichSession] Failed to enrich session:', error.message)
        }
    }

    return session
}

export default enrichSessionWithFlowise
