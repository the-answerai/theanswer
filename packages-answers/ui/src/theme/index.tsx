/**
 * Unified Theme System with Glassmorphism
 * Provides global theme with light/dark mode toggle
 */

'use client'
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles'
import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react'
import { glassmorphismTokens } from './tokens/glassmorphism'
import { colorTokens, statusColors } from './tokens/colors'
import { muiComponentOverrides } from './components/muiOverrides'
import { store } from 'flowise-ui/src/store'
import { SET_DARKMODE } from 'flowise-ui/src/store/actions'

// Extend MUI theme types
declare module '@mui/material/styles' {
    interface Palette {
        glass: typeof glassmorphismTokens.light
    }
    interface PaletteOptions {
        glass?: typeof glassmorphismTokens.light
    }
}

type ThemeMode = 'light' | 'dark'

interface ThemeContextType {
    mode: ThemeMode
    toggleMode: () => void
    setMode: (mode: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextType>({
    mode: 'dark',
    toggleMode: () => {},
    setMode: () => {}
})

export const useThemeMode = () => useContext(ThemeContext)

interface ThemeProviderProps {
    children: ReactNode
    initialMode?: ThemeMode
}

export const UnifiedThemeProvider = ({ children, initialMode }: ThemeProviderProps) => {
    const [mode, setModeState] = useState<ThemeMode>(initialMode || 'dark')

    // Read from Redux on mount
    useEffect(() => {
        const reduxMode = store.getState().customization.isDarkMode
        setModeState(reduxMode ? 'dark' : 'light')
    }, [])

    // Subscribe to Redux changes
    useEffect(() => {
        const unsubscribe = store.subscribe(() => {
            const reduxMode = store.getState().customization.isDarkMode
            const newMode = reduxMode ? 'dark' : 'light'
            if (newMode !== mode) {
                setModeState(newMode)
            }
        })
        return () => unsubscribe()
    }, [mode])

    const setMode = (newMode: ThemeMode) => {
        setModeState(newMode)
        localStorage.setItem('isDarkMode', newMode === 'dark' ? 'true' : 'false')

        // Dispatch to Redux store
        store.dispatch({ type: SET_DARKMODE, isDarkMode: newMode === 'dark' })
    }

    const toggleMode = () => {
        const newMode = mode === 'light' ? 'dark' : 'light'
        setMode(newMode)
    }

    const theme = useMemo(() => {
        const colors = colorTokens[mode]
        const glass = glassmorphismTokens[mode]

        return createTheme({
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
                action: {
                    hover: colors.action.hover,
                    selected: colors.action.selected,
                    disabled: colors.action.disabled
                },
                success: statusColors.success,
                warning: statusColors.warning,
                error: statusColors.error,
                info: statusColors.info,
                // Add glass tokens to palette
                glass: glass
            },
            typography: {
                fontFamily: 'var(--font-poppins), system-ui, -apple-system, sans-serif',
                h1: {
                    fontSize: '2.5rem',
                    fontWeight: 700,
                    lineHeight: 1.2
                },
                h2: {
                    fontSize: '2rem',
                    fontWeight: 700,
                    lineHeight: 1.3
                },
                h3: {
                    fontSize: '1.75rem',
                    fontWeight: 600,
                    lineHeight: 1.3
                },
                h4: {
                    fontSize: '1.5rem',
                    fontWeight: 600,
                    lineHeight: 1.4
                },
                h5: {
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    lineHeight: 1.4
                },
                h6: {
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    lineHeight: 1.4
                },
                body1: {
                    fontSize: '1rem',
                    lineHeight: 1.5
                },
                body2: {
                    fontSize: '0.875rem',
                    lineHeight: 1.5
                },
                button: {
                    textTransform: 'none'
                }
            },
            shape: {
                borderRadius: 12
            },
            transitions: {
                duration: {
                    shortest: 150,
                    shorter: 200,
                    short: 250,
                    standard: 300,
                    complex: 375,
                    enteringScreen: 225,
                    leavingScreen: 195
                },
                easing: {
                    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
                    easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
                    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
                    sharp: 'cubic-bezier(0.4, 0, 0.6, 1)'
                }
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
            components: muiComponentOverrides(mode)
        })
    }, [mode])

    return (
        <ThemeContext.Provider value={{ mode, toggleMode, setMode }}>
            <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>
        </ThemeContext.Provider>
    )
}

// Re-export for convenience
export { glassmorphismTokens, colorTokens, statusColors }
export { canvasNodeStyles } from './components/canvasStyles'
