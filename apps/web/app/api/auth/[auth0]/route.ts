// app/api/auth/[auth0]/route.js
import { redirect } from 'next/navigation'
import Auth0 from '@utils/auth/auth0'
import { enrichSessionWithFlowise } from '@utils/auth/enrichSession'

// Debug logging helper with safety
const debugLog = (message: string, data?: any) => {
    if (process.env.AUTH0_DEBUG === 'true' || process.env.DEBUG === 'true') {
        let dataStr = ''
        if (data) {
            try {
                dataStr = JSON.stringify(data, null, 2)
            } catch {
                dataStr = String(data)
            }
        }
        console.log('🔐 AUTH0 ROUTE DEBUG:', message, dataStr)
    }
}

export const GET = Auth0.handleAuth({
    // AAI: Custom me handler - enriches user with Flowise data on every /api/auth/me request
    me: async (req: Request) => {
        console.log('[auth/me] Fetching enriched user')
        try {
            const session = await Auth0.getSession()
            if (!session?.user) {
                return new Response(JSON.stringify({ error: 'Not authenticated' }), {
                    status: 401,
                    headers: { 'Content-Type': 'application/json' }
                })
            }

            // Enrich session with Flowise data
            const enrichedSession = await enrichSessionWithFlowise(session)
            console.log('[auth/me] Returning enriched user')

            return new Response(JSON.stringify(enrichedSession.user), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            })
        } catch (error: any) {
            console.error('[auth/me] Error:', error.message)
            // Fallback to default profile handler
            return Auth0.handleProfile()(req)
        }
    },
    onError(req: Request, error: Error) {
        // Always log basic error
        console.error('❌ AUTH0 ERROR:', error.message)

        // Enhanced debugging
        debugLog('Auth0 error occurred', {
            message: error.message,
            name: error.name,
            url: req.url,
            method: req.method,
            timestamp: new Date().toISOString()
        })

        // Detailed debug info only when enabled
        if (process.env.AUTH0_DEBUG === 'true' || process.env.DEBUG === 'true') {
            console.error('❌ DEBUG ERROR DETAILS:', {
                message: error.message,
                stack: error.stack,
                name: error.name,
                url: req.url,
                headers: Object.fromEntries(req.headers.entries())
            })
        }

        return redirect('/auth/error?error=' + encodeURIComponent(error.message))
    }
})
