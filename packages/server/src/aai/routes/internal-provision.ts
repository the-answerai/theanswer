/* eslint-disable no-console */
/**
 * Internal Provisioning Route
 *
 * POST /api/v1/internal/provision-apikey
 *
 * Called by Alpha Agent's management Lambda (via M2M token) to provision
 * an AnswerAI API key for a user. Creates user, org, workspaces, and
 * API key in one shot.
 *
 * Authentication: Auth0 RS256 JWT signature validation only (M2M tokens
 * don't carry user claims like email/org_id). User details come from
 * the request body.
 */
import express, { Request, Response } from 'express'
import { DataSource } from 'typeorm'
import { auth } from 'express-oauth2-jwt-bearer'
import { findOrCreateUser, updateUserOrganization } from '../../middlewares/authentication/findOrCreateUser'
import { findOrCreateOrganization } from '../../middlewares/authentication/findOrCreateOrganization'
import { findOrCreateWorkspacesForUser } from '../../middlewares/authentication/findOrCreateWorkspacesForUser'
import { populateWorkspaceData } from '../../middlewares/authentication/populateWorkspaceData'
import { Organization } from '../../database/entities/Organization'
import { generateAPIKey, generateSecretHash } from '../../utils/apiKey'
import { ApiKey } from '../../database/entities/ApiKey'
import { v4 as uuidv4 } from 'uuid'

// Auth0 RS256 JWT checker — validates signature only, no user claims required.
// M2M tokens have `sub` (client ID) and `aud` but not `email`/`org_id`.
const jwtCheck = auth({
    authRequired: true,
    audience: process.env.AUTH0_AUDIENCE,
    issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
    tokenSigningAlg: process.env.AUTH0_TOKEN_SIGN_ALG ?? 'RS256'
})

export const createInternalProvisionRouter = (AppDataSource: DataSource) => {
    const router = express.Router()

    /**
     * POST /api/v1/internal/provision-apikey
     *
     * Body: { auth0Id, email, name, orgId }
     *
     * Flow:
     *   1. Validate Auth0 JWT signature (M2M or user token)
     *   2. Validate orgId from request body against AUTH0_ORGANIZATION_ID allowlist
     *   3. findOrCreateOrganization + findOrCreateUser + workspaces
     *   4. Create a new "AlphaAgent" API key (deletes existing one first)
     *   5. Return plaintext key (only time it's visible)
     */
    router.post('/provision-apikey', (req, res, next) => {
        jwtCheck(req, res, (err?: any) => {
            if (err) {
                console.warn('[internal/provision-apikey] JWT validation failed:', err.message)
                return res.status(401).json({ error: 'Unauthorized: Invalid token' })
            }
            next()
        })
    }, async (req: Request, res: Response) => {
        console.log('[internal/provision-apikey] Request received')

        try {
            // Extract user details from request body (M2M tokens don't carry these)
            const { auth0Id, email, name, orgId } = req.body || {}

            if (!auth0Id || !email || !orgId) {
                return res.status(400).json({
                    error: 'Missing required fields: auth0Id, email, orgId'
                })
            }

            // Validate orgId against allowlist
            const allowedOrgs = process.env.AUTH0_ORGANIZATION_ID?.split(',') || []
            if (!allowedOrgs.includes(orgId)) {
                console.warn(`[internal/provision-apikey] org '${orgId}' not in allowlist`)
                return res.status(401).json({ error: 'Unauthorized: Invalid organization' })
            }

            // Find or create org
            const orgRepo = AppDataSource.getRepository(Organization)
            let org = await orgRepo.findOneBy({ auth0Id: orgId })
            let user

            if (org) {
                user = await findOrCreateUser(AppDataSource, auth0Id, email, name || email, org.id)
            } else {
                user = await findOrCreateUser(AppDataSource, auth0Id, email, name || email)
                org = await findOrCreateOrganization(AppDataSource, orgId, name || email, user.id)
                await updateUserOrganization(AppDataSource, user.id, org.id)
                user.organizationId = org.id
            }

            // Ensure workspaces exist
            await findOrCreateWorkspacesForUser(AppDataSource, user, org.id)

            // Get active workspace
            const workspaceData = await populateWorkspaceData(AppDataSource, user, org.id)
            const workspaceId = workspaceData.activeWorkspaceId
            const organizationId = workspaceData.activeOrganizationId || org.id

            if (!workspaceId) {
                console.error('[internal/provision-apikey] No activeWorkspaceId for user', user.id)
                return res.status(500).json({ error: 'User has no active workspace' })
            }

            console.log('[internal/provision-apikey] User:', email, 'workspace:', workspaceId)

            // Delete any existing "AlphaAgent" key in this workspace
            // (old keys can't be recovered since apiSecret is hashed)
            const apiKeyRepo = AppDataSource.getRepository(ApiKey)
            const existingKeys = await apiKeyRepo.find({
                where: { keyName: 'AlphaAgent', workspaceId }
            })
            if (existingKeys.length > 0) {
                console.log(`[internal/provision-apikey] Removing ${existingKeys.length} existing AlphaAgent key(s)`)
                for (const key of existingKeys) {
                    await apiKeyRepo.delete({ id: key.id })
                }
            }

            // Generate new API key
            const apiKey = generateAPIKey()
            const apiSecret = generateSecretHash(apiKey)

            const newKey = new ApiKey()
            newKey.id = uuidv4()
            newKey.apiKey = apiKey
            newKey.apiSecret = apiSecret
            newKey.keyName = 'AlphaAgent'
            newKey.workspaceId = workspaceId
            newKey.organizationId = organizationId
            newKey.userId = user.id

            const keyEntity = apiKeyRepo.create(newKey)
            await apiKeyRepo.save(keyEntity)

            console.log('[internal/provision-apikey] Created API key for user', email)

            return res.json({
                apiKey,
                userId: user.id,
                workspaceId
            })
        } catch (error: any) {
            console.error('[internal/provision-apikey] Error:', error.message)
            return res.status(500).json({ error: 'Internal Server Error' })
        }
    })

    return router
}

export default createInternalProvisionRouter
