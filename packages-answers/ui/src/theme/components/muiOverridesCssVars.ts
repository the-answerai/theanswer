/**
 * Material-UI Component Overrides for CSS Variables Theme
 * Uses theme.vars instead of mode-based conditional styling
 * This enables instant theme switching without re-renders
 */

import { Components, Theme } from '@mui/material/styles'
import { createCommonOverrides, createNavigationOverrides, GlassStyleGetter } from './overridesCommon'

// Create glass getter that returns theme.vars.palette.glass
const createCssVarsGlassGetter = (theme: any): GlassStyleGetter => ({
    glassPrimary: theme.vars.palette.glass.glassPrimary,
    glassSecondary: theme.vars.palette.glass.glassSecondary,
    glassSubtle: theme.vars.palette.glass.glassSubtle,
    glassHover: theme.vars.palette.glass.glassHover,
    transition: theme.vars.palette.glass.transition
})

export const muiComponentOverridesForCssVars: Components<Omit<Theme, 'components'>> = {
    // Get common overrides from shared implementation (no mode, uses CSS vars)
    ...createCommonOverrides(
        // Glass getter uses theme callback
        () => ({} as GlassStyleGetter), // Placeholder, actual theme is passed in styleOverrides callback
        (path: string) => undefined, // Not used for CSS vars
        undefined // No mode for CSS vars
    ),

    // Get navigation-specific overrides (no mode for CSS vars)
    ...createNavigationOverrides(() => ({} as GlassStyleGetter), undefined),

    // ========================================================================
    // CSS VARS SPECIFIC OVERRIDES (theme.vars access, enhanced interactions)
    // ========================================================================

    // PAPER - CSS vars with elevation variants
    MuiPaper: {
        defaultProps: {
            elevation: 0
        },
        styleOverrides: {
            root: ({ theme }) => ({
                background: theme.vars.palette.glass.glassSecondary.background,
                backdropFilter: theme.vars.palette.glass.glassSecondary.backdropFilter,
                WebkitBackdropFilter: theme.vars.palette.glass.glassSecondary.WebkitBackdropFilter,
                border: theme.vars.palette.glass.glassSecondary.border,
                boxShadow: theme.vars.palette.glass.glassSecondary.boxShadow,
                backgroundImage: 'none',
                transition: theme.vars.palette.glass.transition
            }),
            elevation1: ({ theme }) => ({
                background: theme.vars.palette.glass.glassSecondary.background,
                backdropFilter: theme.vars.palette.glass.glassSecondary.backdropFilter,
                WebkitBackdropFilter: theme.vars.palette.glass.glassSecondary.WebkitBackdropFilter,
                border: theme.vars.palette.glass.glassSecondary.border,
                boxShadow: theme.vars.palette.glass.glassSecondary.boxShadow
            }),
            elevation2: ({ theme }) => ({
                background: theme.vars.palette.glass.glassSecondary.background,
                backdropFilter: theme.vars.palette.glass.glassSecondary.backdropFilter,
                WebkitBackdropFilter: theme.vars.palette.glass.glassSecondary.WebkitBackdropFilter,
                border: theme.vars.palette.glass.glassSecondary.border,
                boxShadow: '0 8px 24px 0 rgba(0, 0, 0, 0.12)'
            }),
            rounded: {
                borderRadius: 12
            }
        }
    },

    // CARD
    MuiCard: {
        styleOverrides: {
            root: ({ theme }) => ({
                background: theme.vars.palette.background.paper,
                border: `1px solid ${theme.vars.palette.divider}`,
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                borderRadius: 12,
                transition: theme.vars.palette.glass.transition,
                '&:hover': {
                    boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.15)',
                    transform: 'translateY(-2px)'
                }
            })
        }
    },

    // LIST ITEM BUTTON - CSS vars with enhanced interactions
    MuiListItemButton: {
        styleOverrides: {
            root: ({ theme }) => ({
                borderRadius: 8,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                overflow: 'hidden',
                position: 'relative',
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    pointerEvents: 'none',
                    zIndex: 1
                },
                '& .MuiListItemIcon-root, & .MuiListItemText-root': {
                    position: 'relative',
                    zIndex: 2
                },
                '&:hover': {
                    backgroundColor: theme.vars.palette.action.hover,
                    transform: 'translateX(4px)',
                    '&::before': {
                        left: '100%',
                        transition: 'left 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                    }
                },
                '&.Mui-selected': {
                    backgroundColor: theme.vars.palette.action.selected,
                    '&:hover': {
                        backgroundColor: theme.vars.palette.action.selected,
                        opacity: 0.8
                    }
                }
            })
        }
    },

    // BUTTONS
    MuiButton: {
        styleOverrides: {
            root: ({ theme }) => ({
                // Use CSS variables for dynamic theme support
                background: theme.vars.palette.glass.glassSubtle.background,
                backdropFilter: theme.vars.palette.glass.glassSubtle.backdropFilter,
                WebkitBackdropFilter: theme.vars.palette.glass.glassSubtle.WebkitBackdropFilter,
                border: theme.vars.palette.glass.glassSubtle.border,
                boxShadow: theme.vars.palette.glass.glassSubtle.boxShadow,
                transition: theme.vars.palette.glass.transition,
                textTransform: 'none',
                borderRadius: 8,
                color: theme.vars.palette.text.primary,
                '&:hover': {
                    background: theme.vars.palette.glass.glassHover.background,
                    boxShadow: theme.vars.palette.glass.glassHover.boxShadow,
                    transform: theme.vars.palette.glass.glassHover.transform
                },
                '&:active': {
                    transform: 'translateY(0px)',
                    boxShadow: '0 1px 4px 0 rgba(0, 0, 0, 0.1)',
                    ...theme.applyStyles('dark', {
                        boxShadow: '0 1px 4px 0 rgba(0, 0, 0, 0.3), inset 0 1px 0 0 rgba(255, 255, 255, 0.08)'
                    })
                },
                '&:focus-visible': {
                    boxShadow: `0 0 0 3px ${theme.vars.palette.primary.main}40`,
                    outline: '2px solid transparent',
                    outlineOffset: '2px',
                    transition: 'box-shadow 0.2s ease-in-out'
                },
                '&.Mui-disabled': {
                    backgroundColor: theme.vars.palette.action.disabled,
                    color: theme.vars.palette.text.disabled,
                    borderColor: 'transparent'
                }
            }),
            contained: ({ theme }) => ({
                // Primary buttons: strong visual presence with glassmorphism
                background: theme.vars.palette.glass.glassPrimary.background,
                backdropFilter: theme.vars.palette.glass.glassPrimary.backdropFilter,
                WebkitBackdropFilter: theme.vars.palette.glass.glassPrimary.WebkitBackdropFilter,
                border: theme.vars.palette.glass.glassPrimary.border,
                boxShadow: theme.vars.palette.glass.glassPrimary.boxShadow,
                color: '#ffffff',
                fontWeight: 600,
                '&:hover': {
                    background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.95) 0%, rgba(59, 130, 246, 0.92) 100%)',
                    boxShadow: '0 12px 40px 0 rgba(37, 99, 235, 0.3)',
                    transform: theme.vars.palette.glass.glassHover.transform,
                    ...theme.applyStyles('dark', {
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0.18) 100%)',
                        boxShadow: '0 8px 24px 0 rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.25)',
                        borderColor: 'rgba(255, 255, 255, 0.3)'
                    })
                },
                '&:active': {
                    transform: 'translateY(0px)',
                    boxShadow: '0 4px 16px 0 rgba(37, 99, 235, 0.2)',
                    ...theme.applyStyles('dark', {
                        boxShadow: '0 2px 8px 0 rgba(0, 0, 0, 0.4), inset 0 1px 0 0 rgba(255, 255, 255, 0.15)'
                    })
                },
                '&:focus-visible': {
                    boxShadow: `0 0 0 3px ${theme.vars.palette.primary.main}40`,
                    outline: '2px solid transparent',
                    outlineOffset: '2px',
                    transition: 'box-shadow 0.2s ease-in-out'
                },
                '&.Mui-disabled': {
                    backgroundColor: theme.vars.palette.action.disabled,
                    color: theme.vars.palette.text.disabled,
                    borderColor: 'transparent',
                    boxShadow: 'none'
                }
            }),
            outlined: ({ theme }) => ({
                // Outlined buttons: emphasis on border
                background: theme.vars.palette.glass.glassSubtle.background,
                backdropFilter: theme.vars.palette.glass.glassSubtle.backdropFilter,
                WebkitBackdropFilter: theme.vars.palette.glass.glassSubtle.WebkitBackdropFilter,
                border: '1.5px solid rgba(15, 23, 42, 0.25)',
                boxShadow: 'none',
                color: theme.vars.palette.text.primary,
                ...theme.applyStyles('dark', {
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.03) 100%)',
                    border: '1.5px solid rgba(255, 255, 255, 0.25)'
                }),
                '&:hover': {
                    background: theme.vars.palette.glass.glassHover.background,
                    borderColor: 'rgba(15, 23, 42, 0.35)',
                    boxShadow: theme.vars.palette.glass.glassHover.boxShadow,
                    transform: theme.vars.palette.glass.glassHover.transform,
                    ...theme.applyStyles('dark', {
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.08) 100%)',
                        borderColor: 'rgba(255, 255, 255, 0.35)',
                        boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.3)'
                    })
                },
                '&:active': {
                    transform: 'translateY(0px)'
                },
                '&:focus-visible': {
                    boxShadow: `0 0 0 3px ${theme.vars.palette.primary.main}40`,
                    outline: '2px solid transparent',
                    outlineOffset: '2px',
                    transition: 'box-shadow 0.2s ease-in-out'
                },
                '&.Mui-disabled': {
                    backgroundColor: 'transparent',
                    color: theme.vars.palette.text.disabled,
                    borderColor: theme.vars.palette.action.disabled
                }
            }),
            text: ({ theme }) => ({
                background: 'transparent',
                backdropFilter: 'none',
                WebkitBackdropFilter: 'none',
                border: 'none',
                boxShadow: 'none',
                color: theme.vars.palette.text.primary,
                '&:hover': {
                    backgroundColor: theme.vars.palette.action.hover
                },
                '&:active': {
                    backgroundColor: 'rgba(15, 23, 42, 0.08)',
                    ...theme.applyStyles('dark', {
                        backgroundColor: 'rgba(255, 255, 255, 0.05)'
                    })
                },
                '&:focus-visible': {
                    boxShadow: `0 0 0 3px ${theme.vars.palette.primary.main}40`,
                    outline: '2px solid transparent',
                    outlineOffset: '2px',
                    transition: 'box-shadow 0.2s ease-in-out'
                },
                '&.Mui-disabled': {
                    color: theme.vars.palette.text.disabled
                }
            })
        }
    },

    MuiIconButton: {
        styleOverrides: {
            root: ({ theme }) => ({
                transition: theme.vars.palette.glass.transition,
                color: theme.vars.palette.text.primary,
                '&:hover': {
                    backgroundColor: theme.vars.palette.action.hover,
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    ...theme.applyStyles('dark', {
                        backgroundColor: 'rgba(255, 255, 255, 0.08)'
                    })
                },
                '&:active': {
                    backgroundColor: 'rgba(15, 23, 42, 0.1)',
                    ...theme.applyStyles('dark', {
                        backgroundColor: 'rgba(255, 255, 255, 0.12)'
                    })
                },
                '&:focus-visible': {
                    boxShadow: `0 0 0 3px ${theme.vars.palette.primary.main}40`,
                    outline: '2px solid transparent',
                    outlineOffset: '2px',
                    transition: 'box-shadow 0.2s ease-in-out'
                },
                '&.Mui-disabled': {
                    color: theme.vars.palette.text.disabled,
                    opacity: 0.5
                }
            })
        }
    },

    // INPUTS & FORMS
    // REFINED: Use glass effects for inputs, enhanced focus states, better accessibility
    MuiTextField: {
        defaultProps: {
            variant: 'outlined'
        },
        styleOverrides: {
            root: ({ theme }) => ({
                '& .MuiOutlinedInput-root': {
                    background: theme.vars.palette.glass.glassSubtle.background,
                    backdropFilter: theme.vars.palette.glass.glassSubtle.backdropFilter,
                    WebkitBackdropFilter: theme.vars.palette.glass.glassSubtle.WebkitBackdropFilter,
                    transition: theme.vars.palette.glass.transition,
                    '&:hover': {
                        background: 'rgba(255, 255, 255, 0.8)',
                        boxShadow: '0 2px 8px 0 rgba(0, 0, 0, 0.08)'
                    },
                    '&.Mui-focused': {
                        background: 'rgba(255, 255, 255, 0.85)',
                        boxShadow: `0 0 0 3px ${theme.vars.palette.primary.main}40, 0 2px 8px 0 rgba(0, 0, 0, 0.1)`,
                        '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: theme.vars.palette.primary.main
                        }
                    },
                    '&:focus-visible': {
                        boxShadow: `0 0 0 3px ${theme.vars.palette.primary.main}40`,
                        outline: '2px solid transparent',
                        outlineOffset: '2px',
                        transition: 'box-shadow 0.2s ease-in-out'
                    },
                    '&.Mui-disabled': {
                        background: 'rgba(241, 245, 249, 0.7)',
                        opacity: 0.6
                    }
                }
            })
        }
    },

    MuiOutlinedInput: {
        styleOverrides: {
            root: ({ theme }) => ({
                background: theme.vars.palette.glass.glassSubtle.background,
                backdropFilter: theme.vars.palette.glass.glassSubtle.backdropFilter,
                WebkitBackdropFilter: theme.vars.palette.glass.glassSubtle.WebkitBackdropFilter,
                transition: theme.vars.palette.glass.transition,
                borderRadius: 8,
                '&:hover': {
                    background: 'rgba(255, 255, 255, 0.8)',
                    boxShadow: '0 2px 8px 0 rgba(0, 0, 0, 0.08)'
                },
                '&.Mui-focused': {
                    background: 'rgba(255, 255, 255, 0.85)',
                    boxShadow: `0 0 0 3px ${theme.vars.palette.primary.main}40, 0 2px 8px 0 rgba(0, 0, 0, 0.1)`
                },
                '&:focus-visible': {
                    boxShadow: `0 0 0 3px ${theme.vars.palette.primary.main}40`,
                    outline: '2px solid transparent',
                    outlineOffset: '2px',
                    transition: 'box-shadow 0.2s ease-in-out'
                },
                '&.Mui-disabled': {
                    background: 'rgba(241, 245, 249, 0.7)',
                    opacity: 0.6
                }
            }),
            notchedOutline: ({ theme }) => ({
                borderColor: theme.vars.palette.divider,
                transition: theme.vars.palette.glass.transition
            })
        }
    },

    // SELECT - CSS vars with enhanced focus states
    MuiSelect: {
        styleOverrides: {
            select: ({ theme }) => ({
                borderRadius: 8,
                background: theme.vars.palette.glass.glassSubtle.background,
                backdropFilter: theme.vars.palette.glass.glassSubtle.backdropFilter,
                WebkitBackdropFilter: theme.vars.palette.glass.glassSubtle.WebkitBackdropFilter,
                '&:focus': {
                    background: 'rgba(255, 255, 255, 0.85)',
                    boxShadow: `0 0 0 3px ${theme.vars.palette.primary.main}40, 0 2px 8px 0 rgba(0, 0, 0, 0.1)`
                },
                '&:focus-visible': {
                    boxShadow: `0 0 0 3px ${theme.vars.palette.primary.main}40`,
                    outline: '2px solid transparent',
                    outlineOffset: '2px',
                    transition: 'box-shadow 0.2s ease-in-out'
                }
            })
        }
    },

    // MENU - CSS vars with portal container
    MuiMenu: {
        defaultProps: {
            // Use custom portal container for all menus to prevent DOM manipulation errors
            container: typeof document !== 'undefined' ? () => document.getElementById('portal') || document.body : undefined
        },
        styleOverrides: {
            paper: ({ theme }) => ({
                background: theme.vars.palette.glass.glassSecondary.background,
                backdropFilter: theme.vars.palette.glass.glassSecondary.backdropFilter,
                WebkitBackdropFilter: theme.vars.palette.glass.glassSecondary.WebkitBackdropFilter,
                border: theme.vars.palette.glass.glassSecondary.border,
                boxShadow: theme.vars.palette.glass.glassSecondary.boxShadow,
                marginTop: '8px'
            }),
            list: {
                padding: '8px'
            }
        }
    },

    MuiMenuItem: {
        styleOverrides: {
            root: ({ theme }) => ({
                borderRadius: 6,
                margin: '2px 0',
                transition: theme.vars.palette.glass.transition,
                '&:hover': {
                    background: theme.vars.palette.glass.glassHover.background,
                    boxShadow: theme.vars.palette.glass.glassHover.boxShadow,
                    transform: theme.vars.palette.glass.glassHover.transform
                },
                '&.Mui-selected': {
                    backgroundColor: theme.vars.palette.action.selected,
                    '&:hover': {
                        backgroundColor: theme.vars.palette.action.selected,
                        opacity: 0.8
                    }
                }
            })
        }
    },

    // CHIP - CSS vars with glass effects
    MuiChip: {
        styleOverrides: {
            root: ({ theme }) => ({
                background: theme.vars.palette.glass.glassSubtle.background,
                backdropFilter: theme.vars.palette.glass.glassSubtle.backdropFilter,
                WebkitBackdropFilter: theme.vars.palette.glass.glassSubtle.WebkitBackdropFilter,
                border: theme.vars.palette.glass.glassSubtle.border,
                boxShadow: theme.vars.palette.glass.glassSubtle.boxShadow,
                transition: theme.vars.palette.glass.transition,
                '&:hover': {
                    background: theme.vars.palette.glass.glassHover.background,
                    boxShadow: theme.vars.palette.glass.glassHover.boxShadow,
                    transform: theme.vars.palette.glass.glassHover.transform
                }
            })
        }
    },

    // POPPER (used by Tooltip, Menu, etc.)
    MuiPopper: {
        defaultProps: {
            // Use custom portal container for all poppers to prevent DOM manipulation errors
            container: typeof document !== 'undefined' ? () => document.getElementById('portal') || document.body : undefined
        }
    },

    // TOOLTIP
    MuiTooltip: {
        defaultProps: {
            PopperProps: {
                // Use custom portal container for all tooltips to prevent DOM manipulation errors
                container: typeof document !== 'undefined' ? () => document.getElementById('portal') || document.body : undefined
            }
        },
        styleOverrides: {
            tooltip: ({ theme }) => ({
                background: theme.vars.palette.glass.glassSecondary.background,
                backdropFilter: theme.vars.palette.glass.glassSecondary.backdropFilter,
                WebkitBackdropFilter: theme.vars.palette.glass.glassSecondary.WebkitBackdropFilter,
                border: theme.vars.palette.glass.glassSecondary.border,
                boxShadow: theme.vars.palette.glass.glassSecondary.boxShadow,
                color: theme.vars.palette.text.primary,
                fontSize: '0.75rem',
                fontWeight: 500,
                padding: '10px 16px',
                maxWidth: '280px',
                minWidth: '200px',
                lineHeight: '1.4',
                textAlign: 'left',
                whiteSpace: 'normal',
                wordBreak: 'break-word'
            })
        }
    },

    // TABS
    MuiTabs: {
        styleOverrides: {
            root: ({ theme }) => ({
                background: theme.vars.palette.glass.glassSubtle.background,
                backdropFilter: theme.vars.palette.glass.glassSubtle.backdropFilter,
                WebkitBackdropFilter: theme.vars.palette.glass.glassSubtle.WebkitBackdropFilter,
                border: theme.vars.palette.glass.glassSubtle.border,
                boxShadow: theme.vars.palette.glass.glassSubtle.boxShadow,
                borderRadius: 8
            })
        }
    },

    MuiTab: {
        styleOverrides: {
            root: ({ theme }) => ({
                textTransform: 'none',
                transition: theme.vars.palette.glass.transition,
                '&:hover': {
                    background: theme.vars.palette.glass.glassHover.background,
                    boxShadow: theme.vars.palette.glass.glassHover.boxShadow,
                    transform: theme.vars.palette.glass.glassHover.transform
                },
                '&:focus-visible': {
                    boxShadow: `0 0 0 3px ${theme.vars.palette.primary.main}40`,
                    outline: '2px solid transparent',
                    outlineOffset: '2px',
                    transition: 'box-shadow 0.2s ease-in-out'
                }
            })
        }
    },

    // CHECKBOX
    MuiCheckbox: {
        styleOverrides: {
            root: ({ theme }) => ({
                transition: theme.vars.palette.glass.transition,
                '&:focus-visible': {
                    boxShadow: `0 0 0 3px ${theme.vars.palette.primary.main}40`,
                    outline: '2px solid transparent',
                    outlineOffset: '2px',
                    transition: 'box-shadow 0.2s ease-in-out',
                    borderRadius: '4px'
                }
            })
        }
    },

    // RADIO
    MuiRadio: {
        styleOverrides: {
            root: ({ theme }) => ({
                transition: theme.vars.palette.glass.transition,
                '&:focus-visible': {
                    boxShadow: `0 0 0 3px ${theme.vars.palette.primary.main}40`,
                    outline: '2px solid transparent',
                    outlineOffset: '2px',
                    transition: 'box-shadow 0.2s ease-in-out',
                    borderRadius: '50%'
                }
            })
        }
    },

    // SWITCH
    MuiSwitch: {
        styleOverrides: {
            root: ({ theme }) => ({
                transition: theme.vars.palette.glass.transition,
                '&:focus-visible': {
                    boxShadow: `0 0 0 3px ${theme.vars.palette.primary.main}40`,
                    outline: '2px solid transparent',
                    outlineOffset: '2px',
                    transition: 'box-shadow 0.2s ease-in-out',
                    borderRadius: '14px'
                }
            })
        }
    },

    // ALERT - CSS vars with glass effects
    MuiAlert: {
        styleOverrides: {
            root: ({ theme }) => ({
                background: theme.vars.palette.glass.glassSecondary.background,
                backdropFilter: theme.vars.palette.glass.glassSecondary.backdropFilter,
                WebkitBackdropFilter: theme.vars.palette.glass.glassSecondary.WebkitBackdropFilter,
                border: theme.vars.palette.glass.glassSecondary.border,
                borderRadius: 8
            })
        }
    },

    // ========================================================================
    // REACT FLOW - Global styles for React Flow canvas handles and edges
    // ========================================================================
    MuiCssBaseline: {
        styleOverrides: (theme) => ({
            // React Flow handle states (global styles, not component-specific)
            '.chatflow-canvas .react-flow__handle-connecting': {
                cursor: 'not-allowed',
                background: `${theme.vars.palette.error.main} !important`
            },
            '.chatflow-canvas .react-flow__handle-valid': {
                cursor: 'crosshair',
                background: `${theme.vars.palette.success.main} !important`
            }
        })
    }
} as Components<Omit<Theme, 'components'>>
