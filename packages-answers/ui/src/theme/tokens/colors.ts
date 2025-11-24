/**
 * Unified Color Design Tokens
 * Provides consistent colors across light and dark modes
 */

export const colorTokens = {
    light: {
        background: {
            default: '#ffffff',
            paper: '#ffffff'
        },
        primary: {
            main: 'rgba(15, 23, 42, 0.95)', // Increased opacity for better contrast
            light: 'rgba(30, 41, 59, 0.85)',
            dark: 'rgb(15, 23, 42)', // Solid for maximum contrast
            gradient: 'linear-gradient(135deg, rgb(30, 58, 138) 0%, rgb(59, 130, 246) 100%)' // Solid gradient for buttons
        },
        secondary: {
            main: '#ff6e40',
            light: '#ff9e80',
            dark: '#dd2c00'
        },
        text: {
            primary: '#1e293b',
            secondary: '#64748b',
            onGlass: '#ffffff',
            disabled: '#94a3b8'
        },
        divider: 'rgba(15, 23, 42, 0.12)',
        action: {
            hover: 'rgba(15, 23, 42, 0.04)',
            selected: 'rgba(15, 23, 42, 0.08)',
            disabled: 'rgba(15, 23, 42, 0.26)'
        }
    },

    dark: {
        background: {
            default: '#0b0b0b',
            paper: '#161616'
        },
        primary: {
            main: 'rgba(255, 255, 255, 0.12)', // Neutral light for buttons to match glass theme
            light: 'rgba(255, 255, 255, 0.18)',
            dark: 'rgba(255, 255, 255, 0.08)',
            gradient: 'linear-gradient(135deg, rgba(0, 0, 0, 0.6) 0%, rgba(26, 26, 26, 0.6) 100%)'
        },
        secondary: {
            main: '#ff9e80',
            light: '#ffc9b0',
            dark: '#ff6e40'
        },
        text: {
            primary: '#ffffff',
            secondary: '#9e9e9e',
            onGlass: '#ffffff',
            disabled: '#757575'
        },
        divider: 'rgba(255, 255, 255, 0.12)',
        action: {
            hover: 'rgba(255, 255, 255, 0.08)',
            selected: 'rgba(255, 255, 255, 0.16)',
            disabled: 'rgba(255, 255, 255, 0.3)'
        }
    }
}

/**
 * Status colors (used across both themes)
 */
export const statusColors = {
    success: {
        main: '#4caf50',
        light: '#81c784',
        dark: '#388e3c'
    },
    warning: {
        main: '#ff9800',
        light: '#ffb74d',
        dark: '#f57c00'
    },
    error: {
        main: '#f44336',
        light: '#e57373',
        dark: '#d32f2f'
    },
    info: {
        main: '#2196f3',
        light: '#64b5f6',
        dark: '#1976d2'
    }
}
