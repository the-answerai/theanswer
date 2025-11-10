/**
 * Material-UI Component Overrides with Glassmorphism
 * Applies unified glass styling to all MUI components
 */

import { Components, Theme } from '@mui/material/styles'
import { glassmorphismTokens } from '../tokens/glassmorphism'

export const muiComponentOverrides = (mode: 'light' | 'dark'): Components<Omit<Theme, 'components'>> => {
    const glass = glassmorphismTokens[mode]

    return {
        // Global CSS Baseline
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    scrollbarWidth: 'thin',
                    scrollbarColor: mode === 'light' ? 'rgba(15, 23, 42, 0.2) transparent' : 'rgba(255, 255, 255, 0.2) transparent',
                    '&::-webkit-scrollbar': {
                        width: '8px',
                        height: '8px'
                    },
                    '&::-webkit-scrollbar-track': {
                        background: 'transparent'
                    },
                    '&::-webkit-scrollbar-thumb': {
                        backgroundColor: mode === 'light' ? 'rgba(15, 23, 42, 0.2)' : 'rgba(255, 255, 255, 0.2)',
                        borderRadius: '20px',
                        border: '2px solid transparent',
                        backgroundClip: 'padding-box',
                        '&:hover': {
                            backgroundColor: mode === 'light' ? 'rgba(15, 23, 42, 0.3)' : 'rgba(255, 255, 255, 0.3)'
                        }
                    }
                },
                // Add pulsing gradient keyframes animation
                '@keyframes pulseGradient': {
                    '0%, 100%': {
                        backgroundPosition: '0% 50%'
                    },
                    '50%': {
                        backgroundPosition: '100% 50%'
                    }
                }
            }
        },

        // DRAWER (Navigation)
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    ...glass.glassPrimary,
                    borderRight: 'none',
                    transition: glass.transition,
                    // Add pulsing gradient animation in light mode
                    ...(mode === 'light' && {
                        backgroundSize: '200% 200%',
                        animation: 'pulseGradient 8s ease infinite',
                        position: 'relative',
                        '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'linear-gradient(180deg, transparent, rgba(255, 255, 255, 0.08), transparent)',
                            backgroundSize: '100% 200%',
                            animation: 'pulseGradient 6s ease infinite',
                            pointerEvents: 'none',
                            zIndex: 1
                        }
                    }),
                    // Keep icons white for better visibility
                    '& .MuiSvgIcon-root': {
                        color: '#ffffff',
                        position: 'relative',
                        zIndex: 2
                    },
                    '& .MuiListItemIcon-root': {
                        color: '#ffffff',
                        position: 'relative',
                        zIndex: 2
                    },
                    '& .MuiListItemButton-root': {
                        position: 'relative',
                        zIndex: 2,
                        color: '#ffffff'
                    },
                    '& .MuiListItemText-root': {
                        position: 'relative',
                        zIndex: 2,
                        color: '#ffffff',
                        '& .MuiTypography-root': {
                            color: '#ffffff'
                        }
                    }
                }
            }
        },

        // APP BAR (Header)
        MuiAppBar: {
            styleOverrides: {
                root: {
                    ...glass.glassPrimary,
                    boxShadow: 'none',
                    transition: glass.transition,
                    // Add pulsing gradient animation in light mode
                    ...(mode === 'light' && {
                        backgroundSize: '200% 200%',
                        animation: 'pulseGradient 8s ease infinite',
                        position: 'relative',
                        '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
                            backgroundSize: '200% 100%',
                            animation: 'pulseGradient 4s ease infinite',
                            pointerEvents: 'none'
                        }
                    })
                }
            }
        },

        // PAPER (Cards, Modals, Dialogs)
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

        // DIALOG
        MuiDialog: {
            styleOverrides: {
                paper: {
                    ...glass.glassSecondary,
                    backgroundImage: 'none',
                    transition: glass.transition
                }
            }
        },

        // CARD
        MuiCard: {
            styleOverrides: {
                root: {
                    ...glass.glassSecondary,
                    transition: glass.transition,
                    '&:hover': {
                        ...glass.glassHover
                    }
                }
            }
        },

        // LIST ITEMS
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
                    borderRadius: 8,
                    marginBottom: 4,
                    transition: glass.transition
                }
            }
        },

        MuiListItemButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    overflow: 'hidden',
                    position: 'relative',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: '-100%',
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        pointerEvents: 'none',
                        zIndex: 1
                    },
                    '& .MuiListItemIcon-root, & .MuiListItemText-root': {
                        position: 'relative',
                        zIndex: 2
                    },
                    '&:hover': {
                        backgroundColor: mode === 'light' ? 'rgba(59, 130, 246, 0.9)' : 'rgba(77, 182, 172, 0.15)',
                        transform: 'translateX(4px)',
                        '&::before': {
                            left: '100%',
                            transition: 'left 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                        }
                    },
                    '&.Mui-selected': {
                        backgroundColor: mode === 'light' ? 'rgba(59, 130, 246, 0.8)' : 'rgba(77, 182, 172, 0.12)',
                        '&:hover': {
                            backgroundColor: mode === 'light' ? 'rgba(59, 130, 246, 0.95)' : 'rgba(77, 182, 172, 0.18)'
                        }
                    }
                }
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
                    ...glass.glassPrimary,
                    color: '#ffffff',
                    '&:hover': {
                        ...glass.glassHover,
                        background:
                            mode === 'light'
                                ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)'
                                : 'rgba(0, 0, 0, 0.8)'
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

        // INPUTS & FORMS
        MuiTextField: {
            defaultProps: {
                variant: 'outlined'
            },
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        ...glass.glassSubtle,
                        transition: glass.transition,
                        '&:hover': {
                            ...glass.glassHover
                        },
                        '&.Mui-focused': {
                            ...glass.glassHover,
                            boxShadow: `0 0 0 3px ${mode === 'light' ? 'rgba(48, 114, 108, 0.1)' : 'rgba(77, 182, 172, 0.1)'}`
                        }
                    }
                }
            }
        },

        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    ...glass.glassSubtle,
                    transition: glass.transition,
                    borderRadius: 8,
                    '&:hover': {
                        ...glass.glassHover
                    },
                    '&.Mui-focused': {
                        ...glass.glassHover
                    }
                },
                notchedOutline: {
                    borderColor: mode === 'light' ? 'rgba(15, 23, 42, 0.23)' : 'rgba(255, 255, 255, 0.23)'
                }
            }
        },

        MuiInputBase: {
            styleOverrides: {
                root: {
                    transition: glass.transition
                },
                input: {
                    '&::placeholder': {
                        opacity: 0.7
                    }
                }
            }
        },

        // SELECT
        MuiSelect: {
            styleOverrides: {
                select: {
                    borderRadius: 8
                }
            }
        },

        // MENU
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

        // BACKDROP
        MuiBackdrop: {
            styleOverrides: {
                root: {
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    backgroundColor: mode === 'light' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.75)'
                }
            }
        },

        // CHIP
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

        // ACCORDION
        MuiAccordion: {
            styleOverrides: {
                root: {
                    ...glass.glassSecondary,
                    transition: glass.transition,
                    '&:before': {
                        display: 'none'
                    },
                    '&.Mui-expanded': {
                        margin: 0
                    }
                }
            }
        },

        // TOOLTIP
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

        // ALERT
        MuiAlert: {
            styleOverrides: {
                root: {
                    ...glass.glassSecondary,
                    borderRadius: 8
                }
            }
        }
    }
}
