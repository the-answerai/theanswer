import { useSelector } from 'react-redux'
import { SharedBadge } from './SharedBadge'

/**
 * Hook that returns a function to get shared badge for a resource.
 * Owns all Redux state access - views just call the returned function.
 *
 * Usage:
 *   const sharedBadge = useSharedBadge()
 *   <ItemCard ... badge={sharedBadge(data.workspaceId)} />
 */
export const useSharedBadge = () => {
    const activeWorkspaceId = useSelector((state) => state.auth?.user?.activeWorkspaceId)

    return (workspaceId) => {
        if (!workspaceId || !activeWorkspaceId) return null
        if (workspaceId === activeWorkspaceId) return null
        return <SharedBadge />
    }
}
