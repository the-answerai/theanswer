import { createTheme } from '@mui/material/styles'

// assets
import * as colors from '@/assets/theme-vars'

// project imports
import componentStyleOverrides from './compStyleOverride'
import themePalette from './palette'
import themeTypography from './typography'

// Hardcoded glassmorphism tokens (synced with packages-answers/ui/src/theme/tokens/glassmorphism.ts)
const glassmorphismTokens = {
    light: {
        glassPrimary: {
            background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.95) 0%, rgba(59, 130, 246, 0.9) 50%, rgba(30, 58, 138, 0.95) 100%)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid rgba(147, 197, 253, 0.5)',
            boxShadow: '0 8px 32px 0 rgba(59, 130, 246, 0.3), inset 0 1px 0 0 rgba(255, 255, 255, 0.3)',
            color: '#ffffff'
        },
        glassSecondary: {
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(15, 23, 42, 0.1)',
            boxShadow: '0 4px 16px 0 rgba(0, 0, 0, 0.08)'
        },
        glassSubtle: {
            background: 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(15, 23, 42, 0.15)',
            boxShadow: '0 2px 8px 0 rgba(0, 0, 0, 0.05)'
        },
        glassHover: {
            background: 'rgba(255, 255, 255, 0.95)',
            boxShadow: '0 12px 40px 0 rgba(0, 0, 0, 0.12)'
        },
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    },
    dark: {
        glassPrimary: {
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
            color: '#ffffff'
        },
        glassSecondary: {
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(16px) saturate(150%)',
            WebkitBackdropFilter: 'blur(16px) saturate(150%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 4px 16px 0 rgba(0, 0, 0, 0.3)'
        },
        glassSubtle: {
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(12px) saturate(120%)',
            WebkitBackdropFilter: 'blur(12px) saturate(120%)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 2px 8px 0 rgba(0, 0, 0, 0.2)'
        },
        glassHover: {
            background: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 8px 24px 0 rgba(0, 0, 0, 0.4)'
        },
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }
}

/**
 * Represent theme style and structure as per Material-UI
 * @param {JsonObject} customization customization parameter object
 */

export const theme = (customization) => {
    const color = colors
    const themeOption = customization.isDarkMode
        ? {
              colors: color,
              heading: color.paper,
              paper: color.darkPrimaryLight,
              backgroundDefault: color.darkPaper,
              background: color.darkPrimaryLight,
              darkTextPrimary: color.paper,
              darkTextSecondary: color.paper,
              textDark: color.paper,
              menuSelected: color.darkSecondaryDark,
              menuSelectedBack: color.darkSecondaryLight,
              divider: color.darkPaper,
              customization
          }
        : {
              colors: color,
              heading: color.grey900,
              paper: color.paper,
              backgroundDefault: color.paper,
              background: color.primaryLight,
              darkTextPrimary: color.grey700,
              darkTextSecondary: color.grey500,
              textDark: color.grey900,
              menuSelected: color.secondaryDark,
              menuSelectedBack: color.secondaryLight,
              divider: color.grey200,
              customization
          }

    const themeOptions = {
        direction: 'ltr',
        palette: {
            ...themePalette(themeOption),
            // Add unified glass tokens
            glass: glassmorphismTokens[customization.isDarkMode ? 'dark' : 'light']
        },
        mixins: {
            toolbar: {
                minHeight: '48px',
                padding: '16px',
                '@media (min-width: 600px)': {
                    minHeight: '48px'
                }
            }
        },
        typography: themeTypography(themeOption),
        transitions: {
            duration: {
                standard: 300
            },
            easing: {
                easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)'
            }
        }
    }

    const themes = createTheme(themeOptions)
    themes.components = componentStyleOverrides(themeOption)

    return themes
}

export default theme
