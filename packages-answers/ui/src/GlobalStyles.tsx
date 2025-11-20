import GlobalStyles from '@mui/material/GlobalStyles'

const Styles = () => {
    // No theme hook needed - all styles use CSS variables for reactive theme changes
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

                    // Scrollbar styling - uses CSS variables for reactive theme changes
                    '::-webkit-scrollbar': {
                        width: '8px',
                        height: '8px'
                    },
                    '::-webkit-scrollbar-track': {
                        background: 'transparent'
                    },
                    '::-webkit-scrollbar-thumb': {
                        // Use color-mix for dynamic scrollbar colors based on theme
                        backgroundColor: 'var(--theanswer-palette-action-disabled)',
                        borderRadius: '20px',
                        border: '2px solid transparent',
                        backgroundClip: 'padding-box',
                        '&:hover': {
                            backgroundColor: 'var(--theanswer-palette-action-selected)',
                            opacity: 0.8
                        }
                    }
                },
                body: {
                    background: 'var(--theanswer-palette-background-default)',
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
