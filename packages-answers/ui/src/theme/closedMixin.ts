import type { Theme, CSSObject } from '@mui/material/styles'

interface ClosedMixinProps {
    theme: Theme
    spacing?: number
}

const closedMixin = ({ theme, spacing = 7 }: ClosedMixinProps): CSSObject => ({
    // REFINED: Apply glassPrimary theme styles
    background: theme.vars.palette.glass.glassPrimary.background,
    backdropFilter: theme.vars.palette.glass.glassPrimary.backdropFilter,
    WebkitBackdropFilter: theme.vars.palette.glass.glassPrimary.WebkitBackdropFilter,
    border: theme.vars.palette.glass.glassPrimary.border,
    boxShadow: theme.vars.palette.glass.glassPrimary.boxShadow,
    borderRight: 'none',
    // Layout styles
    transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen
    }),

    overflowX: 'hidden',
    width: `calc(${theme.spacing(spacing)} + 1px)`,

    [theme.breakpoints.up('sm')]: {
        width: `calc(${theme.spacing(spacing)} + 1px)`
    }
})

export default closedMixin
