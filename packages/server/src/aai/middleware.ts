/**
 * AAI Middleware - Populates AsyncLocalStorage with workspace context.
 * IMPORTANT: Must run AFTER authentication middleware to access req.user.assignedWorkspaces
 */
import { Request, Response, NextFunction } from 'express'
import { requestContext, isMultiWorkspaceSharingEnabled, getSharedWorkspaceName, debugLog } from './context'

export const requestContextMiddleware = (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!isMultiWorkspaceSharingEnabled() || !req.user?.assignedWorkspaces) return next()

        const sharedWs = req.user.assignedWorkspaces.find((ws: { name: string }) => ws.name === getSharedWorkspaceName())
        const sharedId = sharedWs?.id
        const activeId = req.user.activeWorkspaceId

        if (!sharedWs) {
            debugLog(`Shared workspace "${getSharedWorkspaceName()}" not found for user`)
        }

        const workspaceIds =
            activeId && sharedId && activeId !== sharedId ? [activeId, sharedId] : ([activeId || sharedId].filter(Boolean) as string[])

        debugLog('Context setup', { activeId, sharedId, workspaceIds })
        requestContext.run({ workspaceIds }, () => next())
    } catch (error) {
        console.error('[AAI Middleware] Error setting up context:', error)
        next() // Continue without multi-workspace context rather than failing
    }
}
