/**
 * CSS Variables Theme System with Glassmorphism
 * Provides ultra-fast theme toggling with zero re-renders
 */

'use client'

// Re-export for convenience
export { glassmorphismTokens } from './tokens/glassmorphism'
export { colorTokens, statusColors } from './tokens/colors'
export { canvasTokens } from './tokens/canvasTokens'
export { canvasNodeStyles } from './components/canvasStyles'

// CSS Variables theme (primary export)
export { cssVarsTheme, CssVarsThemeProvider, useThemeMode } from './cssVarsTheme'
export { ThemeProviderWrapper } from './ThemeProviderWrapper'

// Error handling and validation
export { ThemeErrorBoundary } from './ThemeErrorBoundary'
export { validateTheme, validateCssVariables, validateColorScheme, runThemeHealthCheck } from './utils/validateTheme'
