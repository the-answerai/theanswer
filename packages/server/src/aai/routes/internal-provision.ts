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
 * Authentication: Auth0 M2M JWT validated by verifyAAIToken (same RS256 flow).
 * The endpoint is whitelisted so the main auth middleware is bypassed,
 * and verifyAAIToken handles JWT validation + user sync directly.
 */
import express, { Request, Response } from 'express'
import { DataSource } from 'typeorm'
import { verifyAAIToken } from '../../middlewares/authentication/verifyAAIToken'
import { generateAPIKey, generateSecretHash } from '../../utils/apiKey'
import { ApiKey } from '../../database/entities/ApiKey'
import { v4 as uuidv4 } from 'uuid'

export const createInternalProvisionRouter = (AppDataSource: DataSource) => {
    const router = express.Router()

    /**
     * POST /api/v1/internal/provision-apikey
     *
     * Body: { auth0Id, email, name, orgId }
     *
     * verifyAAIToken handles:
     *   - JWT validation (Auth0 RS256)
     *   - org_id validation against AUTH0_ORGANIZATION_ID allowlist
     *   - findOrCreateUser + findOrCreateOrganization
     *   - findOrCreateWorkspacesForUser + populateWorkspaceData
     *   - Sets req.user with full workspace context
     *
     * This endpoint then:
     *   1. Checks for existing "AlphaAgent" API key in the workspace
     *   2. Creates a new API key (since hashed keys can't be recovered)
     *   3. Returns the plaintext key (only time it's visible)
     */
    router.post('/provision-apikey', verifyAAIToken(AppDataSource), async (req: Request, res: Response) => {
        console.log('[internal/provision-apikey] Request received')

        try {
            const user = req.user as any
            if (!user) {
                console.log('[internal/provision-apikey] No user on request after verifyAAIToken')
                return res.status(401).json({ error: 'Unauthorized' })
            }

            console.log('[internal/provision-apikey] User:', user.email, 'workspace:', user.activeWorkspaceId)

            const workspaceId = user.activeWorkspaceId
            const organizationId = user.activeOrganizationId || user.organizationId

            if (!workspaceId) {
                console.error('[internal/provision-apikey] No activeWorkspaceId for user', user.id)
                return res.status(500).json({ error: 'User has no active workspace' })
            }

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

            console.log('[internal/provision-apikey] Created API key for user', user.email)

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
