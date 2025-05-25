import { createContext, useState, useContext, useMemo, useEffect, useCallback } from 'react'
import { ThemeProvider as MUIThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import PropTypes from 'prop-types'

// Create context
const ThemeContext = createContext({
    mode: 'light',
    toggleColorMode: () => {}
})

// Custom hook to use the theme context
export const useTheme = () => useContext(ThemeContext)

// Theme provider component
export const ThemeProvider = ({ children }) => {
    // Check if user has a theme preference stored
    const storedTheme = localStorage.getItem('themeMode')
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches

    // Initialize state with stored preference, system preference, or default to light
    const [mode, setMode] = useState(storedTheme || (prefersDarkMode ? 'dark' : 'light'))

    // Function to toggle between light and dark modes
    const toggleColorMode = useCallback(() => {
        setMode((prevMode) => {
            const newMode = prevMode === 'light' ? 'dark' : 'light'
            localStorage.setItem('themeMode', newMode)
            return newMode
        })
    }, [])

    // Create theme based on current mode
    const theme = useMemo(() => {
        return createTheme({
            palette: {
                mode,
                ...(mode === 'dark'
                    ? {
                          // Dark mode
                          primary: {
                              main: '#24C3A1'
                          },
                          background: {
                              default: '#000000',
                              paper: '#121212'
                          },
                          divider: '#24C3A1',
                          border: {
                              main: '#24C3A1'
                          }
                      }
                    : {
                          // Light mode
                          primary: {
                              main: '#1976d2'
                          },
                          background: {
                              default: '#f5f5f5',
                              paper: '#ffffff'
                          }
                      })
            },
            components: {
                MuiAppBar: {
                    styleOverrides: {
                        root: {
                            ...(mode === 'dark' && {
                                backgroundColor: '#000000',
                                borderBottom: '1px solid #24C3A1',
                                boxShadow: '0 0 10px #24C3A1'
                            })
                        }
                    }
                },
                MuiPaper: {
                    styleOverrides: {
                        root: {
                            ...(mode === 'dark' && {
                                border: '1px solid #24C3A1',
                                boxShadow: '0 0 5px #24C3A1'
                            })
                        }
                    }
                },
                MuiButton: {
                    styleOverrides: {
                        root: {
                            ...(mode === 'dark' && {
                                borderColor: '#24C3A1'
                            })
                        }
                    }
                }
            }
        })
    }, [mode])

    // Context value
    const contextValue = useMemo(() => {
        return { mode, toggleColorMode }
    }, [mode, toggleColorMode])

    // Listen for system preference changes
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
        const handleChange = () => {
            if (!localStorage.getItem('themeMode')) {
                setMode(mediaQuery.matches ? 'dark' : 'light')
            }
        }

        mediaQuery.addEventListener('change', handleChange)
        return () => mediaQuery.removeEventListener('change', handleChange)
    }, [])

    return (
        <ThemeContext.Provider value={contextValue}>
            <MUIThemeProvider theme={theme}>
                <CssBaseline />
                {children}
            </MUIThemeProvider>
        </ThemeContext.Provider>
    )
}

ThemeProvider.propTypes = {
    children: PropTypes.node.isRequired
}
