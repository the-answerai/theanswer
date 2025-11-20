import { styled } from '@mui/material/styles'
import { Fab } from '@mui/material'

export const StyledFab = styled(Fab)(({ theme, color = 'primary' }) => {
    // Support both CSS vars theme (packages-answers) and standard theme (packages/ui)
    const themeVars = theme.vars || theme

    // Get the color value with fallbacks
    const getColorValue = (colorName) => {
        // Handle undefined palette gracefully
        if (!themeVars.palette) {
            const defaultColors = {
                primary: '#1976d2',
                secondary: '#dc004e',
                error: '#f44336',
                warning: '#ff9800',
                info: '#2196f3',
                success: '#4caf50',
                teal: '#14b8a6'
            }
            return defaultColors[colorName] || defaultColors.primary
        }

        const colorMap = {
            primary: themeVars.palette.primary?.main || '#1976d2',
            secondary: themeVars.palette.secondary?.main || '#dc004e',
            error: themeVars.palette.error?.main || '#f44336',
            warning: themeVars.palette.warning?.main || '#ff9800',
            info: themeVars.palette.info?.main || '#2196f3',
            success: themeVars.palette.success?.main || '#4caf50',
            teal: themeVars.palette.teal?.main || '#14b8a6'
        }
        return colorMap[colorName] || colorMap.primary
    }

    const bgColor = getColorValue(color)

    return {
        color: 'white',
        backgroundColor: bgColor,
        '&:hover': {
            backgroundColor: bgColor,
            backgroundImage: `linear-gradient(rgb(0 0 0/10%) 0 0)`
        }
    }
})
