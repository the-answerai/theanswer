import { Request, Response, NextFunction } from 'express'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { StatusCodes } from 'http-status-codes'
import { registerOAuthClient, exchangeCodeForTokens, createCompleteCredentialData, clearPendingRegistration } from '../../utils'

const atlassianAuthCallback = async (req: Request, res: Response, next: NextFunction) => {
    const sendPopupMessage = (payload: object) => {
        const json = JSON.stringify(payload)
        res.setHeader('Content-Type', 'text/html')
        res.send(`
            <html>
              <body>
                <script>
                  if (window.opener) {
                    window.opener.postMessage(${json}, '*');
                    window.close();
                  }
                </script>
              </body>
            </html>
        `)
    }

    try {
        const code = req.query?.code as string
        const state = req.query?.state as string
        const error = req.query?.error as string

        if (error) {
            return sendPopupMessage({ type: 'AUTH_ERROR', error: `OAuth error: ${error}` })
        }

        if (!code) {
            throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, 'Error: atlassianAuthController.callback - authorization code missing')
        }

        if (!state) {
            throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, 'Error: atlassianAuthController.callback - state parameter missing')
        }

        const redirectUri = `${process.env.API_HOST}/api/v1/atlassian-auth/callback`
        const tokens = await exchangeCodeForTokens(state, code, redirectUri)
        const credential = createCompleteCredentialData(state, tokens, {})
        clearPendingRegistration(state)

        return sendPopupMessage({ type: 'AUTH_SUCCESS', user: credential })
    } catch (error) {
        console.error('Atlassian auth callback error:', error)
        next(error)
    }
}

const mcpInitialize = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const redirectUri = `${process.env.API_HOST}/api/v1/atlassian-auth/callback`

        const registrationResult = await registerOAuthClient(redirectUri)

        res.json({
            sessionId: registrationResult.sessionId,
            client_id: registrationResult.client_id,
            authorization_endpoint: registrationResult.authorization_endpoint,
            redirect_uri: redirectUri,
            scope: registrationResult.scope
        })
    } catch (error) {
        console.error('MCP initialization error:', error)
        if (error instanceof InternalFlowiseError) {
            res.status(error.statusCode).json({ error: error.message })
        } else {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Internal server error during MCP initialization' })
        }
    }
}

export default {
    atlassianAuthCallback,
    mcpInitialize
}
