/**
 * AAI Token Verification Middleware
 *
 * Handles authentication for requests with `x-request-from: aai` header.
 * Uses Auth0 RS256 JWT verification as primary method, with enterprise
 * passport HS256 as fallback for backwards compatibility.
 *
 * Flow:
 * 1. Try Auth0 RS256 verification first (primary path)
 * 2. Fall back to enterprise passport HS256 if Auth0 fails
 * 3. Return 401 if both methods fail (no anonymous access)
 */
import { Request, Response, NextFunction } from 'express'
import { auth } from 'express-oauth2-jwt-bearer'
import { DataSource } from 'typeorm'
import { findOrCreateUser, updateUserOrganization } from './findOrCreateUser'
import { findOrCreateOrganization } from './findOrCreateOrganization'
import { Organization } from '../../database/entities/Organization'
import { findOrCreateWorkspacesForUser } from './findOrCreateWorkspacesForUser'
import { populateWorkspaceData } from './populateWorkspaceData'

// Auth0 RS256 JWT checker (same config as authenticationHandlerMiddleware)
const jwtCheck = auth({
    authRequired: true,
    audience: process.env.AUTH0_AUDIENCE,
    issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
    tokenSigningAlg: process.env.AUTH0_TOKEN_SIGN_ALG ?? 'RS256'
})

export const verifyAAIToken = (AppDataSource: DataSource) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        // STEP 1: Try Auth0 RS256 verification first
        jwtCheck(req, res, async (auth0Err?: any) => {
            if (!auth0Err) {
                // Auth0 succeeded - extract claims and set user
                try {
                    const authPayload = (req as any).auth?.payload
                    if (authPayload?.sub && authPayload?.email) {
                        // Validate organization is allowed
                        const userOrgId = authPayload.org_id
                        const isValidOrg = userOrgId && process.env.AUTH0_ORGANIZATION_ID?.split(',')?.includes(userOrgId)

                        if (!isValidOrg) {
                            console.warn(`[verifyAAIToken] User ${authPayload.email} from org '${userOrgId}' - not in allowed orgs`)
                            return res.status(401).json({ message: "Unauthorized: Organization doesn't match" })
                        }

                        // Check if org exists first (handles chicken-egg problem)
                        const orgRepo = AppDataSource.getRepository(Organization)
                        let org = await orgRepo.findOneBy({ auth0Id: userOrgId })

                        let user
                        if (org) {
                            // Org exists - create user with org
                            user = await findOrCreateUser(
                                AppDataSource,
                                authPayload.sub,
                                authPayload.email as string,
                                authPayload.name as string,
                                org.id
                            )
                        } else {
                            // Org doesn't exist - create user first, then org
                            user = await findOrCreateUser(
                                AppDataSource,
                                authPayload.sub,
                                authPayload.email as string,
                                authPayload.name as string
                            )
                            org = await findOrCreateOrganization(AppDataSource, userOrgId, authPayload.org_name, user.id)
                            await updateUserOrganization(AppDataSource, user.id, org.id)
                            user.organizationId = org.id
                        }

                        // Ensure user has workspaces (creates Default + Personal if needed)
                        await findOrCreateWorkspacesForUser(AppDataSource, user, org.id)

                        // Populate workspace data for Flowise 3.0.11 compatibility
                        const workspaceData = await populateWorkspaceData(AppDataSource, user, org.id)

                        // Extract roles from Auth0 token
                        const roles = (authPayload['https://theanswer.ai/roles'] || []) as string[]

                        // Set permissions based on roles
                        const permissions: string[] = []
                        if (roles?.includes('Admin')) {
                            permissions.push('org:manage')
                        }

                        // Set user on request (compatible with Flowise RBAC)
                        ;(req as any).user = {
                            ...authPayload,
                            ...user,
                            id: user.id,
                            email: user.email,
                            name: user.name,
                            auth0Id: authPayload.sub,
                            organizationId: org.id,
                            org_id: userOrgId,
                            org_name: authPayload.org_name,
                            roles,
                            permissions,
                            // Workspace fields (required by Flowise 3.0.11)
                            activeWorkspaceId: workspaceData.activeWorkspaceId,
                            activeOrganizationId: workspaceData.activeOrganizationId || org.id,
                            activeWorkspace: workspaceData.activeWorkspace,
                            roleId: workspaceData.roleId,
                            isOrganizationAdmin: workspaceData.isOrganizationAdmin || roles?.includes('Admin'),
                            assignedWorkspaces: workspaceData.assignedWorkspaces
                        }

                        
                        return next()
                    }
                } catch (error) {
                    console.error('[verifyAAIToken] Auth0 user sync error:', error)
                    // Fall through to try enterprise passport
                }
            }

            // STEP 2: Auth0 failed - try enterprise passport (HS256)
            // Import verifyToken lazily to avoid circular dependencies
            try {
                const { verifyToken } = await import('../../enterprise/middleware/passport')
                
                verifyToken(req, res, (passportErr?: any) => {
                    if (passportErr || !(req as any).user) {
                        // STEP 3: Both failed - return 401
                        console.warn('[verifyAAIToken] Both auth methods failed:', {
                            auth0Error: auth0Err?.message || 'Auth0 validation failed',
                            passportError: passportErr?.message || 'No user from passport'
                        })
                        return res.status(401).json({ message: 'Invalid or missing token' })
                    }
                    next()
                })
            } catch (importError) {
                // Enterprise passport not available - return 401
                console.warn('[verifyAAIToken] Enterprise passport not available:', importError)
                return res.status(401).json({ message: 'Invalid or missing token' })
            }
        })
    }
}

export default verifyAAIToken
