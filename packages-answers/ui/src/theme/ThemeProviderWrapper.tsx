/**
 * Theme Provider Wrapper
 * Provides CSS Variables theme with glassmorphism design
 */

'use client'
import { ReactNode } from 'react'
import { CssVarsThemeProvider } from './cssVarsTheme'

interface ThemeProviderWrapperProps {
    children: ReactNode
}

/**
 * Theme Provider Wrapper
 * Wraps the application with CSS Variables theme provider
 */
export const ThemeProviderWrapper = ({ children }: ThemeProviderWrapperProps) => {
    return <CssVarsThemeProvider>{children}</CssVarsThemeProvider>
}
