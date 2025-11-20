/**
 * Unified Color Design Tokens
 * Provides consistent colors across light and dark modes
 * All colors now include alpha variants (10%, 20%, 30%, 40%, 50%)
 */

export const colorTokens = {
    light: {
        background: {
            default: '#ffffff',
            paper: '#ffffff'
        },
        primary: {
            main: '#0f172a', // Base dark for light mode
            light: '#1e293b',
            dark: '#0f172a',
            gradient: 'linear-gradient(135deg, rgb(37, 99, 235) 0%, rgb(59, 130, 246) 50%, rgb(147, 197, 253) 100%)' // Lighter 3-point gradient for better visual flow
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
            main: '#ffffff',
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
 * All colors now include alpha variants for consistent transparency
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

/**
 * Syntax highlighting colors for code display
 * Used in code blocks, tool chips, and inline code
 */
export const syntaxColors = {
    light: {
        code: '#f48771', // Orange for code snippets
        background: 'rgba(0, 0, 0, 0.05)', // Light background for code
        border: 'rgba(0, 0, 0, 0.1)' // Border for code containers
    },
    dark: {
        code: '#ff9e80', // Lighter orange for dark mode readability
        background: 'rgba(0, 0, 0, 0.3)', // Darker background for code
        border: 'rgba(255, 255, 255, 0.1)' // Light border for dark mode
    }
}

/**
 * Overlay colors for backgrounds, borders, and surfaces
 * Used for semi-transparent overlays on various UI elements
 */
export const overlayColors = {
    light: {
        // White overlays (for light backgrounds)
        white: {
            subtle: 'rgba(255, 255, 255, 0.04)', // Very subtle overlay
            light: 'rgba(255, 255, 255, 0.08)', // Light overlay
            medium: 'rgba(255, 255, 255, 0.12)', // Medium overlay
            heavy: 'rgba(255, 255, 255, 0.9)' // Heavy overlay (user messages)
        },
        // Black overlays (for contrast on light backgrounds)
        black: {
            subtle: 'rgba(0, 0, 0, 0.03)', // Very subtle
            light: 'rgba(0, 0, 0, 0.04)', // Light hover states
            medium: 'rgba(0, 0, 0, 0.05)', // Medium backgrounds
            heavy: 'rgba(0, 0, 0, 0.1)', // Heavy borders/dividers
            text: 'rgba(0, 0, 0, 0.87)' // Dark mode text on light backgrounds
        }
    },
    dark: {
        // White overlays (for dark backgrounds)
        white: {
            subtle: 'rgba(255, 255, 255, 0.05)', // Very subtle overlay
            light: 'rgba(255, 255, 255, 0.08)', // Light overlay/hover
            medium: 'rgba(255, 255, 255, 0.1)', // Medium overlay
            heavy: 'rgba(255, 255, 255, 0.12)', // Heavy overlay (borders)
            // Button-specific overlay values
            button: {
                base: 'rgba(255, 255, 255, 0.16)', // Button background gradient start
                baseDark: 'rgba(255, 255, 255, 0.12)', // Button background gradient end
                hover: 'rgba(255, 255, 255, 0.22)', // Button hover gradient start
                hoverDark: 'rgba(255, 255, 255, 0.18)', // Button hover gradient end
                border: 'rgba(255, 255, 255, 0.2)', // Button border
                borderHover: 'rgba(255, 255, 255, 0.3)', // Button border hover
                inset: 'rgba(255, 255, 255, 0.2)', // Button inset highlight
                insetHover: 'rgba(255, 255, 255, 0.25)', // Button inset highlight hover
                insetActive: 'rgba(255, 255, 255, 0.15)' // Button inset highlight active
            }
        },
        // Black overlays (for shadows/depth on dark backgrounds)
        black: {
            subtle: 'rgba(0, 0, 0, 0.05)',
            light: 'rgba(0, 0, 0, 0.1)',
            medium: 'rgba(0, 0, 0, 0.2)',
            heavy: 'rgba(0, 0, 0, 0.3)',
            darker: 'rgba(0, 0, 0, 0.4)', // Button shadows
            darkest: 'rgba(0, 0, 0, 0.5)' // Button hover shadows
        }
    }
}

/**
 * Monochrome colors for text and neutral elements
 * Consistent gray scale for both themes
 */
export const monochromeColors = {
    light: {
        neutral: '#E0E0E0', // Light gray for text
        disabled: '#9e9e9e' // Gray for disabled states
    },
    dark: {
        neutral: '#E0E0E0', // Same light gray for dark mode
        disabled: '#9e9e9e' // Same gray for disabled states
    }
}

/**
 * Code editor/syntax highlighter background
 * Intentionally kept as a constant (not theme-dependent)
 */
export const codeEditorColors = {
    background: '#1E1E1E' // VS Code dark background (intentionally constant)
}
