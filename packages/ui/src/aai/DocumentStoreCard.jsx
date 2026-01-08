import { useSelector } from 'react-redux'
import { Box } from '@mui/material'
import OriginalDocumentStoreCard from '@/ui-component/cards/DocumentStoreCard'
import { SharedBadge } from './SharedBadge'

/**
 * AAI-enhanced DocumentStoreCard with automatic shared badge overlay.
 * Drop-in replacement - just change import to '@/aai'.
 * ZERO changes to original component required.
 */
const DocumentStoreCard = (props) => {
    const activeWorkspaceId = useSelector((state) => state.auth?.user?.activeWorkspaceId)
    const isShared = props.data?.workspaceId && props.data.workspaceId !== activeWorkspaceId

    return (
        <Box sx={{ position: 'relative', height: '100%' }}>
            <OriginalDocumentStoreCard {...props} />
            {isShared && (
                <Box sx={{ position: 'absolute', top: 12, right: 12, pointerEvents: 'none' }}>
                    <SharedBadge />
                </Box>
            )}
        </Box>
    )
}

export default DocumentStoreCard
