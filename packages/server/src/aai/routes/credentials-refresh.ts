import express, { Router } from 'express'
import credentialsController from '../../controllers/credentials'
import { checkPermission } from '../../enterprise/rbac/PermissionCheck'

/**
 * Creates AAI-specific credential refresh routes
 *
 * These routes handle Google OAuth and Atlassian token refresh.
 * They are mounted BEFORE the Flowise credentials router to intercept refresh requests.
 *
 * This is TheAnswer-specific code that was accidentally removed during a Flowise upstream merge.
 * By keeping it in the aai/routes/ directory, we avoid merge conflicts on future upgrades.
 *
 * Routes:
 * - POST /credentials/refresh-token - Google OAuth refresh (used by GoogleDrivePicker, GmailLabelPicker)
 * - POST /credentials/refresh-atlassian-token - Atlassian OAuth refresh
 */
export function createCredentialsRefreshRouter(): Router {
    const router = express.Router()

    // Google OAuth refresh (used by GoogleDrivePicker, GmailLabelPicker)
    router.post('/refresh-token', checkPermission('credentials:update'), credentialsController.updateAndRefreshToken)

    // Atlassian OAuth refresh
    router.post(
        '/refresh-atlassian-token',
        checkPermission('credentials:update'),
        credentialsController.updateAndRefreshAtlassianToken
    )

    return router
}
