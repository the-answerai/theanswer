/**
 * Common Component Overrides Shared Between Legacy and CSS Variables Themes
 * Extracts reusable component styling to eliminate duplication
 */

import { Components, Theme } from '@mui/material/styles'

/**
 * Interface for accessing glass tokens in a consistent way
 * Works with both legacy mode-based and CSS Variables themes
 */
export interface GlassStyleGetter {
    glassPrimary: any
    glassSecondary: any
    glassSubtle: any
    glassHover: any
    glassSuccess?: any
    glassWarning?: any
    glassError?: any
    transition: string
}

/**
 * Creates common component overrides shared between legacy and CSS Variables themes
 * @param glassGetter Function that returns glass tokens (called with theme in CSS vars)
 * @param getVar Optional function to get CSS variable (for CSS vars theme)
 * @param mode Optional theme mode (for legacy theme)
 */
export function createCommonOverrides(
    glassGetter: () => GlassStyleGetter,
    getVar?: (path: string) => any,
    mode?: 'light' | 'dark'
): Components<Omit<Theme, 'components'>> {
    // For CSS Variables theme, we use theme callback; for legacy, use glassGetter directly
    const isCssVars = !mode

    return {
        // ========================================================================
        // GLOBAL STYLES
        // ========================================================================
        MuiCssBaseline: {
            styleOverrides: (theme: any) => ({
                // Custom scrollbars for webkit browsers
                '*::-webkit-scrollbar': {
                    width: '8px',
                    height: '8px'
                },
                '*::-webkit-scrollbar-track': {
                    background: isCssVars
                        ? theme.vars?.palette?.background?.default
                        : mode === 'light'
                        ? 'rgba(241, 245, 249, 0.5)'
                        : 'rgba(255, 255, 255, 0.05)'
                },
                '*::-webkit-scrollbar-thumb': {
                    background: isCssVars
                        ? theme.vars?.palette?.divider
                        : mode === 'light'
                        ? 'rgba(148, 163, 184, 0.5)'
                        : 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '4px',
                    '&:hover': {
                        background: isCssVars
                            ? theme.vars?.palette?.action?.hover
                            : mode === 'light'
                            ? 'rgba(100, 116, 139, 0.7)'
                            : 'rgba(255, 255, 255, 0.3)'
                    }
                },
                // Smooth scrolling
                html: {
                    scrollBehavior: 'smooth'
                },
                // Better focus outlines for accessibility
                '*:focus-visible': {
                    outline: '2px solid',
                    outlineColor: isCssVars ? theme.vars?.palette?.primary?.main : mode === 'light' ? '#3b82f6' : '#4db6ac',
                    outlineOffset: '2px'
                }
            })
        },

        // ========================================================================
        // DIALOGS & MODALS
        // ========================================================================
        MuiDialog: {
            styleOverrides: {
                paper: (theme: any) => ({
                    background: isCssVars
                        ? theme.theme.vars?.palette?.glass?.glassSecondary?.background
                        : glassGetter().glassSecondary.background,
                    backdropFilter: isCssVars
                        ? theme.theme.vars?.palette?.glass?.glassSecondary?.backdropFilter
                        : glassGetter().glassSecondary.backdropFilter,
                    WebkitBackdropFilter: isCssVars
                        ? theme.theme.vars?.palette?.glass?.glassSecondary?.WebkitBackdropFilter
                        : glassGetter().glassSecondary.WebkitBackdropFilter,
                    border: isCssVars ? theme.theme.vars?.palette?.glass?.glassSecondary?.border : glassGetter().glassSecondary.border,
                    boxShadow: isCssVars
                        ? theme.theme.vars?.palette?.glass?.glassSecondary?.boxShadow
                        : glassGetter().glassSecondary.boxShadow,
                    borderRadius: 16,
                    transition: isCssVars ? theme.theme.vars?.palette?.glass?.transition : glassGetter().transition,
                    // Fallback for browsers that don't support backdrop-filter
                    '@supports not (backdrop-filter: blur(12px))': {
                        background: mode === 'light' ? 'rgba(255, 255, 255, 0.98)' : 'rgba(26, 26, 26, 0.98)',
                        backgroundColor: mode === 'light' ? 'rgba(255, 255, 255, 0.98)' : 'rgba(26, 26, 26, 0.98)'
                    }
                })
            }
        },

        MuiBackdrop: {
            styleOverrides: {
                root: (theme: any) => ({
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    backgroundColor: isCssVars
                        ? theme.theme.vars?.palette?.mode === 'light'
                            ? 'rgba(15, 23, 42, 0.5)'
                            : 'rgba(0, 0, 0, 0.7)'
                        : mode === 'light'
                        ? 'rgba(15, 23, 42, 0.5)'
                        : 'rgba(0, 0, 0, 0.7)',
                    // Fallback for browsers that don't support backdrop-filter
                    '@supports not (backdrop-filter: blur(8px))': {
                        backgroundColor: mode === 'light' ? 'rgba(15, 23, 42, 0.85)' : 'rgba(0, 0, 0, 0.9)'
                    }
                })
            }
        },

        // ========================================================================
        // LISTS
        // ========================================================================
        MuiList: {
            styleOverrides: {
                root: {
                    padding: '8px'
                }
            }
        },

        MuiListItem: {
            styleOverrides: {
                root: {
                    borderRadius: 8
                }
            }
        },

        // ========================================================================
        // DATA DISPLAY
        // ========================================================================
        MuiAvatar: {
            styleOverrides: {
                root: (theme: any) => ({
                    border: isCssVars
                        ? `2px solid ${theme.theme.vars?.palette?.divider}`
                        : mode === 'light'
                        ? '2px solid rgba(15, 23, 42, 0.1)'
                        : '2px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: isCssVars
                        ? '0 2px 8px 0 rgba(0, 0, 0, 0.1)'
                        : mode === 'light'
                        ? '0 2px 8px 0 rgba(0, 0, 0, 0.1)'
                        : '0 2px 8px 0 rgba(0, 0, 0, 0.3)'
                })
            }
        },

        // ========================================================================
        // ACCORDION
        // ========================================================================
        MuiAccordion: {
            styleOverrides: {
                root: (theme: any) => ({
                    background: isCssVars
                        ? theme.theme.vars?.palette?.glass?.glassSubtle?.background
                        : glassGetter().glassSubtle.background,
                    backdropFilter: isCssVars
                        ? theme.theme.vars?.palette?.glass?.glassSubtle?.backdropFilter
                        : glassGetter().glassSubtle.backdropFilter,
                    WebkitBackdropFilter: isCssVars
                        ? theme.theme.vars?.palette?.glass?.glassSubtle?.WebkitBackdropFilter
                        : glassGetter().glassSubtle.WebkitBackdropFilter,
                    border: isCssVars ? theme.theme.vars?.palette?.glass?.glassSubtle?.border : glassGetter().glassSubtle.border,
                    boxShadow: isCssVars ? theme.theme.vars?.palette?.glass?.glassSubtle?.boxShadow : glassGetter().glassSubtle.boxShadow,
                    borderRadius: '8px !important',
                    transition: isCssVars ? theme.theme.vars?.palette?.glass?.transition : glassGetter().transition,
                    '&:before': {
                        display: 'none'
                    },
                    '&.Mui-expanded': {
                        margin: '8px 0',
                        background: isCssVars
                            ? theme.theme.vars?.palette?.glass?.glassSecondary?.background
                            : glassGetter().glassSecondary.background,
                        boxShadow: isCssVars
                            ? theme.theme.vars?.palette?.glass?.glassSecondary?.boxShadow
                            : glassGetter().glassSecondary.boxShadow
                    }
                })
            }
        },

        MuiAccordionSummary: {
            styleOverrides: {
                root: (theme: any) => ({
                    borderRadius: 8,
                    transition: isCssVars ? theme.theme.vars?.palette?.glass?.transition : glassGetter().transition,
                    '&:hover': {
                        background: isCssVars
                            ? theme.theme.vars?.palette?.glass?.glassHover?.background
                            : glassGetter().glassHover.background,
                        boxShadow: isCssVars ? theme.theme.vars?.palette?.glass?.glassHover?.boxShadow : glassGetter().glassHover.boxShadow
                    }
                })
            }
        },

        // ========================================================================
        // DIVIDER
        // ========================================================================
        MuiDivider: {
            styleOverrides: {
                root: (theme: any) => ({
                    borderColor: isCssVars
                        ? theme.theme.vars?.palette?.divider
                        : mode === 'light'
                        ? 'rgba(15, 23, 42, 0.12)'
                        : 'rgba(255, 255, 255, 0.12)'
                })
            }
        }
    }
}

