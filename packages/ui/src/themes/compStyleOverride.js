export default function componentStyleOverrides(theme) {
    const bgColor = theme.colors?.grey50
    return {
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    // scrollbarWidth: 'thin',
                    // scrollbarColor: theme?.customization?.isDarkMode
                    //     ? `${theme.colors?.grey500} ${theme.colors?.darkPrimaryMain}`
                    //     : `${theme.colors?.grey300} ${theme.paper}`
                    // '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
                    //     width: 12,
                    //     height: 12,
                    //     backgroundColor: theme?.customization?.isDarkMode ? theme.colors?.darkPrimaryMain : theme.paper
                    // },
                    // '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
                    //     borderRadius: 8,
                    //     backgroundColor: theme?.customization?.isDarkMode ? theme.colors?.grey500 : theme.colors?.grey300,
                    //     minHeight: 24,
                    //     border: `3px solid ${theme?.customization?.isDarkMode ? theme.colors?.darkPrimaryMain : theme.paper}`
                    // },
                    // '&::-webkit-scrollbar-thumb:focus, & *::-webkit-scrollbar-thumb:focus': {
                    //     backgroundColor: theme?.customization?.isDarkMode ? theme.colors?.darkPrimary200 : theme.colors?.grey500
                    // },
                    // '&::-webkit-scrollbar-thumb:active, & *::-webkit-scrollbar-thumb:active': {
                    //     backgroundColor: theme?.customization?.isDarkMode ? theme.colors?.darkPrimary200 : theme.colors?.grey500
                    // },
                    // '&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover': {
                    //     backgroundColor: theme?.customization?.isDarkMode ? theme.colors?.darkPrimary200 : theme.colors?.grey500
                    // },
                    // '&::-webkit-scrollbar-corner, & *::-webkit-scrollbar-corner': {
                    //     backgroundColor: theme?.customization?.isDarkMode ? theme.colors?.darkPrimaryMain : theme.paper
                    // }
                }
            }
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    fontWeight: 500,
                    borderRadius: '4px'
                }
            }
        },
        MuiSvgIcon: {
            styleOverrides: {
                root: {
                    color: theme?.customization?.isDarkMode ? theme.colors?.paper : 'inherit',
                    background: theme?.customization?.isDarkMode ? theme.colors?.darkPrimaryLight : 'inherit'
                }
            }
        },
        MuiPaper: {
            defaultProps: {
                elevation: 0
            },
            styleOverrides: {
                root: {
                    backgroundImage: 'none'
                },
                rounded: {
                    borderRadius: `${theme?.customization?.borderRadius}px`
                }
            }
        },
        MuiCardHeader: {
            styleOverrides: {
                root: {
                    color: theme.colors?.textDark,
                    padding: '24px'
                },
                title: {
                    fontSize: '1.125rem'
                }
            }
        },
        MuiCardContent: {
            styleOverrides: {
                root: {
                    padding: '24px'
                }
            }
        },
        MuiCardActions: {
            styleOverrides: {
                root: {
                    padding: '24px'
                }
            }
        },
        MuiListItemButton: {
            styleOverrides: {
                root: {
                    color: theme.darkTextPrimary,
                    paddingTop: '10px',
                    paddingBottom: '10px',
                    '&.Mui-selected': {
                        color: theme.menuSelected,
                        backgroundColor: theme.menuSelectedBack,
                        '&:hover': {
                            backgroundColor: theme.menuSelectedBack
                        },
                        '& .MuiListItemIcon-root': {
                            color: theme.menuSelected
                        }
                    },
                    '&:hover': {
                        backgroundColor: theme.menuSelectedBack,
                        color: theme.menuSelected,
                        '& .MuiListItemIcon-root': {
                            color: theme.menuSelected
                        }
                    }
                }
            }
        },
        MuiListItemIcon: {
            styleOverrides: {
                root: {
                    color: theme.darkTextPrimary,
                    minWidth: '36px'
                }
            }
        },
        MuiListItemText: {
            styleOverrides: {
                primary: {
                    color: theme.textDark
                }
            }
        },
        MuiInputBase: {
            styleOverrides: {
                input: {
                    color: theme.textDark,
                    '&::placeholder': {
                        color: theme.darkTextSecondary,
                        fontSize: '0.875rem'
                    },
                    '&.Mui-disabled': {
                        WebkitTextFillColor: theme?.customization?.isDarkMode ? theme.colors?.grey500 : theme.darkTextSecondary
                    }
                }
            }
        },
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    background: theme?.customization?.isDarkMode ? theme.colors?.darkPrimary800 : bgColor,
                    borderRadius: `${theme?.customization?.borderRadius}px`,
                    '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.colors?.grey400
                    },
                    '&:hover $notchedOutline': {
                        borderColor: theme.colors?.primaryLight
                    },
                    '&.MuiInputBase-multiline': {
                        padding: 1
                    }
                },
                input: {
                    fontWeight: 500,
                    background: theme?.customization?.isDarkMode ? theme.colors?.darkPrimary800 : bgColor,
                    padding: '15.5px 14px',
                    borderRadius: `${theme?.customization?.borderRadius}px`,
                    '&.MuiInputBase-inputSizeSmall': {
                        padding: '10px 14px',
                        '&.MuiInputBase-inputAdornedStart': {
                            paddingLeft: 0
                        }
                    }
                },
                inputAdornedStart: {
                    paddingLeft: 4
                },
                notchedOutline: {
                    borderRadius: `${theme?.customization?.borderRadius}px`
                }
            }
        },
        // SLIDER
        // Anchor on `text.primary` so rail/track/thumb stay visible regardless
        // of mode. Mirrors the unified theme override for consistency between
        // TheAnswer pages and Flowise core canvas/dialogs.
        MuiSlider: {
            styleOverrides: {
                root: {
                    color: theme.darkTextPrimary,
                    '&.Mui-disabled': {
                        color: theme.colors?.grey300
                    }
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
                    backgroundColor: theme.darkTextSecondary,
                    opacity: 0.6,
                    width: '4px'
                },
                markLabel: {
                    color: theme.darkTextSecondary,
                    fontSize: 12
                },
                valueLabel: {
                    color: theme?.colors?.primaryLight
                }
            }
        },
        // SWITCH
        // Anchor checked state on Material Blue (`#2196f3`) so the on-state
        // reads unambiguously across both Flowise core themes. Matches the
        // unified TheAnswer theme — switches in ChatflowGuardrails / ShareChatbot
        // / canvas dialogs visually align with switches in the rest of the app.
        MuiSwitch: {
            styleOverrides: {
                switchBase: {
                    '&.Mui-checked': {
                        color: '#2196f3',
                        '& + .MuiSwitch-track': {
                            backgroundColor: '#2196f3',
                            opacity: 0.5
                        },
                        '&:hover': {
                            backgroundColor: 'rgba(33, 150, 243, 0.08)'
                        }
                    }
                }
            }
        },
        // TOGGLE BUTTON
        // Selected state on a translucent neutral overlay + heavier border so
        // the chosen option is unmistakable in both themes.
        MuiToggleButton: {
            styleOverrides: {
                root: {
                    color: theme.darkTextPrimary,
                    borderColor: theme.divider,
                    textTransform: 'none',
                    transition: 'background-color 120ms ease, border-color 120ms ease',
                    '&:hover': {
                        backgroundColor: theme?.customization?.isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.04)'
                    },
                    '&.Mui-selected': {
                        backgroundColor: theme?.customization?.isDarkMode ? 'rgba(255, 255, 255, 0.16)' : 'rgba(15, 23, 42, 0.08)',
                        color: theme.darkTextPrimary,
                        fontWeight: 600,
                        borderColor: theme?.customization?.isDarkMode ? 'rgba(255, 255, 255, 0.45)' : 'rgba(15, 23, 42, 0.5)',
                        '&:hover': {
                            backgroundColor: theme?.customization?.isDarkMode ? 'rgba(255, 255, 255, 0.16)' : 'rgba(15, 23, 42, 0.08)',
                            borderColor: theme?.customization?.isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(15, 23, 42, 0.7)'
                        }
                    }
                }
            }
        },
        MuiDivider: {
            styleOverrides: {
                root: {
                    borderColor: theme.divider,
                    opacity: 1
                }
            }
        },
        MuiAvatar: {
            styleOverrides: {
                root: {
                    color: theme.colors?.primaryDark,
                    background: theme.colors?.primary200
                }
            }
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    '&.MuiChip-deletable .MuiChip-deleteIcon': {
                        color: 'inherit'
                    }
                }
            }
        },
        MuiTooltip: {
            styleOverrides: {
                tooltip: {
                    color: theme?.customization?.isDarkMode ? theme.colors?.paper : theme.paper,
                    background: theme.colors?.grey700
                }
            }
        },
        MuiAutocomplete: {
            styleOverrides: {
                option: {
                    '&:hover': {
                        background: theme?.customization?.isDarkMode ? '#233345 !important' : ''
                    }
                }
            }
        }
    }
}
