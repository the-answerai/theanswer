/**
 * Theme Validation Utilities
 * Ensures theme object has all required properties for proper operation
 */

import { Theme } from '@mui/material/styles'

/**
 * Validates that a theme object has all required properties
 * Logs warnings/errors for missing or invalid properties
 *
 * @param theme - MUI theme object to validate
 * @returns true if theme is valid, false otherwise
 */
export function validateTheme(theme: Theme): boolean {
    const errors: string[] = []
    const warnings: string[] = []

    // Check if this is a CSS Variables theme (has colorSchemes instead of palette)
    const isCssVarsTheme = 'colorSchemes' in theme && !('palette' in theme)

    if (isCssVarsTheme) {
        // CSS Variables themes have different structure - skip standard validation
        console.log('[Theme Validation] CSS Variables theme detected - using color schemes')

        // Validate colorSchemes structure
        const themeWithSchemes = theme as any
        if (!themeWithSchemes.colorSchemes?.light?.palette || !themeWithSchemes.colorSchemes?.dark?.palette) {
            errors.push('CSS Variables theme missing colorSchemes.light.palette or colorSchemes.dark.palette')
        }

        if (errors.length > 0) {
            console.error('[Theme Validation] CSS Variables theme validation failed:', errors)
            return false
        }

        console.log('[Theme Validation] CSS Variables theme validated successfully')
        return true
    }

    // Required top-level properties for standard themes
    const requiredProperties = ['palette', 'typography', 'spacing', 'breakpoints', 'shape', 'transitions']

    for (const key of requiredProperties) {
        if (!(key in theme)) {
            errors.push(`Missing required property: ${key}`)
        }
    }

    // Validate palette structure
    if ('palette' in theme && theme.palette) {
        const requiredPaletteKeys = ['mode', 'primary', 'secondary', 'background', 'text']

        for (const key of requiredPaletteKeys) {
            if (!(key in theme.palette)) {
                errors.push(`Missing required palette property: ${key}`)
            }
        }

        // Check primary/secondary have main color
        if (theme.palette.primary && !theme.palette.primary.main) {
            errors.push('palette.primary.main is required')
        }
        if (theme.palette.secondary && !theme.palette.secondary.main) {
            errors.push('palette.secondary.main is required')
        }

        // Check background colors
        if (theme.palette.background) {
            if (!theme.palette.background.default) {
                warnings.push('palette.background.default is recommended')
            }
            if (!theme.palette.background.paper) {
                warnings.push('palette.background.paper is recommended')
            }
        }
    }

    // Check for CSS Variables support (theme.vars)
    if (!('vars' in theme)) {
        warnings.push(
            'CSS Variables (theme.vars) not found. Theme may not support dynamic color scheme switching. ' +
                'Consider using experimental_extendTheme() for CSS Variables support.'
        )
    } else {
        // Validate vars structure if present
        const themeWithVars = theme as Theme & { vars?: { palette?: any } }
        if (themeWithVars.vars && !themeWithVars.vars.palette) {
            warnings.push('theme.vars.palette not found. CSS Variables may not work correctly.')
        }
    }

    // Validate typography
    if ('typography' in theme && theme.typography) {
        if (!theme.typography.fontFamily) {
            warnings.push('typography.fontFamily is recommended for consistent font rendering')
        }
    }

    // Validate breakpoints
    if ('breakpoints' in theme && theme.breakpoints) {
        const requiredBreakpoints = ['xs', 'sm', 'md', 'lg', 'xl']
        const breakpointValues = theme.breakpoints.values

        if (breakpointValues) {
            for (const bp of requiredBreakpoints) {
                if (!(bp in breakpointValues)) {
                    warnings.push(`Missing breakpoint: ${bp}`)
                }
            }
        }
    }

    // Log results
    if (errors.length > 0) {
        console.error('[Theme Validation] Theme validation failed with errors:', errors)
        return false
    }

    if (warnings.length > 0) {
        console.warn('[Theme Validation] Theme validation warnings:', warnings)
    }

    if (errors.length === 0 && warnings.length === 0) {
        console.log('[Theme Validation] Theme validated successfully')
    }

    return true
}

/**
 * Validates that CSS Variables are properly initialized in the DOM
 * Useful for debugging theme switching issues
 *
 * @param varPrefix - CSS variable prefix (e.g., 'theanswer')
 * @returns true if CSS variables are present, false otherwise
 */
export function validateCssVariables(varPrefix: string = 'theanswer'): boolean {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
        console.warn('[CSS Variables Validation] Cannot validate in non-browser environment')
        return false
    }

    const testVariables = [
        `--${varPrefix}-palette-primary-main`,
        `--${varPrefix}-palette-background-default`,
        `--${varPrefix}-palette-text-primary`
    ]

    const computedStyle = getComputedStyle(document.documentElement)
    const missingVars: string[] = []

    for (const varName of testVariables) {
        const value = computedStyle.getPropertyValue(varName)
        if (!value || value.trim() === '') {
            missingVars.push(varName)
        }
    }

    if (missingVars.length > 0) {
        console.error(
            '[CSS Variables Validation] Missing CSS variables:',
            missingVars,
            '\nEnsure CssVarsProvider is wrapping your application and theme is properly initialized.'
        )
        return false
    }

    console.log('[CSS Variables Validation] CSS variables initialized successfully')
    return true
}

/**
 * Checks if the current color scheme matches stored preference
 * Useful for debugging theme synchronization issues
 *
 * @param expectedMode - Expected color mode ('light' or 'dark')
 * @returns true if modes match, false otherwise
 */
export function validateColorScheme(expectedMode?: 'light' | 'dark'): boolean {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
        console.warn('[Color Scheme Validation] Cannot validate in non-browser environment')
        return false
    }

    // Get current mode from data attribute (MUI CSS Variables approach)
    const currentMode = document.documentElement.getAttribute('data-mui-color-scheme')

    if (!currentMode) {
        console.error('[Color Scheme Validation] data-mui-color-scheme attribute not found on <html> element')
        return false
    }

    if (expectedMode && currentMode !== expectedMode) {
        console.warn(
            `[Color Scheme Validation] Mode mismatch. Expected: ${expectedMode}, Current: ${currentMode}`,
            '\nThis may indicate a theme synchronization issue.'
        )
        return false
    }

    console.log(`[Color Scheme Validation] Color scheme is: ${currentMode}`)
    return true
}

/**
 * Comprehensive theme health check
 * Runs all validation checks and returns overall status
 *
 * @param theme - MUI theme object
 * @param varPrefix - CSS variable prefix
 * @returns Validation result with details
 */
export function runThemeHealthCheck(
    theme: Theme,
    varPrefix: string = 'theanswer'
): {
    isValid: boolean
    checks: {
        themeStructure: boolean
        cssVariables: boolean
        colorScheme: boolean
    }
} {
    console.group('[Theme Health Check]')

    const checks = {
        themeStructure: validateTheme(theme),
        cssVariables: validateCssVariables(varPrefix),
        colorScheme: validateColorScheme()
    }

    const isValid = Object.values(checks).every((check) => check === true)

    if (isValid) {
        console.log('✅ All theme health checks passed')
    } else {
        console.error('❌ Some theme health checks failed. See details above.')
    }

    console.groupEnd()

    return { isValid, checks }
}
