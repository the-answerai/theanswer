/**
 * AAI Auth Me Route
 *
 * Dedicated route for /api/v1/auth/me endpoint that returns enriched user data.
 * This endpoint is whitelisted in constants.ts, so we handle JWT validation here.
 */
import express, { Request, Response } from 'express'
import { DataSource } from 'typeorm'
import { Organization } from '../../database/entities/Organization'
import { enrichUserWithAAIData } from '../auth/enrichUserData'
import { verifyAAIToken } from '../../middlewares/authentication/verifyAAIToken'

export const createAuthMeRouter = (AppDataSource: DataSource) => {
    const router = express.Router()

    /**
     * GET /api/v1/auth/me
     *
     * Returns enriched user data including:
     * - User profile (id, email, name)
     * - Organization context
     * - Workspace assignments
     * - Permissions and features
     *
     * Since /api/v1/auth/me is whitelisted, we apply verifyAAIToken middleware
     * directly to validate the JWT and populate req.user.
     */
    router.get('/me', verifyAAIToken(AppDataSource), async (req: Request, res: Response) => {
        console.log('[AAI auth/me] Request received')

        try {
            // req.user is now populated by verifyAAIToken middleware
            if (!req.user) {
                console.log('[AAI auth/me] No user on request')
                return res.status(401).json({ error: 'Unauthorized' })
            }

            const user = req.user as any
            console.log('[AAI auth/me] User found:', user.email)

            // Validate organization
            const userAuth0OrgId = user.org_id || user.auth0OrgId
            const allowedOrgs = process.env.AUTH0_ORGANIZATION_ID?.split(',') || []
            const isValidOrg = userAuth0OrgId && allowedOrgs.includes(userAuth0OrgId)

            if (!isValidOrg) {
                console.log('[AAI auth/me] Invalid organization:', userAuth0OrgId)
                return res.status(401).json({ error: 'Unauthorized: Invalid organization' })
            }

            // Get organization data
            const organization = await AppDataSource.getRepository(Organization).findOne({
                where: { id: user.organizationId }
            })

            if (!organization) {
                console.log('[AAI auth/me] Organization not found:', user.organizationId)
                return res.status(404).json({ error: 'Organization not found' })
            }

            // Enrich user data with AAI-specific fields
            const roles = user.roles || user['https://theanswer.ai/roles'] || []
            const enrichedUser = await enrichUserWithAAIData(AppDataSource, user, organization, roles)

            console.log('[AAI auth/me] Returning enriched user')

            return res.json({
                user: enrichedUser,
                organization: {
                    id: organization.id,
                    name: organization.name,
                    stripeCustomerId: organization.stripeCustomerId,
                    createdDate: organization.createdDate,
                    updatedDate: organization.updatedDate
                },
                session: {
                    authenticated: true,
                    authMethod: user.apiKeyId ? 'apikey' : 'jwt'
                }
            })
        } catch (error: any) {
            console.error('[AAI auth/me] Error:', error.message)
            return res.status(500).json({ error: 'Internal Server Error' })
        }
    })

    return router
}

export default createAuthMeRouter
