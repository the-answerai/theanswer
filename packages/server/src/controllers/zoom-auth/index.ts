import type { Request, Response, NextFunction } from 'express'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { StatusCodes } from 'http-status-codes'
import passport from 'passport'

const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        console.log('🚀 Zoom OAuth authenticate called')
        console.log('ZOOM_CLIENT_ID:', process.env.ZOOM_CLIENT_ID ? '✅ Set' : '❌ Missing')
        console.log('ZOOM_CLIENT_SECRET:', process.env.ZOOM_CLIENT_SECRET ? '✅ Set' : '❌ Missing')
        console.log('ZOOM_CALLBACK_URL:', process.env.ZOOM_CALLBACK_URL)

        if (!process.env.ZOOM_CLIENT_ID || !process.env.ZOOM_CLIENT_SECRET) {
            console.error('❌ Missing Zoom OAuth credentials')
            throw new InternalFlowiseError(
                StatusCodes.INTERNAL_SERVER_ERROR,
                'Error: zoomAuthController.authenticate - Missing Zoom OAuth credentials'
            )
        }

        console.log('✅ Zoom credentials present, starting passport authentication')
        passport.authenticate('zoom')(req, res, next)
    } catch (error) {
        // eslint-disable-next-line no-console
        console.log('Error: zoomAuthController.authenticate', error)
        next(error)
    }
}

const zoomAuthCallback = async (req: Request, res: Response) => {
    try {
        console.log('🎯 Zoom OAuth callback received')
        console.log('Query params:', req.query)
        console.log('Full user object from Zoom:', JSON.stringify(req.user, null, 2))

        if (!req.user) {
            console.error('❌ No user data received from Zoom')
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, 'Error: zoomAuthController.zoomAuthCallback - Authentication failed')
        }

        // Let's see exactly what fields Zoom is providing
        const user = req.user as any
        console.log('🔍 Zoom user fields analysis:')
        console.log('  - id:', user.id)
        console.log('  - account_id:', user.account_id)
        console.log('  - displayName:', user.displayName)
        console.log('  - email:', user.email)
        console.log('  - emails array:', user.emails)
        console.log('  - profile object:', user.profile)
        console.log('  - _json object:', user._json)
        console.log('  - _raw object:', user._raw)

        console.log('✅ Zoom authentication successful, sending response to popup')
        // Using "*" as the target origin allows the message to be received by any window
        // The opener window will still need to validate the message source for security
        res.setHeader('Content-Type', 'text/html')
        res.send(`
            <html>
              <body>
                <script>
                  if (window.opener) {
                    window.opener.postMessage({ 
                      type: 'AUTH_SUCCESS',
                      user: ${JSON.stringify(req.user)}
                    }, '*');
                    window.close();
                  }
                </script>
              </body>
            </html>
        `)
    } catch (error) {
        console.error('❌ Zoom auth callback error:', error)
        res.send(`
            <html>
              <body>
                <script>
                  if (window.opener) {
                    window.opener.postMessage({
                      type: 'AUTH_ERROR',
                      error: ${JSON.stringify(error)}
                    }, '*');
                    window.close();
                  }
                </script>
              </body>
            </html>
        `)
    }
}

export default {
    authenticate,
    zoomAuthCallback
}
