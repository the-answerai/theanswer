import { Request, Response, NextFunction } from 'express'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { StatusCodes } from 'http-status-codes'
import passport from 'passport'

const clientId = process.env.SALESFORCE_CLIENT_ID
const clientSecret = process.env.SALESFORCE_CLIENT_SECRET
const instanceUrl = process.env.SALESFORCE_INSTANCE_URL
const apiHost = process.env.API_HOST

// Comprehensive environment logging
const logEnvironmentInfo = () => {
    console.log('=== SALESFORCE OAUTH DEBUG INFO ===')
    console.log('Environment Variables:')
    console.log(`- SALESFORCE_CLIENT_ID: ${clientId ? `${clientId.substring(0, 10)}...` : 'NOT SET'}`)
    console.log(`- SALESFORCE_CLIENT_SECRET: ${clientSecret ? `${clientSecret.substring(0, 6)}...` : 'NOT SET'}`)
    console.log(`- SALESFORCE_INSTANCE_URL: ${instanceUrl || 'NOT SET'}`)
    console.log(`- API_HOST: ${apiHost || 'NOT SET'}`)
    console.log(`- NODE_ENV: ${process.env.NODE_ENV || 'NOT SET'}`)
    console.log(`- Expected callback URL: ${apiHost}/api/v1/salesforce-auth/callback`)
    console.log('=== END SALESFORCE OAUTH DEBUG INFO ===')
}

const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        console.log('🔍 [SALESFORCE AUTH] Session configuration debug:', {
            sessionID: req.sessionID,
            sessionStore: req.sessionStore ? 'Present' : 'Missing',
            sessionData: req.session,
            cookieSecure: req.session?.cookie?.secure,
            cookieSameSite: req.session?.cookie?.sameSite
        })
        console.log('🔍 [SALESFORCE AUTH] Starting authentication process')
        console.log('🔍 [SALESFORCE AUTH] Request URL:', req.url)
        console.log('🔍 [SALESFORCE AUTH] Request headers:', {
            host: req.headers.host,
            'user-agent': req.headers['user-agent'],
            referer: req.headers.referer,
            origin: req.headers.origin
        })

        // Log environment info
        logEnvironmentInfo()

        // Validate required environment variables
        if (!clientId || !clientSecret || !instanceUrl) {
            const missing = []
            if (!clientId) missing.push('SALESFORCE_CLIENT_ID')
            if (!clientSecret) missing.push('SALESFORCE_CLIENT_SECRET')
            if (!instanceUrl) missing.push('SALESFORCE_INSTANCE_URL')

            console.error('❌ [SALESFORCE AUTH] Missing environment variables:', missing)
            throw new InternalFlowiseError(
                StatusCodes.BAD_REQUEST,
                `Error: Salesforce OAuth - Missing required Environment Variables: ${missing.join(', ')}`
            )
        }

        // Validate API_HOST for callback URL
        if (!apiHost) {
            console.warn('⚠️ [SALESFORCE AUTH] API_HOST not set - this may cause callback issues in deployment')
        }

        // Check if strategy is registered
        const strategy = (passport as any)._strategies?.['salesforce-dynamic']
        if (!strategy) {
            console.error('❌ [SALESFORCE AUTH] Salesforce strategy not found in passport strategies')
            console.log('Available strategies:', Object.keys((passport as any)._strategies || {}))
            throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, 'Salesforce OAuth strategy not configured')
        }

        console.log('✅ [SALESFORCE AUTH] Strategy found, proceeding with authentication')
        console.log('🔍 [SALESFORCE AUTH] Strategy configuration:', {
            authorizationURL: `${instanceUrl}/services/oauth2/authorize`,
            tokenURL: `${instanceUrl}/services/oauth2/token`,
            callbackURL: `${apiHost}/api/v1/salesforce-auth/callback`,
            scope: 'api refresh_token'
        })

        // Remove the dynamic configuration attempt - strategy is already configured in passport config
        // This was the original bug - configureSalesforceStrategy doesn't exist

        passport.authenticate('salesforce-dynamic', {
            scope: 'api refresh_token'
        })(req, res, next)

        console.log('✅ [SALESFORCE AUTH] Authentication middleware applied')
    } catch (error) {
        console.error('❌ [SALESFORCE AUTH] Error in authenticate:', error)
        console.error('❌ [SALESFORCE AUTH] Stack trace:', error instanceof Error ? error.stack : 'No stack trace')
        next(error)
    }
}

