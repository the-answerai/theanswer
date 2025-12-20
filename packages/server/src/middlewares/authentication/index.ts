import { NextFunction, Request, Response } from 'express'
import { auth } from 'express-oauth2-jwt-bearer'

import { DataSource } from 'typeorm'
import { User } from '../../database/entities/User'
import { Organization } from '../../database/entities/Organization'
import apikeyService from '../../services/apikey'
import { findOrCreateOrganization } from './findOrCreateOrganization'
import { findOrCreateUser, updateUserOrganization } from './findOrCreateUser'
import { ensureStripeCustomerForUser } from './ensureStripeCustomerForUser'
import { findOrCreateDefaultChatflowsForUser } from './findOrCreateDefaultChatflowsForUser'
import { DEFAULT_CUSTOMER_ID, OVERRIDE_CUSTOMER_ID } from '../../aai-utils/billing/config'

const jwtCheck = auth({
    authRequired: true,
    audience: process.env.AUTH0_AUDIENCE,
    issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
    tokenSigningAlg: process.env.AUTH0_TOKEN_SIGN_ALG ?? 'RS256'
})

const jwtCheckPublic = auth({
    authRequired: false,
    audience: process.env.AUTH0_AUDIENCE,
    issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
    tokenSigningAlg: process.env.AUTH0_TOKEN_SIGN_ALG ?? 'RS256'
})

/**
 * Check if a token looks like a JWT (has three parts separated by dots)
 */
const looksLikeJWT = (token: string): boolean => {
    const parts = token.split('.')
    return parts.length === 3
}

const tryApiKeyAuth = async (req: Request, AppDataSource: DataSource): Promise<User | null> => {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
        return null
    }

    const token = authHeader.split(' ')[1]

    // If token looks like a JWT, skip API key authentication
    if (looksLikeJWT(token)) {
        return null
    }

    const apiKeyData = await apikeyService.verifyApiKey(token)
    if (!apiKeyData) {
        return null
    }

    // Get user from API key's userId
    const user = await AppDataSource.getRepository(User).findOne({
        where: { id: apiKeyData.userId }
    })

    if (!user) {
        return null
    }

    return user
}

