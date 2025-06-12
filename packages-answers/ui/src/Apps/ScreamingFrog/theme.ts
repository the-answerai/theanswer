import { createTheme } from '@mui/material/styles'
import type { Theme } from '@mui/material/styles'

const theme = createTheme({
    palette: {
        mode: 'dark',
        background: {
            default: '#181a1b',
            paper: '#23272a'
        },
        primary: {
            main: '#90caf9'
        },
        secondary: {
            main: '#f48fb1'
        },
        text: {
            primary: '#fff',
            secondary: '#b0b3b8'
        }
    },
    components: {
        MuiTableCell: {
            styleOverrides: {
                head: {
                    position: 'sticky',
                    top: 0,
                    zIndex: 1,
                    background: '#23272a',
                    color: '#fff',
                    fontWeight: 700,
                    textAlign: 'center',
                    fontSize: '0.875rem',
                    whiteSpace: 'nowrap',
                    maxWidth: 300,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                },
                root: {
                    textAlign: 'center',
                    fontSize: '.875rem',
                    color: '#fff'
                }
            }
        },
        MuiTableContainer: {
            styleOverrides: {
                root: {
                    maxHeight: '60vh',
                    overflowY: 'auto',
                    overflowX: 'auto',
                    marginBottom: 16,
                    background: '#181a1b'
                }
            }
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    background: '#23272a',
                    color: '#fff'
                }
            }
        },
        MuiLink: {
            styleOverrides: {
                root: ({ theme }) => ({
                    color: theme.palette.text.primary,
                    textDecoration: 'underline',
                    '&:hover': {
                        color: theme.palette.primary.main
                    }
                })
            }
        },
        MuiTable: {
            defaultProps: {
                size: 'small',
                stickyHeader: true
            }
        },
        MuiCssBaseline: {
            styleOverrides: {
                hr: (theme: Theme) => ({
                    marginTop: theme.spacing(4),
                    marginBottom: theme.spacing(4)
                })
            }
        },
        MuiDivider: {
            styleOverrides: {
                root: {
                    marginTop: 32,
                    marginBottom: 32
                }
            }
        }
    }
})

export default theme