const salesforceAuthCallback = async (req: Request, res: Response) => {
    try {
        console.log('🔍 [SALESFORCE CALLBACK] Callback received')
        console.log('🔍 [SALESFORCE CALLBACK] Request URL:', req.url)
        console.log('🔍 [SALESFORCE CALLBACK] Query params:', req.query)
        console.log('🔍 [SALESFORCE CALLBACK] Request headers:', {
            host: req.headers.host,
            'user-agent': req.headers['user-agent'],
            referer: req.headers.referer,
            origin: req.headers.origin
        })
        console.log('🔍 [SALESFORCE CALLBACK] Session ID:', req.sessionID)
        console.log('🔍 [SALESFORCE CALLBACK] Session data:', req.session)
        console.log('🔍 [SALESFORCE CALLBACK] State from query:', req.query.state)
        console.log('🔍 [SALESFORCE CALLBACK] State from session:', req.session?.oauth2state)

        // Check for OAuth error parameters
        if (req.query.error) {
            console.error('❌ [SALESFORCE CALLBACK] OAuth error in query params:', {
                error: req.query.error,
                error_description: req.query.error_description,
                error_uri: req.query.error_uri
            })
        }

        // Check for authorization code
        if (req.query.code) {
            console.log('✅ [SALESFORCE CALLBACK] Authorization code received:', `${req.query.code}`.substring(0, 20) + '...')
        } else {
            console.warn('⚠️ [SALESFORCE CALLBACK] No authorization code in callback')
        }

        // Check for state parameter
        if (req.query.state) {
            console.log('✅ [SALESFORCE CALLBACK] State parameter received:', req.query.state)
        } else {
            console.warn('⚠️ [SALESFORCE CALLBACK] No state parameter in callback')
        }

        console.log('🔍 [SALESFORCE CALLBACK] User object:', req.user ? 'Present' : 'Missing')
        if (req.user) {
            console.log('🔍 [SALESFORCE CALLBACK] User keys:', Object.keys(req.user))
            if ((req.user as any).userInfo) {
                console.log('🔍 [SALESFORCE CALLBACK] User info keys:', Object.keys((req.user as any).userInfo))
                console.log('🔍 [SALESFORCE CALLBACK] User info sample:', {
                    user_id: (req.user as any).userInfo?.user_id,
                    organization_id: (req.user as any).userInfo?.organization_id,
                    email: (req.user as any).userInfo?.email
                })
            }
        }

        if (!req.user) {
            console.error('❌ [SALESFORCE CALLBACK] Authentication failed - no user object')
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, 'Error: Salesforce authController.callback - Authentication failed')
        }

        console.log('✅ [SALESFORCE CALLBACK] Sending success response')
        res.setHeader('Content-Type', 'text/html')
        res.send(`
            <html>
              <body>
                <script>
                  console.log('Salesforce OAuth success, posting message to opener');
                  if (window.opener) {
                    window.opener.postMessage({ 
                      type: 'AUTH_SUCCESS',
                      user: ${JSON.stringify(req.user)}
                    }, '*');
                    window.close();
                  } else {
                    console.error('No window.opener found');
                    document.body.innerHTML = '<h2>Authentication successful</h2><p>Please close this window and return to the application.</p>';
                  }
                </script>
              </body>
            </html>
        `)
    } catch (error) {
        console.error('❌ [SALESFORCE CALLBACK] Error in callback:', error)
        console.error('❌ [SALESFORCE CALLBACK] Stack trace:', error instanceof Error ? error.stack : 'No stack trace')

        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
        const errorStack = error instanceof Error ? error.stack : undefined

        const errorInfo = {
            message: errorMessage,
            stack: errorStack,
            url: req.url,
            query: req.query,
            user: req.user ? 'present' : 'missing'
        }

        res.send(`
            <html>
              <body>
                <script>
                  console.error('Salesforce OAuth error:', ${JSON.stringify(errorInfo)});
                  if (window.opener) {
                    window.opener.postMessage({
                      type: 'AUTH_ERROR',
                      error: ${JSON.stringify(errorInfo)}
                    }, '*');
                    window.close();
                  } else {
                    document.body.innerHTML = '<h2>Authentication failed</h2><p>Error: ${errorMessage}</p><p>Please close this window and try again.</p>';
                  }
                </script>
              </body>
            </html>
        `)
    }
}

export default {
    authenticate,
    salesforceAuthCallback
}
