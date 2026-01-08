import { useSelector } from 'react-redux'
import { Box } from '@mui/material'
import OriginalItemCard from '@/ui-component/cards/ItemCard'
import { SharedBadge } from './SharedBadge'

/**
 * AAI-enhanced ItemCard with automatic shared badge overlay.
 * Drop-in replacement - just change import to '@/aai'.
 * ZERO changes to original component required.
 */
const ItemCard = (props) => {
    const activeWorkspaceId = useSelector((state) => state.auth?.user?.activeWorkspaceId)
    const isShared = props.data?.workspaceId && props.data.workspaceId !== activeWorkspaceId

    return (
        <Box sx={{ position: 'relative', height: '100%' }}>
            <OriginalItemCard {...props} />
            {isShared && (
                <Box sx={{ position: 'absolute', top: 12, right: 12, pointerEvents: 'none' }}>
                    <SharedBadge />
                </Box>
            )}
        </Box>
    )
}

export default ItemCard
