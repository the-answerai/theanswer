import { Request, Response, NextFunction } from 'express'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { StatusCodes } from 'http-status-codes'
import passport from 'passport'
import { randomBytes } from 'crypto'

// MCP OAuth controller - no legacy environment variables needed

// Store for temporary MCP client credentials during OAuth flow
const mcpClientStore = new Map<
    string,
    {
        client_id: string
        client_secret: string
        authorization_endpoint: string
        token_endpoint: string
        issuer: string
        registration_endpoint: string
        expires: number
    }
>()

const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        passport.authenticate('atlassian-dynamic')(req, res, next)
    } catch (error) {
        console.log('Error: Atlassian MCP authController.authenticate', error)
        next(error)
    }
}

const atlassianAuthCallback = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, 'Error: Atlassian authController.callback - Authentication failed')
        }

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
        console.error('Atlassian auth callback error:', error)
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

const mcpInitialize = async (req: Request, res: Response) => {
    try {
        // Step 1: Discover MCP OAuth metadata
        const metadataResponse = await fetch('https://mcp.atlassian.com/.well-known/oauth-authorization-server')
        if (!metadataResponse.ok) {
            throw new InternalFlowiseError(
                StatusCodes.BAD_REQUEST,
                `Failed to fetch MCP OAuth metadata: ${metadataResponse.status} ${metadataResponse.statusText}`
            )
        }

        const metadata = await metadataResponse.json()

        // Step 2: Register dynamic client with MCP server
        const registrationPayload = {
            redirect_uris: [`${process.env.API_HOST}/api/v1/atlassian-auth/callback`],
            client_name: 'Flowise Atlassian Integration',
            client_uri: process.env.API_HOST,
            grant_types: ['authorization_code', 'refresh_token'],
            response_types: ['code'],
            scope: [
                'offline_access',
                'read:account',
                'read:confluence-content.all',
                'read:confluence-content.summary',
                'read:confluence-groups',
                'read:confluence-props',
                'read:confluence-space.summary',
                'read:confluence-user',
                'read:jira-user',
                'read:jira-work',
                'read:me',
                'readonly:content.attachment:confluence',
                'search:confluence',
                'write:confluence-content',
                'write:confluence-file',
                'write:confluence-props',
                'write:jira-work'
            ].join(' ')
        }

        const registrationResponse = await fetch(metadata.registration_endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json'
            },
            body: JSON.stringify(registrationPayload)
        })

        if (!registrationResponse.ok) {
            const errorText = await registrationResponse.text()
            throw new InternalFlowiseError(
                StatusCodes.BAD_REQUEST,
                `MCP client registration failed: ${registrationResponse.status} ${registrationResponse.statusText}: ${errorText}`
            )
        }

        const clientInfo = await registrationResponse.json()

        // Step 3: Generate session ID and store client credentials temporarily
        const sessionId = randomBytes(32).toString('hex')
        const expires = Date.now() + 30 * 60 * 1000 // 30 minutes

        mcpClientStore.set(sessionId, {
            client_id: clientInfo.client_id,
            client_secret: clientInfo.client_secret,
            authorization_endpoint: metadata.authorization_endpoint,
            token_endpoint: metadata.token_endpoint,
            issuer: metadata.issuer,
            registration_endpoint: metadata.registration_endpoint,
            expires
        })

        // Clean up expired entries
        for (const [key, value] of mcpClientStore.entries()) {
            if (value.expires < Date.now()) {
                mcpClientStore.delete(key)
            }
        }

        // Step 4: Return client info and endpoints to frontend
        res.json({
            sessionId,
            client_id: clientInfo.client_id,
            authorization_endpoint: metadata.authorization_endpoint,
            redirect_uri: `${process.env.API_HOST}/api/v1/atlassian-auth/callback`,
            scope: registrationPayload.scope
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
    authenticate,
    atlassianAuthCallback,
    mcpInitialize,
    mcpClientStore
}
