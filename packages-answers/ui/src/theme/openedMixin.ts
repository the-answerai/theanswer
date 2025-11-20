import type { Theme, CSSObject } from '@mui/material/styles'

interface OpenedMixinProps {
    theme: Theme
    width?: number
    maxWidth?: number
}

const openedMixin = ({ theme, width = 200, maxWidth }: OpenedMixinProps): CSSObject => {
    const cssMaxWidth: number = maxWidth ?? width

    return {
        // REFINED: Apply glassPrimary theme styles
        background: theme.vars.palette.glass.glassPrimary.background,
        backdropFilter: theme.vars.palette.glass.glassPrimary.backdropFilter,
        WebkitBackdropFilter: theme.vars.palette.glass.glassPrimary.WebkitBackdropFilter,
        border: theme.vars.palette.glass.glassPrimary.border,
        boxShadow: theme.vars.palette.glass.glassPrimary.boxShadow,
        borderRight: 'none',
        // Layout styles
        width: width,
        maxWidth: cssMaxWidth,
        transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen
        }),
        overflowX: 'hidden'
    }
}

export default openedMixin
