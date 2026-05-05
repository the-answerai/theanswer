/**
 * Material-UI Component Overrides with Glassmorphism
 * Applies unified glass styling to all MUI components
 */

import { Components, Theme } from '@mui/material/styles'
import { glassmorphismTokens } from '../tokens/glassmorphism'
import { colorTokens, statusColors } from '../tokens/colors'

export const muiComponentOverrides = (mode: 'light' | 'dark'): Components<Omit<Theme, 'components'>> => {
    const glass = glassmorphismTokens[mode]
    const colors = colorTokens[mode]
    // Heavier neutral border used for "selected" affordances (toggle buttons,
    // selected cards) so the chosen state reads unambiguously in both themes.
    const selectedBorder = mode === 'dark' ? 'rgba(255, 255, 255, 0.45)' : 'rgba(15, 23, 42, 0.5)'
    const selectedBorderHover = mode === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(15, 23, 42, 0.7)'

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
                    // Solid surfaces — no blur artifacts on nested scrollable content.
                    // glassSecondary in dark mode is 3% white = effectively black with no text color set.
                    backgroundImage: 'none',
                    backgroundColor: mode === 'light' ? '#ffffff' : '#1e1e1e',
                    border: `1px solid ${mode === 'light' ? 'rgba(15, 23, 42, 0.08)' : 'rgba(255, 255, 255, 0.08)'}`,
                    boxShadow: mode === 'light' ? '0 2px 12px 0 rgba(0,0,0,0.08)' : '0 2px 12px 0 rgba(0,0,0,0.4)',
                    color: colors.text.primary,
                    transition: glass.transition
                },
                elevation1: {
                    boxShadow: mode === 'light' ? '0 2px 8px 0 rgba(0,0,0,0.08)' : '0 2px 8px 0 rgba(0,0,0,0.4)'
                },
                elevation2: {
                    boxShadow: mode === 'light' ? '0 4px 16px 0 rgba(0,0,0,0.1)' : '0 4px 16px 0 rgba(0,0,0,0.5)'
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
                    backgroundImage: 'none',
                    backgroundColor: mode === 'light' ? '#ffffff' : '#1e1e1e',
                    border: `1px solid ${mode === 'light' ? 'rgba(15, 23, 42, 0.1)' : 'rgba(255, 255, 255, 0.1)'}`,
                    color: colors.text.primary,
                    transition: glass.transition
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
                }
            }
        },

        // BUTTONS
        MuiButton: {
            styleOverrides: {
                root: {
                    // Do NOT spread glassSubtle here — it adds backdropFilter blur to every button
                    // and the near-transparent background looks wrong on solid page surfaces.
                    // Keep only the transition and shape; variants handle their own surfaces.
                    transition: glass.transition,
                    textTransform: 'none',
                    borderRadius: 8,
                    backdropFilter: 'none',
                    WebkitBackdropFilter: 'none'
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
                    // The light-mode `contained` button uses a gradient via the
                    // `background` shorthand above. MUI's default disabled state
                    // only resets `backgroundColor`, so the gradient `background-image`
                    // bleeds through and the disabled button reads as fully active.
                    // Zero out `background` + `boxShadow` here so the disabled state
                    // is unambiguously inert in both themes.
                    '&.Mui-disabled': {
                        background: 'none',
                        backgroundColor: mode === 'light' ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)',
                        color: mode === 'light' ? 'rgba(0, 0, 0, 0.26)' : 'rgba(255, 255, 255, 0.3)',
                        boxShadow: 'none'
                    }
                },
                // Outlined buttons previously inherited `primary.main` for the
                // border + text color, which in dark mode resolves to translucent
                // white (rgba(255,255,255,0.12)) and renders the button as a
                // ghost. Anchor on `text.primary` + `divider` so outlined Edit /
                // Change / Recheck-style buttons read clearly in both themes.
                outlined: {
                    color: colors.text.primary,
                    borderColor: colors.divider,
                    background: 'transparent',
                    backdropFilter: 'none',
                    WebkitBackdropFilter: 'none',
                    '&:hover': {
                        borderColor: colors.text.primary,
                        backgroundColor: colors.action.hover
                    }
                },
                text: {
                    background: 'transparent',
                    backdropFilter: 'none',
                    WebkitBackdropFilter: 'none',
                    border: 'none',
                    boxShadow: 'none',
                    color: colors.text.primary,
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
                    // Solid surface — glassSecondary in dark = 3% white = near-black with blur.
                    backgroundImage: 'none',
                    backgroundColor: mode === 'light' ? '#ffffff' : '#252525',
                    border: `1px solid ${mode === 'light' ? 'rgba(15, 23, 42, 0.1)' : 'rgba(255, 255, 255, 0.1)'}`,
                    boxShadow: mode === 'light' ? '0 4px 20px rgba(0,0,0,0.12)' : '0 4px 20px rgba(0,0,0,0.5)',
                    color: colors.text.primary,
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
                    color: colors.text.primary,
                    transition: glass.transition,
                    '&:hover': {
                        // glassHover in light = rgba(255,255,255,0.95) = invisible on white paper
                        backgroundColor: colors.action.hover
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
        // Reduce blur — full blur(8px) on every modal/dropdown makes interaction jarring.
        // Use a lighter tint in light mode, stronger in dark.
        MuiBackdrop: {
            styleOverrides: {
                root: {
                    backdropFilter: 'none',
                    WebkitBackdropFilter: 'none',
                    backgroundColor: mode === 'light' ? 'rgba(0, 0, 0, 0.35)' : 'rgba(0, 0, 0, 0.65)',
                    // Invisible backdrop used for menus/selects — don't dim the page
                    '&.MuiModal-backdrop': {
                        backdropFilter: 'none',
                        WebkitBackdropFilter: 'none'
                    }
                }
            }
        },

        // CHIP
        MuiChip: {
            styleOverrides: {
                root: {
                    backdropFilter: 'none',
                    WebkitBackdropFilter: 'none',
                    transition: glass.transition,
                    // Only apply the custom base surface to chips that have NO explicit MUI
                    // color variant (default chips). Colored variants (primary, success, etc.)
                    // keep MUI's own palette-based bg so they work correctly everywhere.
                    '&:not([class*="MuiChip-color"])': {
                        background: mode === 'light' ? 'rgba(15, 23, 42, 0.05)' : 'rgba(255, 255, 255, 0.08)',
                        border: `1px solid ${mode === 'light' ? 'rgba(15, 23, 42, 0.18)' : 'rgba(255, 255, 255, 0.15)'}`,
                        color: colors.text.primary,
                        '& .MuiChip-label': {
                            color: colors.text.primary
                        },
                        '&:hover': {
                            background: mode === 'light' ? 'rgba(15, 23, 42, 0.1)' : 'rgba(255, 255, 255, 0.14)',
                            borderColor: mode === 'light' ? 'rgba(15, 23, 42, 0.35)' : 'rgba(255, 255, 255, 0.3)'
                        }
                    },
                    // Ensure labels on all colored chips remain white for contrast.
                    '&[class*="MuiChip-color"] .MuiChip-label': {
                        color: '#fff'
                    }
                }
            }
        },

        // ACCORDION
        MuiAccordion: {
            styleOverrides: {
                root: {
                    backgroundColor: mode === 'light' ? '#ffffff' : '#1e1e1e',
                    border: `1px solid ${mode === 'light' ? 'rgba(15, 23, 42, 0.08)' : 'rgba(255, 255, 255, 0.08)'}`,
                    boxShadow: 'none',
                    color: colors.text.primary,
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
                    fontSize: '0.75rem',
                    color: mode === 'light' ? '#1a1a1a' : '#ffffff'
                }
            }
        },

        // TABS
        MuiTabs: {
            styleOverrides: {
                root: {
                    // glassSubtle adds blur and near-white bg — replace with a clean transparent
                    // container so tabs sit naturally on whatever surface they're placed on.
                    backgroundColor: 'transparent',
                    backdropFilter: 'none',
                    WebkitBackdropFilter: 'none',
                    borderRadius: 8
                },
                indicator: {
                    backgroundColor: colors.text.primary,
                    height: 2
                }
            }
        },

        MuiTab: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    fontWeight: 500,
                    transition: glass.transition,
                    color: colors.text.secondary,
                    '&.Mui-selected': {
                        color: colors.text.primary,
                        fontWeight: 600
                    },
                    '&:hover': {
                        color: colors.text.primary,
                        ...glass.glassHover
                    }
                }
            }
        },

        // SWITCH
        // The default MUI Switch anchors its on-state on `palette.primary.main`.
        // In the AnswerAI dark theme `primary.main` is a deliberately-translucent
        // white (rgba(255, 255, 255, 0.12)) for the glass-button look, which
        // renders the on-state nearly invisible. Anchor the checked thumb +
        // track on `info.main` (Material Blue) so "on" reads unambiguously in
        // both light and dark mode.
        MuiSwitch: {
            styleOverrides: {
                switchBase: {
                    '&.Mui-checked': {
                        color: statusColors.info.main,
                        '& + .MuiSwitch-track': {
                            backgroundColor: statusColors.info.main,
                            opacity: 0.5
                        },
                        '&:hover': {
                            backgroundColor: 'rgba(33, 150, 243, 0.08)'
                        }
                    }
                }
            }
        },

        // SLIDER
        // Default Slider uses `primary.main` for rail/track/thumb — invisible
        // in dark mode for the same reason as Switch. Anchor on `text.primary`
        // (high contrast in both themes) and use `text.secondary` for marks.
        MuiSlider: {
            styleOverrides: {
                root: {
                    color: colors.text.primary
                },
                rail: {
                    opacity: 0.32
                },
                track: {
                    border: 'none'
                },
                thumb: {
                    boxShadow: 'none',
                    '&:hover, &.Mui-focusVisible': {
                        boxShadow: '0 0 0 6px rgba(127, 127, 127, 0.16)'
                    }
                },
                mark: {
                    backgroundColor: colors.text.secondary,
                    opacity: 0.6
                },
                markLabel: {
                    color: colors.text.secondary,
                    fontSize: 12
                }
            }
        },

        // TOGGLE BUTTON
        // Selected state on `action.selected` + `text.primary` border so the
        // chosen option reads clearly in both themes. Default MUI uses
        // `primary.main` for both bg + border, which in dark mode is the same
        // translucent white as the unselected hover — no contrast at all.
        MuiToggleButton: {
            styleOverrides: {
                root: {
                    color: colors.text.primary,
                    borderColor: colors.divider,
                    textTransform: 'none',
                    transition: 'background-color 120ms ease, border-color 120ms ease',
                    '&:hover': {
                        backgroundColor: colors.action.hover
                    },
                    '&.Mui-selected': {
                        backgroundColor: colors.action.selected,
                        color: colors.text.primary,
                        fontWeight: 600,
                        borderColor: selectedBorder,
                        '&:hover': {
                            backgroundColor: colors.action.selected,
                            borderColor: selectedBorderHover
                        }
                    }
                }
            }
        },

        // ALERT
        MuiAlert: {
            styleOverrides: {
                root: {
                    // glassSecondary has no text color — alerts need readable text in both modes.
                    borderRadius: 8,
                    color: colors.text.primary,
                    backgroundColor: mode === 'light' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(30, 30, 30, 0.95)',
                    border: `1px solid ${mode === 'light' ? 'rgba(15, 23, 42, 0.1)' : 'rgba(255, 255, 255, 0.08)'}`,
                    backdropFilter: 'none',
                    WebkitBackdropFilter: 'none'
                }
            }
        }
    }
}
