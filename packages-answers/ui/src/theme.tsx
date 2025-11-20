/**
 * Legacy theme export for backward compatibility
 * This file now uses the unified glassmorphism theme system
 * @deprecated - Use UnifiedThemeProvider from ./theme/index.tsx instead
 */

'use client'
import createTheme from '@mui/material/styles/createTheme'
import { theme as studioTheme } from '@/themes'
import { deepmerge } from '@mui/utils'
import { colorTokens } from './theme/tokens/colors'
import { glassmorphismTokens } from './theme/tokens/glassmorphism'
import { muiComponentOverrides } from './theme/components/muiOverrides'

declare module '@mui/material/Avatar' {
    interface AvatarPropsVariantOverrides {
        source: true
    }
}

declare module '@mui/material/styles' {
    interface BreakpointOverrides {
        xxl: true
    }
    interface Palette {
        glass: typeof glassmorphismTokens.light
        asyncSelect?: { main: string }
        card?: { main: string; light: string; hover: string }
        nodeToolTip?: { background: string; color: string }
    }
    interface PaletteOptions {
        glass?: typeof glassmorphismTokens.light
        asyncSelect?: { main: string }
        card?: { main: string; light: string; hover: string }
        nodeToolTip?: { background: string; color: string }
    }
}

// Get Flowise theme for backward compatibility
const studioThemeDark = studioTheme({ isDarkMode: true })
const { background, paper, ...studioPalette } = studioThemeDark.palette

// Helper to create theme for a specific mode
const createUnifiedTheme = (mode: 'light' | 'dark') => {
    const colors = colorTokens[mode]
    const glass = glassmorphismTokens[mode]

    return createTheme(
        deepmerge(
            {
                palette: {
                    mode,
                    primary: {
                        main: colors.primary.main,
                        light: colors.primary.light,
                        dark: colors.primary.dark
                    },
                    secondary: {
                        main: colors.secondary.main,
                        light: colors.secondary.light,
                        dark: colors.secondary.dark
                    },
                    background: {
                        default: colors.background.default,
                        paper: colors.background.paper
                    },
                    text: {
                        primary: colors.text.primary,
                        secondary: colors.text.secondary,
                        disabled: colors.text.disabled
                    },
                    divider: colors.divider,
                    glass: glass,
                    // Maintain Flowise compatibility
                    asyncSelect: studioPalette.asyncSelect,
                    card: studioPalette.card,
                    nodeToolTip: studioPalette.nodeToolTip
                },
                typography: {
                    fontFamily: 'var(--font-poppins), system-ui, -apple-system, sans-serif'
                },
                shape: {
                    borderRadius: 12
                },
                breakpoints: {
                    values: {
                        xs: 0,
                        sm: 600,
                        md: 900,
                        lg: 1200,
                        xl: 1536,
                        xxl: 1920
                    }
                },
                transitions: {
                    duration: {
                        standard: 300
                    },
                    easing: {
                        easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)'
                    }
                }
            },
            {
                components: {
                    ...muiComponentOverrides(mode),
                    // Preserve specific overrides
                    MuiTypography: {
                        styleOverrides: {
                            root: {
                                'ul, ol': {
                                    paddingLeft: '24px'
                                }
                            }
                        }
                    },
                    MuiContainer: {
                        defaultProps: { maxWidth: 'xxl' }
                    },
                    MuiAvatar: {
                        variants: [
                            {
                                props: { variant: 'source' },
                                style: { backgroundColor: 'white', img: { padding: 4, objectFit: 'contain' } }
                            }
                        ]
                    }
                }
            }
        )
    )
}

// Export dark mode theme as default (for backward compatibility)
export const darkModeTheme = createUnifiedTheme('dark')

// Also export light mode theme
export const lightModeTheme = createUnifiedTheme('light')

// Re-export CSS Variables theme provider and hooks
export { CssVarsThemeProvider, useThemeMode } from './theme/index'
