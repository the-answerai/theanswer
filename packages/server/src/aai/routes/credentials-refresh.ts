import express, { Router, Request, Response, NextFunction } from 'express'
import { omit } from 'lodash'
import credentialsController from '../../controllers/credentials'
import credentialsService from '../../services/credentials'
import enforceAbility from '../../middlewares/authentication/enforceAbility'
import { checkPermission } from '../../enterprise/rbac/PermissionCheck'
import { getRunningExpressApp } from '../../utils/getRunningExpressApp'
import { Credential } from '../../database/entities/Credential'
import { WorkspaceShared } from '../../enterprise/database/entities/EnterpriseEntities'

/**
 * Creates AAI-specific credential routes
 *
 * These routes handle:
 * 1. Google OAuth and Atlassian token refresh
 * 2. Graceful handling of corrupted/malformed credentials (AGENT-583)
 *
 * They are mounted BEFORE the Flowise credentials router to intercept requests.
 *
 * This is TheAnswer-specific code that was accidentally removed during a Flowise upstream merge.
 * By keeping it in the aai/routes/ directory, we avoid merge conflicts on future upgrades.
 *
 * Routes:
 * - GET /credentials/:id - Get credential with graceful decryption error handling (AGENT-583)
 * - POST /credentials/refresh-token - Google OAuth refresh (used by GoogleDrivePicker, GmailLabelPicker)
 * - POST /credentials/refresh-atlassian-token - Atlassian OAuth refresh
 */
export function createCredentialsRefreshRouter(): Router {
    const router = express.Router()

    // Google OAuth refresh (used by GoogleDrivePicker, GmailLabelPicker)
    router.post(
        '/refresh-token',
        enforceAbility('Credential'),
        checkPermission('credentials:update'),
        credentialsController.updateAndRefreshToken
    )

    // Atlassian OAuth refresh
    router.post(
        '/refresh-atlassian-token',
        enforceAbility('Credential'),
        checkPermission('credentials:update'),
        credentialsController.updateAndRefreshAtlassianToken
    )

    // GET /credentials/:id - Handle decryption errors gracefully (AGENT-583)
    // When credentials have corrupted/malformed encrypted data, this route intercepts
    // the request and returns empty plainDataObj instead of a 500 error, allowing
    // users to edit and re-enter their credentials.
    // NOTE: Uses 'credentials:view' permission to match Flowise pattern
    router.get(
        '/:id',
        enforceAbility('Credential'),
        checkPermission('credentials:view'),
        async (req: Request, res: Response, next: NextFunction) => {
            try {
                const workspaceId = req.user?.activeWorkspaceId
                if (!workspaceId) {
                    return next() // Let Flowise handle missing workspace
                }

                // Normal flow - delegate to Flowise service
                const credential = await credentialsService.getCredentialById(req.params.id, workspaceId)
                return res.json(credential)
            } catch (error: any) {
                // Handle decryption errors gracefully - allow edit with empty data
                if (
                    error.message?.includes('Malformed UTF-8') ||
                    error.message?.includes('Failed to decrypt')
                ) {
                    console.error('Credential decryption failed, returning empty plainDataObj:', error.message)

                    try {
                        const workspaceId = req.user?.activeWorkspaceId
                        const appServer = getRunningExpressApp()

                        // Get credential metadata directly from DB (no decryption)
                        const credential = await appServer.AppDataSource.getRepository(Credential).findOneBy({
                            id: req.params.id,
                            workspaceId: workspaceId
                        })

                        if (!credential) {
                            return next() // Let Flowise handle not found
                        }

                        // Build response matching Flowise service format
                        const returnCredential = {
                            ...credential,
                            plainDataObj: {} // Empty - user can re-enter values
                        }
                        const dbResponse: any = omit(returnCredential, ['encryptedData'])

                        // Check if credential is shared (same as original service)
                        // Wrapped in try-catch in case WorkspaceShared table doesn't exist (non-enterprise)
                        if (workspaceId) {
                            try {
                                const shared = await appServer.AppDataSource.getRepository(WorkspaceShared).count({
                                    where: {
                                        workspaceId: workspaceId,
                                        sharedItemId: req.params.id,
                                        itemType: 'credential'
                                    }
                                })
                                if (shared > 0) {
                                    dbResponse.shared = true
                                }
                            } catch (sharedError) {
                                // WorkspaceShared might not exist in non-enterprise deployments
                                console.warn('Could not check shared status:', sharedError)
                            }
                        }

                        return res.json(dbResponse)
                    } catch (dbError) {
                        console.error('Failed to fetch credential metadata:', dbError)
                        return next(error)
                    }
                }
                next(error)
            }
        }
    )

    return router
}