export const authenticationHandlerMiddleware =
    ({ whitelistURLs, AppDataSource }: { whitelistURLs: string[]; AppDataSource: DataSource }) =>
    async (req: Request, res: Response, next: NextFunction) => {
        /**
         * Organization-Based Authentication Security Model:
         *
         * 1. Protected Routes (requireAuth = true):
         *    - Valid org users: Full authentication and user creation
         *    - Invalid org users: 401 Unauthorized
         *    - API key with invalid org: 401 Unauthorized
         *
         * 2. Public Routes (requireAuth = false):
         *    - Valid org JWT users: Full authentication and user creation
         *    - Invalid org JWT users: Treated as anonymous (req.user = undefined)
         *    - API key users: Full access regardless of org
         *
         * This ensures only authorized organization users can access protected
         * resources while maintaining public access for cross-org scenarios.
         */

        // const startTime = new Date().getTime()
        const requireAuth = /\/api\/v1\//i.test(req.url) && !whitelistURLs.some((url) => req.url.includes(url))
        const jwtMiddleware = requireAuth ? jwtCheck : jwtCheckPublic

        // Check if there are any cookies for Authorization and inject them into the request
        const authCookie = req.cookies?.Authorization
        if (authCookie) {
            req.headers.Authorization = authCookie
        }

        // Try API key authentication first
        let apiKeyUser: User | null = null
        let apiKeyError: any
        const authHeader = req.headers.authorization
        const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null
        const isTokenJWT = token ? looksLikeJWT(token) : false

        // Only try API key auth if token doesn't look like a JWT
        if (token && !isTokenJWT) {
            try {
                apiKeyUser = await tryApiKeyAuth(req, AppDataSource)
            } catch (error) {
                apiKeyError = error
            }
        }

        if (apiKeyUser) {
            // For API key users, we need to get the organization's auth0Id
            const organization = await AppDataSource.getRepository(Organization).findOne({
                where: { id: apiKeyUser.organizationId }
            })

            const isValidApiKeyOrg = organization?.auth0Id && process.env.AUTH0_ORGANIZATION_ID?.split(',')?.includes(organization.auth0Id)

            if (requireAuth && !isValidApiKeyOrg) {
                return res.status(401).send("Unauthorized: API key organization doesn't match")
            }

            // Store API key user with additional auth0 org info
            req.user = apiKeyUser as any
            ;(req.user as any).auth0OrgId = organization?.auth0Id

            // Apply billing customer override for organizational billing consolidation
            if (OVERRIDE_CUSTOMER_ID && DEFAULT_CUSTOMER_ID && req.user) {
                req.user.stripeCustomerId = DEFAULT_CUSTOMER_ID
            }

            return next()
        }

        // If we have a token that doesn't look like a JWT and API key auth failed, return error
        if (token && !isTokenJWT && !apiKeyUser) {
            if (apiKeyError) {
                console.error('[Auth] API key verification failed:', {
                    error: apiKeyError instanceof Error ? apiKeyError.message : apiKeyError,
                    keyPrefix: token.substring(0, 8) + '...'
                })
                // If it's an InternalFlowiseError with UNAUTHORIZED, use its message
                if (apiKeyError.statusCode === 401) {
                    return res.status(401).json({ error: 'Unauthorized: Invalid API key' })
                }
            }
            return res.status(401).json({ error: 'Unauthorized: Invalid API key' })
        }
        // /auth/me endpoint is now handled by dedicated route in aai/routes/auth-me.ts

        // Fall back to JWT authentication
        jwtMiddleware(req, res, async (jwtError?: any) => {
            if (!req.user) {
                if (jwtError) {
                    return next(jwtError)
                }

                // Proceed with user synchronization if user is authenticated
                if (!req.auth?.payload) {
                    if (apiKeyError) {
                        console.error('Error verifying API key:', apiKeyError)
                    }
                    return next()
                }

                // Update the cookies with the authorization token for future requests with low expiry time
                res.cookie('Authorization', req.headers.authorization, { maxAge: 900000, httpOnly: true, secure: true })

                // Check for organization match if required
                const authPayload = (req as any).auth?.payload
                const userOrgId = authPayload?.org_id
                const isValidOrg = userOrgId && process.env.AUTH0_ORGANIZATION_ID?.split(',')?.includes(userOrgId)
                if (requireAuth && !isValidOrg) {
                    return res.status(401).send("Unauthorized: Organization doesn't match")
                }

                // Get user from auth payload
                const authUser = authPayload
                const auth0Id = authUser.sub
                const email = authUser.email as string
                const name = authUser.name as string
                const roles = (authUser?.['https://theanswer.ai/roles'] || []) as string[]
                if (!auth0Id || !email) {
                    return next()
                }

                try {
                    if (isValidOrg && userOrgId) {
                        // Check if org exists first (handles chicken-egg problem)
                        const orgRepo = AppDataSource.getRepository(Organization)
                        let organization = await orgRepo.findOneBy({ auth0Id: userOrgId })

                        let user
                        if (organization) {
                            // Org exists - create user with org
                            user = await findOrCreateUser(AppDataSource, auth0Id, email, name, organization.id)
                        } else {
                            // Org doesn't exist - create user first, then org
                            user = await findOrCreateUser(AppDataSource, auth0Id, email, name)
                            organization = await findOrCreateOrganization(AppDataSource, userOrgId, authUser.org_name as string, user.id)
                            await updateUserOrganization(AppDataSource, user.id, organization.id)
                            user.organizationId = organization.id
                        }

                        // Replace the Stripe customer logic with the new ensureStripeCustomerForUser function
                        user = await ensureStripeCustomerForUser(AppDataSource, user, organization, auth0Id, email, name)

                        // Find or create default chatflows for the user
                        const defaultChatflowId = await findOrCreateDefaultChatflowsForUser(AppDataSource, user)
                        // Update user with the latest defaultChatflowId
                        if (defaultChatflowId && user.defaultChatflowId !== defaultChatflowId) {
                            try {
                                // Persist the update to the database to prevent race conditions
                                await AppDataSource.getRepository(User).update(user.id, { defaultChatflowId })
                                user.defaultChatflowId = defaultChatflowId
                            } catch (error) {
                                console.warn(`Failed to update defaultChatflowId for user ${user.id}:`, error)
                                // Continue - don't break auth flow for non-critical update
                            }
                        }

                        // Set permissions based on roles
                        const permissions: string[] = []
                        if (roles?.includes('Admin')) {
                            permissions.push('org:manage')
                        }

                        // Apply billing customer override for organizational billing consolidation
                        if (OVERRIDE_CUSTOMER_ID && DEFAULT_CUSTOMER_ID) {
                            user.stripeCustomerId = DEFAULT_CUSTOMER_ID
                        }

                        req.user = { ...authUser, ...user, roles, permissions } as any
                    } else {
                        // User authenticated but from unauthorized organization - treat as anonymous user
                        console.warn(`Auth: User ${email} from org '${userOrgId}' treated as anonymous - not in allowed orgs`)
                        req.user = undefined
                    }
                } catch (error) {
                    console.error('Authentication error:', error)
                    return res.status(500).send('Internal Server Error during authentication')
                }
            }

            return next()
        })
    }

export default authenticationHandlerMiddleware