/**
 * Creates navigation-specific overrides (Drawer, AppBar)
 * These components have unique glassmorphism requirements and animations
 * @param glassGetter Function that returns glass tokens
 * @param mode Optional theme mode (for legacy theme)
 */
export function createNavigationOverrides(
    glassGetter: () => GlassStyleGetter,
    mode?: 'light' | 'dark'
): Components<Omit<Theme, 'components'>> {
    // For CSS Variables theme, mode is undefined; for legacy, it's defined
    const isCssVars = !mode

    return {
        // ========================================================================
        // DRAWER (Sidebar Navigation)
        // ========================================================================
        MuiDrawer: {
            styleOverrides: {
                paper: (theme: any) => {
                    // In CSS vars mode, check theme.palette.mode; in legacy, use mode parameter
                    const effectiveMode = isCssVars ? theme.theme.palette?.mode : mode

                    return {
                        background: isCssVars
                            ? theme.theme.vars?.palette?.glass?.glassPrimary?.background
                            : glassGetter().glassPrimary.background,
                        backdropFilter: isCssVars
                            ? theme.theme.vars?.palette?.glass?.glassPrimary?.backdropFilter
                            : glassGetter().glassPrimary.backdropFilter,
                        WebkitBackdropFilter: isCssVars
                            ? theme.theme.vars?.palette?.glass?.glassPrimary?.WebkitBackdropFilter
                            : glassGetter().glassPrimary.WebkitBackdropFilter,
                        border: isCssVars ? theme.theme.vars?.palette?.glass?.glassPrimary?.border : glassGetter().glassPrimary.border,
                        boxShadow: isCssVars
                            ? theme.theme.vars?.palette?.glass?.glassPrimary?.boxShadow
                            : glassGetter().glassPrimary.boxShadow,
                        transition: isCssVars ? theme.theme.vars?.palette?.glass?.transition : glassGetter().transition,
                        borderRight: 'none',
                        // Animated glassmorphism pulsing only in light mode
                        ...(effectiveMode === 'light' && {
                            '@keyframes glassPulse': {
                                '0%, 100%': {
                                    boxShadow:
                                        '0 8px 32px 0 rgba(0, 0, 0, 0.1), 0 2px 8px 0 rgba(59, 130, 246, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.3)'
                                },
                                '50%': {
                                    boxShadow:
                                        '0 12px 40px 0 rgba(0, 0, 0, 0.15), 0 4px 12px 0 rgba(59, 130, 246, 0.25), inset 0 1px 0 0 rgba(255, 255, 255, 0.4)'
                                }
                            },
                            animation: 'glassPulse 4s ease-in-out infinite'
                        })
                    }
                }
            }
        },

        // ========================================================================
        // APP BAR (Top Navigation)
        // ========================================================================
        MuiAppBar: {
            styleOverrides: {
                root: (theme: any) => ({
                    background: isCssVars
                        ? theme.theme.vars?.palette?.glass?.glassPrimary?.background
                        : glassGetter().glassPrimary.background,
                    backdropFilter: isCssVars
                        ? theme.theme.vars?.palette?.glass?.glassPrimary?.backdropFilter
                        : glassGetter().glassPrimary.backdropFilter,
                    WebkitBackdropFilter: isCssVars
                        ? theme.theme.vars?.palette?.glass?.glassPrimary?.WebkitBackdropFilter
                        : glassGetter().glassPrimary.WebkitBackdropFilter,
                    border: isCssVars ? theme.theme.vars?.palette?.glass?.glassPrimary?.border : glassGetter().glassPrimary.border,
                    boxShadow: isCssVars ? theme.theme.vars?.palette?.glass?.glassPrimary?.boxShadow : glassGetter().glassPrimary.boxShadow,
                    transition: isCssVars ? theme.theme.vars?.palette?.glass?.transition : glassGetter().transition
                })
            }
        },

        // ========================================================================
        // TOOLBAR (App Bar Content)
        // ========================================================================
        MuiToolbar: {
            styleOverrides: {
                root: {
                    minHeight: '64px',
                    '@media (min-width: 600px)': {
                        minHeight: '64px'
                    }
                }
            }
        }
    }
}
