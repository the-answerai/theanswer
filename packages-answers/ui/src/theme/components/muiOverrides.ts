/**
 * Material-UI Component Overrides with Glassmorphism (Legacy Mode-Based)
 * Applies unified glass styling to all MUI components using mode-based conditionals
 */

import { Components, Theme } from '@mui/material/styles'
import { glassmorphismTokens } from '../tokens/glassmorphism'
import { createCommonOverrides, createNavigationOverrides } from './overridesCommon'

export const muiComponentOverrides = (mode: 'light' | 'dark'): Components<Omit<Theme, 'components'>> => {
    const glass = glassmorphismTokens[mode]

    // Get common overrides from shared implementation
    const commonOverrides = createCommonOverrides(
        () => glass,
        (path: string) => {
            // Not used in legacy system, but required for function signature
            return undefined
        },
        mode
    )

    // Get navigation-specific overrides
    const navigationOverrides = createNavigationOverrides(() => glass, mode)

    // Merge common, navigation, and legacy-specific overrides
    return {
        ...commonOverrides,
        ...navigationOverrides,

        // ========================================================================
        // LEGACY-SPECIFIC OVERRIDES (mode-based with elevation variants)
        // ========================================================================

        // PAPER - Legacy elevation variants
        MuiPaper: {
            defaultProps: {
                elevation: 0
            },
            styleOverrides: {
                root: {
                    ...glass.glassSecondary,
                    backgroundImage: 'none',
                    transition: glass.transition
                },
                elevation1: {
                    ...glass.glassSecondary
                },
                elevation2: {
                    ...glass.glassSecondary,
                    boxShadow: '0 8px 24px 0 rgba(0, 0, 0, 0.12)'
                },
                rounded: {
                    borderRadius: 12
                }
            }
        },

        // CARD - Use solid backgrounds for better hierarchy
        MuiCard: {
            styleOverrides: {
                root: {
                    background: mode === 'light' ? '#ffffff' : '#1a1a1a',
                    border: `1px solid ${mode === 'light' ? 'rgba(15, 23, 42, 0.08)' : 'rgba(255, 255, 255, 0.08)'}`,
                    boxShadow: mode === 'light' ? '0 1px 3px 0 rgba(0, 0, 0, 0.1)' : '0 1px 3px 0 rgba(0, 0, 0, 0.3)',
                    borderRadius: 12,
                    transition: glass.transition,
                    '&:hover': {
                        boxShadow: mode === 'light' ? '0 4px 12px 0 rgba(0, 0, 0, 0.15)' : '0 4px 12px 0 rgba(0, 0, 0, 0.5)',
                        transform: 'translateY(-2px)'
                    }
                }
            }
        },

        // LIST ITEM BUTTON - Mode-specific hover and selected states with white text
        MuiListItemButton: {
            styleOverrides: {
                root: ({ theme }) => ({
                    borderRadius: 8,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    overflow: 'hidden',
                    position: 'relative',
                    color: theme.vars.palette.text.onGlass,
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
                        zIndex: 2,
                        color: 'inherit'
                    },
                    '&:hover': {
                        backgroundColor: mode === 'light' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(77, 182, 172, 0.15)',
                        transform: 'translateX(4px)',
                        '&::before': {
                            left: '100%',
                            transition: 'left 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                        }
                    },
                    '&.Mui-selected': {
                        backgroundColor: mode === 'light' ? 'rgba(59, 130, 246, 0.25)' : 'rgba(77, 182, 172, 0.12)',
                        '&:hover': {
                            backgroundColor: mode === 'light' ? 'rgba(59, 130, 246, 0.35)' : 'rgba(77, 182, 172, 0.18)'
                        }
                    }
                })
            }
        },

        // BUTTONS
        MuiButton: {
            styleOverrides: {
                root: {
                    ...glass.glassSubtle,
                    transition: glass.transition,
                    textTransform: 'none',
                    borderRadius: 8,
                    '&:hover': {
                        ...glass.glassHover
                    }
                },
                contained: {
                    // Use solid gradients in light mode for better contrast
                    ...(mode === 'light'
                        ? {
                              background: 'linear-gradient(135deg, rgb(30, 58, 138) 0%, rgb(59, 130, 246) 100%)',
                              border: 'none',
                              boxShadow: '0 4px 12px 0 rgba(59, 130, 246, 0.3)'
                          }
                        : glass.glassPrimary),
                    color: '#ffffff',
                    '&:hover': {
                        ...(mode === 'light'
                            ? {
                                  background: 'linear-gradient(135deg, rgb(15, 23, 42) 0%, rgb(30, 58, 138) 100%)',
                                  boxShadow: '0 6px 20px 0 rgba(59, 130, 246, 0.4)',
                                  transform: 'translateY(-2px)'
                              }
                            : {
                                  ...glass.glassHover,
                                  background: 'rgba(0, 0, 0, 0.8)'
                              })
                    },
                    '&.Mui-disabled': {
                        backgroundColor: mode === 'light' ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)',
                        color: mode === 'light' ? 'rgba(0, 0, 0, 0.26)' : 'rgba(255, 255, 255, 0.3)'
                    }
                },
                outlined: {
                    ...glass.glassSubtle,
                    '&:hover': {
                        ...glass.glassHover
                    }
                },
                text: {
                    background: 'transparent',
                    backdropFilter: 'none',
                    WebkitBackdropFilter: 'none',
                    border: 'none',
                    boxShadow: 'none',
                    '&:hover': {
                        backgroundColor: mode === 'light' ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.08)'
                    }
                }
            }
        },

        MuiIconButton: {
            styleOverrides: {
                root: {
                    transition: glass.transition,
                    '&:hover': {
                        backgroundColor: mode === 'light' ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.08)'
                    }
                }
            }
        },

        // INPUTS & FORMS - Simplified without glass for better hierarchy
        MuiTextField: {
            defaultProps: {
                variant: 'outlined'
            },
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        backgroundColor: mode === 'light' ? '#ffffff' : 'rgba(255, 255, 255, 0.05)',
                        transition: glass.transition,
                        '&:hover': {
                            backgroundColor: mode === 'light' ? '#fafafa' : 'rgba(255, 255, 255, 0.08)'
                        },
                        '&.Mui-focused': {
                            backgroundColor: mode === 'light' ? '#ffffff' : 'rgba(255, 255, 255, 0.08)',
                            boxShadow: `0 0 0 3px ${mode === 'light' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(77, 182, 172, 0.1)'}`
                        }
                    }
                }
            }
        },

        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    backgroundColor: mode === 'light' ? '#ffffff' : 'rgba(255, 255, 255, 0.05)',
                    transition: glass.transition,
                    borderRadius: 8,
                    '&:hover': {
                        backgroundColor: mode === 'light' ? '#fafafa' : 'rgba(255, 255, 255, 0.08)'
                    },
                    '&.Mui-focused': {
                        backgroundColor: mode === 'light' ? '#ffffff' : 'rgba(255, 255, 255, 0.08)'
                    }
                },
                notchedOutline: {
                    borderColor: mode === 'light' ? 'rgba(15, 23, 42, 0.23)' : 'rgba(255, 255, 255, 0.23)'
                }
            }
        },

        // MENU - Legacy with mode-specific glass
        MuiMenu: {
            styleOverrides: {
                paper: {
                    ...glass.glassSecondary,
                    marginTop: '8px'
                },
                list: {
                    padding: '8px'
                }
            }
        },

        MuiMenuItem: {
            styleOverrides: {
                root: {
                    borderRadius: 6,
                    margin: '2px 0',
                    transition: glass.transition,
                    '&:hover': {
                        ...glass.glassHover
                    },
                    '&.Mui-selected': {
                        backgroundColor: mode === 'light' ? 'rgba(48, 114, 108, 0.12)' : 'rgba(77, 182, 172, 0.12)',
                        '&:hover': {
                            backgroundColor: mode === 'light' ? 'rgba(48, 114, 108, 0.18)' : 'rgba(77, 182, 172, 0.18)'
                        }
                    }
                }
            }
        },

        // CHIP - Mode-specific glass
        MuiChip: {
            styleOverrides: {
                root: {
                    ...glass.glassSubtle,
                    transition: glass.transition,
                    '&:hover': {
                        ...glass.glassHover
                    }
                }
            }
        },

        // TOOLTIP - Mode-specific glass
        MuiTooltip: {
            styleOverrides: {
                tooltip: {
                    ...glass.glassSecondary,
                    fontSize: '0.75rem'
                }
            }
        },

        // TABS
        MuiTabs: {
            styleOverrides: {
                root: {
                    ...glass.glassSubtle,
                    borderRadius: 8
                }
            }
        },

        MuiTab: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    transition: glass.transition,
                    '&:hover': {
                        ...glass.glassHover
                    }
                }
            }
        },

        // ALERT - Mode-specific glass
        MuiAlert: {
            styleOverrides: {
                root: {
                    ...glass.glassSecondary,
                    borderRadius: 8
                }
            }
        }
    } as Components<Omit<Theme, 'components'>>
}
