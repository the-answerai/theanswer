import auth0 from '@utils/auth/auth0'
import { NextRequest, NextResponse } from 'next/server'

// const allowedOrigins = ['https://localhost:3210'] // TODO: lock this down
const allowedOrigins = ['*']

const corsOptions = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
}

export const middleware = async function middleware(request: NextRequest) {
    // Handle CORS for API routes
    // Handle simple requests
    const response = await auth0.middleware(request)

    if (request.nextUrl.pathname.startsWith('/api/')) {
        // Check the origin from the request
        const origin = request.headers.get('origin') ?? ''
        const isAllowedOrigin = allowedOrigins.includes(origin) || allowedOrigins.includes('*')

        // Handle preflighted requests
        const isPreflight = request.method === 'OPTIONS'

        if (isPreflight) {
            const preflightHeaders = {
                ...(isAllowedOrigin && { 'Access-Control-Allow-Origin': origin }),
                ...corsOptions
            }
            return NextResponse.json({}, { headers: preflightHeaders })
        }

        if (isAllowedOrigin) {
            response.headers.set('Access-Control-Allow-Origin', origin)
        }

        Object.entries(corsOptions).forEach(([key, value]) => {
            response.headers.set(key, value)
        })

        return response
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico, sitemap.xml, robots.txt (metadata files)
         */
        '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)'
    ]
}
