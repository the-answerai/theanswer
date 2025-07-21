/* eslint-disable no-console */
import express from 'express'
import salesforceAuthController from '../../controllers/salesforce-auth'
import passport from 'passport'

const router = express.Router()

// Main authentication endpoint
router.get('/', (req, res, next) => {
    console.log('🔍 [SALESFORCE ROUTES] Auth route hit:', req.url)
    console.log('🔍 [SALESFORCE ROUTES] Session ID:', req.sessionID)
    console.log('🔍 [SALESFORCE ROUTES] Session data before auth:', req.session)
    console.log('🔍 [SALESFORCE ROUTES] Request details:', {
        method: req.method,
        headers: {
            host: req.headers.host,
            'user-agent': req.headers['user-agent'],
            referer: req.headers.referer,
            origin: req.headers.origin
        }
    })
    salesforceAuthController.authenticate(req, res, next)
})

// Error handling endpoint
router.get('/error', (req, res) => {
    console.log('🔍 [SALESFORCE ROUTES] Error route hit:', req.url)
    console.log('🔍 [SALESFORCE ROUTES] Query params:', req.query)

    const messages = (req.session as any)?.messages || []
    const errorMessage = messages.length > 0 ? messages[messages.length - 1] : req.query.error

    console.log('🔍 [SALESFORCE ROUTES] Session messages:', messages)
    console.log('🔍 [SALESFORCE ROUTES] Error message:', errorMessage)

    res.json({ error: errorMessage })
})

// OAuth callback endpoint - this is where most deployment issues occur
router.get('/callback', (req, res, next) => {
    console.log('🔍 [SALESFORCE ROUTES] Callback route hit:', req.url)
    console.log('🔍 [SALESFORCE ROUTES] Session ID:', req.sessionID)
    console.log('🔍 [SALESFORCE ROUTES] Session data:', req.session)
    console.log('🔍 [SALESFORCE ROUTES] State from query:', req.query.state)
    console.log('🔍 [SALESFORCE ROUTES] State from session:', (req.session as any)?.oauth2state)
    console.log('🔍 [SALESFORCE ROUTES] Full URL:', `${req.protocol}://${req.get('host')}${req.originalUrl}`)
    console.log('🔍 [SALESFORCE ROUTES] Query parameters:', req.query)
    console.log('🔍 [SALESFORCE ROUTES] Headers:', {
        host: req.headers.host,
        'x-forwarded-proto': req.headers['x-forwarded-proto'],
        'x-forwarded-host': req.headers['x-forwarded-host'],
        'user-agent': req.headers['user-agent'],
        referer: req.headers.referer,
        origin: req.headers.origin
    })

    // Check if this is a proper OAuth callback
    if (!req.query.code && !req.query.error) {
        console.warn('⚠️ [SALESFORCE ROUTES] Callback received without code or error - possible redirect issue')
    }

    // Log the passport authentication attempt
    console.log('🔍 [SALESFORCE ROUTES] Attempting passport authentication with strategy: salesforce-dynamic')

    passport.authenticate('salesforce-dynamic', (err: any, user: any, info: any) => {
        console.log('🔍 [SALESFORCE ROUTES] Passport authenticate callback executed')
        console.log(
            '🔍 [SALESFORCE ROUTES] Error:',
            err
                ? {
                      message: err.message,
                      stack: err.stack,
                      name: err.name
                  }
                : 'None'
        )
        console.log(
            '🔍 [SALESFORCE ROUTES] User:',
            user
                ? {
                      keys: Object.keys(user),
                      hasRefreshToken: !!user.refreshToken,
                      hasUserInfo: !!user.userInfo
                  }
                : 'None'
        )
        console.log('🔍 [SALESFORCE ROUTES] Info:', info)

        if (err) {
            console.error('❌ [SALESFORCE ROUTES] Passport authentication error:', err)
            console.error('❌ [SALESFORCE ROUTES] Error details:', {
                message: err.message,
                code: err.code,
                statusCode: err.statusCode,
                data: err.data
            })

            const errorMsg = err?.message || 'Authentication failed with error'
            console.log('🔍 [SALESFORCE ROUTES] Redirecting to error page with message:', errorMsg)
            return res.redirect(`/api/v1/salesforce-auth/error?error=${encodeURIComponent(errorMsg)}`)
        }

        if (!user) {
            console.warn('⚠️ [SALESFORCE ROUTES] No user object returned from passport')
            console.log('🔍 [SALESFORCE ROUTES] Info object:', info)

            const errorMsg = info?.message || 'Authentication failed - no user'
            console.log('🔍 [SALESFORCE ROUTES] Redirecting to error page with message:', errorMsg)
            return res.redirect(`/api/v1/salesforce-auth/error?error=${encodeURIComponent(errorMsg)}`)
        }

        console.log('✅ [SALESFORCE ROUTES] Authentication successful, setting user and calling controller')
        req.user = user

        // Call the success callback
        try {
            salesforceAuthController.salesforceAuthCallback(req, res)
        } catch (callbackError) {
            console.error('❌ [SALESFORCE ROUTES] Error in callback controller:', callbackError)
            return res.redirect(`/api/v1/salesforce-auth/error?error=${encodeURIComponent('Callback processing failed')}`)
        }
    })(req, res, next)
})

// Add a health check endpoint for debugging
router.get('/health', (req, res) => {
    console.log('🔍 [SALESFORCE ROUTES] Health check endpoint hit')

    const healthInfo = {
        timestamp: new Date().toISOString(),
        environment: {
            NODE_ENV: process.env.NODE_ENV,
            API_HOST: process.env.API_HOST,
            SALESFORCE_INSTANCE_URL: process.env.SALESFORCE_INSTANCE_URL,
            hasClientId: !!process.env.SALESFORCE_CLIENT_ID,
            hasClientSecret: !!process.env.SALESFORCE_CLIENT_SECRET
        },
        request: {
            protocol: req.protocol,
            host: req.get('host'),
            url: req.originalUrl,
            headers: {
                'x-forwarded-proto': req.headers['x-forwarded-proto'],
                'x-forwarded-host': req.headers['x-forwarded-host']
            }
        },
        passport: {
            hasStrategy: !!(passport as any)._strategies?.['salesforce-dynamic'],
            strategies: Object.keys((passport as any)._strategies || {})
        }
    }

    console.log('🔍 [SALESFORCE ROUTES] Health info:', healthInfo)
    res.json(healthInfo)
})

export default router
