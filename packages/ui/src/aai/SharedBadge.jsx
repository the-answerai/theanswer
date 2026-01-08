import { Chip } from '@mui/material'
import ShareIcon from '@mui/icons-material/Share'

export const SharedBadge = () => (
    <Chip
        icon={<ShareIcon sx={{ fontSize: 14 }} />}
        label="Shared"
        size="small"
        variant="outlined"
        sx={{ ml: 1 }}
    />
)
