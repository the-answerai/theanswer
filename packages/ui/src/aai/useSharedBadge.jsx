import { SharedBadge } from './SharedBadge'

export const getSharedBadge = (workspaceId, activeWorkspaceId) => {
    if (!workspaceId || !activeWorkspaceId) return null
    if (workspaceId === activeWorkspaceId) return null
    return <SharedBadge />
}
