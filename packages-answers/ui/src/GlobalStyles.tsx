import GlobalStyles from '@mui/material/GlobalStyles'
import { useTheme } from '@mui/material/styles'

const Styles = () => {
    const theme = useTheme()
    const mode = theme.palette.mode

    return (
        <GlobalStyles
            styles={{
                // Pulsing gradient animation
                '@keyframes pulseGradient': {
                    '0%, 100%': {
                        backgroundPosition: '0% 50%'
                    },
                    '50%': {
                        backgroundPosition: '100% 50%'
                    }
                },
                // Glass flare animation for hover
                '@keyframes glassFlare': {
                    '0%': {
                        transform: 'translateX(-100%)',
                        opacity: 0
                    },
                    '50%': {
                        opacity: 1
                    },
                    '100%': {
                        transform: 'translateX(100%)',
                        opacity: 0
                    }
                },
                a: { textDecoration: 'none' },
                '*': {
                    boxSizing: 'border-box',
                    padding: 0,
                    margin: 0,

                    // Smooth transitions for theme changes
                    transition:
                        'background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1), ' +
                        'color 0.3s cubic-bezier(0.4, 0, 0.2, 1), ' +
                        'border-color 0.3s cubic-bezier(0.4, 0, 0.2, 1)',

                    // Scrollbar styling
                    '::-webkit-scrollbar': {
                        width: '8px',
                        height: '8px'
                    },
                    '::-webkit-scrollbar-track': {
                        background: 'transparent'
                    },
                    '::-webkit-scrollbar-thumb': {
                        backgroundColor: mode === 'light' ? 'rgba(15, 23, 42, 0.2)' : 'rgba(255, 255, 255, 0.2)',
                        borderRadius: '20px',
                        border: '2px solid transparent',
                        backgroundClip: 'padding-box',
                        '&:hover': {
                            backgroundColor: mode === 'light' ? 'rgba(15, 23, 42, 0.3)' : 'rgba(255, 255, 255, 0.3)'
                        }
                    }
                },
                body: {
                    background: theme.palette.background.default,
                    transition: 'background 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    overflowX: 'hidden'
                },
                html: {
                    scrollBehavior: 'smooth'
                }
            }}
        />
    )
}

export default Styles
