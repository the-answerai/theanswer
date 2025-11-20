import { styled } from '@mui/material/styles'
import Tooltip, { tooltipClasses } from '@mui/material/Tooltip'

const NodeTooltip = styled(({ className, ...props }) => <Tooltip {...props} classes={{ popper: className }} />)(({ theme }) => {
    // Support both CSS Variables theme and standard theme for custom palettes
    const nodeToolTip = theme.vars?.palette?.nodeToolTip || theme.palette?.nodeToolTip || {}
    const background = nodeToolTip.background || 'rgba(0, 0, 0, 0.87)'
    const color = nodeToolTip.color || '#ffffff'

    return {
        [`& .${tooltipClasses.tooltip}`]: {
            backgroundColor: background,
            color: color,
            boxShadow: theme.shadows[1]
        }
    }
})

export default NodeTooltip
