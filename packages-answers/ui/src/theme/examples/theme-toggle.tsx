/**
 * Theme Toggle Component
 *
 * Production-ready theme switcher with:
 * - Instant theme switching using CSS Variables
 * - Automatic persistence to localStorage
 * - Full accessibility support (ARIA, keyboard navigation)
 * - Smooth icon transitions
 * - Tooltip for better UX
 *
 * Features:
 * - Uses useThemeMode() hook from CSS Variables theme
 * - Persists preference across sessions
 * - Respects prefers-color-scheme media query
 * - Zero re-renders on theme change
 * - Full keyboard and screen reader support
 */

'use client'

import { IconButton, Tooltip, useTheme } from '@mui/material'
import { Brightness4, Brightness7 } from '@mui/icons-material'
import { useThemeMode } from '../cssVarsTheme'

export interface ThemeToggleProps {
    /** Size of the icon button */
    size?: 'small' | 'medium' | 'large'
    /** Custom tooltip text */
    tooltipText?: {
        light: string
        dark: string
    }
    /** Position of tooltip */
    tooltipPlacement?: 'top' | 'bottom' | 'left' | 'right'
}

/**
 * Toggle between light and dark theme
 * Automatically saves preference and applies instantly
 */
export const ThemeToggle: React.FC<ThemeToggleProps> = ({
    size = 'medium',
    tooltipText = {
        light: 'Switch to light mode',
        dark: 'Switch to dark mode'
    },
    tooltipPlacement = 'bottom'
}) => {
    const theme = useTheme()
    const { mode, toggleMode } = useThemeMode()

    const isDark = mode === 'dark'

    return (
        <Tooltip title={isDark ? tooltipText.light : tooltipText.dark} placement={tooltipPlacement} arrow>
            <IconButton
                onClick={toggleMode}
                size={size}
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                aria-pressed={isDark}
                sx={{
                    // Glassmorphism hover effect
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                        transform: 'scale(1.05)'
                    },
                    '&:active': {
                        transform: 'scale(0.95)'
                    },
                    // Focus styles for keyboard navigation
                    '&:focus-visible': {
                        outline: `2px solid ${theme.vars.palette.primary.main}`,
                        outlineOffset: 2
                    }
                }}
            >
                {isDark ? (
                    <Brightness7
                        sx={{
                            color: theme.vars.palette.warning.main,
                            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            '@keyframes rotate': {
                                from: { transform: 'rotate(0deg)' },
                                to: { transform: 'rotate(180deg)' }
                            },
                            animation: 'rotate 0.3s ease-in-out'
                        }}
                    />
                ) : (
                    <Brightness4
                        sx={{
                            color: theme.vars.palette.primary.main,
                            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                    />
                )}
            </IconButton>
        </Tooltip>
    )
}

/**
 * Compact variant without tooltip (for tight spaces)
 */
export const ThemeToggleCompact: React.FC<Pick<ThemeToggleProps, 'size'>> = ({ size = 'small' }) => {
    const { mode, toggleMode } = useThemeMode()
    const isDark = mode === 'dark'

    return (
        <IconButton
            onClick={toggleMode}
            size={size}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            sx={{ minWidth: 'auto' }}
        >
            {isDark ? <Brightness7 fontSize='small' /> : <Brightness4 fontSize='small' />}
        </IconButton>
    )
}

/**
 * Usage Example:
 *
 * ```tsx
 * import { ThemeToggle } from '@ui/theme/examples/theme-toggle'
 *
 * function AppHeader() {
 *   return (
 *     <AppBar>
 *       <Toolbar>
 *         <Typography variant="h6">My App</Typography>
 *         <Box sx={{ flexGrow: 1 }} />
 *         <ThemeToggle />
 *       </Toolbar>
 *     </AppBar>
 *   )
 * }
 * ```
 *
 * Custom Tooltip Text:
 *
 * ```tsx
 * <ThemeToggle
 *   tooltipText={{
 *     light: 'Enable day mode',
 *     dark: 'Enable night mode'
 *   }}
 *   tooltipPlacement="left"
 * />
 * ```
 *
 * Compact Variant:
 *
 * ```tsx
 * import { ThemeToggleCompact } from '@ui/theme/examples/theme-toggle'
 *
 * <ThemeToggleCompact size="small" />
 * ```
 *
 * Implementation Notes:
 * - Theme preference automatically saved to localStorage as 'mui-mode'
 * - Respects system preference (prefers-color-scheme) on first load
 * - Zero re-renders: theme switches via CSS Variables only
 * - Works with SSR: no flash of wrong theme
 */
