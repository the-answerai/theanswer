/**
 * Legacy color tokens for backward compatibility with Flowise components
 *
 * IMPORTANT: This file maintains compatibility with components that use theme.colors.*
 * These references should be migrated to theme.palette.* or theme.vars.palette.*
 *
 * @deprecated New components should use:
 *  - theme.palette.* for standard MUI palette access
 *  - theme.vars.palette.* for CSS variable values (recommended)
 *
 * Migration examples:
 *  - theme.colors.paper → theme.palette.background.paper
 *  - theme.colors.primaryMain → theme.vars.palette.primary.main
 *  - theme.colors.grey500 → theme.palette.grey[500]
 */

// Type definitions for legacy color tokens
export interface LegacyColorToken {
    [key: string]: string | LegacyColorToken | (() => string)
}

// Augment MUI theme types to include optional legacy colors property
declare module '@mui/material/styles' {
    interface Theme {
        /**
         * @deprecated Legacy color tokens for backward compatibility
         * Use theme.palette.* or theme.vars.palette.* instead
         */
        colors?: LegacyColorToken
    }
    interface ThemeOptions {
        /**
         * @deprecated Legacy color tokens for backward compatibility
         * Use theme.palette.* or theme.vars.palette.* instead
         */
        colors?: LegacyColorToken
    }
}

export const legacyColorTokens: LegacyColorToken = {
    // Paper & backgrounds
    paper: '#1a1a1a',

    // Primary colors
    primaryLight: '#e3f2fd',
    primaryMain: '#2196f3',
    primaryDark: '#1e88e5',
    primary200: '#90caf9',
    primary800: '#1565c0',

    // Secondary colors
    secondaryLight: '#ede7f6',
    secondaryMain: '#673ab7',
    secondaryDark: '#5e35b1',
    secondary200: '#b39ddb',
    secondary800: '#4527a0',

    // Grey scale
    grey50: '#fafafa',
    grey100: '#f5f5f5',
    grey200: '#eeeeee',
    grey300: '#e0e0e0',
    grey500: '#9e9e9e',
    grey600: '#757575',
    grey700: '#616161',
    grey900: '#212121',

    // Success colors
    successLight: '#e8f5e9',
    success200: '#a5d6a7',
    successMain: '#4caf50',
    successDark: '#388e3c',

    // Error colors
    errorLight: '#ffebee',
    errorMain: '#f44336',
    errorDark: '#d32f2f',

    // Warning colors
    warningLight: '#fff3e0',
    warningMain: '#ff9800',
    warningDark: '#f57c00',

    // Info colors
    infoLight: '#e3f2fd',
    infoMain: '#2196f3',
    infoDark: '#1976d2',

    // Additional legacy colors from old theme
    darkLevel1: '#29314f',
    darkLevel2: '#212946',
    darkPaper: '#111936',
    darkBackground: '#1a223f',
    darkPrimaryLight: '#e3f2fd',
    darkPrimaryMain: '#2196f3',
    darkPrimaryDark: '#1e88e5',
    darkPrimary200: '#90caf9',
    darkPrimary800: '#1565c0',
    darkSecondaryLight: '#ede7f6',
    darkSecondaryMain: '#673ab7',
    darkSecondaryDark: '#5e35b1',
    darkSecondary200: '#b39ddb',
    darkSecondary800: '#4527a0',
    darkTextTitle: '#d7dcec',
    darkTextPrimary: '#bdc8f0',
    darkTextSecondary: '#8492c4',

    // Light theme specific
    heading: '#333333',

    // Orange accent (used in some components)
    orangeLight: '#fbe9e7',
    orangeMain: '#ff9800',
    orangeDark: '#f57c00',

    /**
     * Dynamic property that attempts to read from CSS variables first
     * Falls back to static value if CSS variables not available
     */
    get background(): string {
        if (typeof document !== 'undefined') {
            const bgValue = getComputedStyle(document.documentElement).getPropertyValue('--theanswer-palette-background-default')
            return bgValue || (this.paper as string)
        }
        return this.paper as string
    }
}

/**
 * Creates a Proxy wrapper that logs deprecation warnings in development mode
 * and provides runtime safety for undefined properties
 *
 * @param target - The legacy color tokens object
 * @returns Proxied color object that warns on access and handles undefined safely
 */
export function createDeprecationProxy(target: LegacyColorToken): LegacyColorToken {
    // Skip proxy in production for performance
    if (process.env.NODE_ENV !== 'development') {
        return target
    }

    return new Proxy(target, {
        get(obj: LegacyColorToken, prop: string | symbol): any {
            // Don't warn for internal property access or special symbols
            if (
                prop === '__proto__' ||
                prop === 'constructor' ||
                prop === 'toString' ||
                prop === 'valueOf' ||
                prop === Symbol.toStringTag ||
                prop === 'hasOwnProperty' ||
                typeof prop === 'symbol'
            ) {
                return obj[prop as keyof LegacyColorToken]
            }

            const propString = String(prop)

            // Runtime safety: check if property exists
            if (!(prop in obj)) {
                console.error(
                    `[Theme Error] Property theme.colors.${propString} does not exist.\n` +
                        `This will return undefined and may cause UI errors.\n` +
                        `Update your code to use theme.vars.palette.* for CSS variables.\n` +
                        `See packages/ui/src/themes/MIGRATION.md for migration guide.`
                )
                return undefined
            }

            // Log deprecation warning
            console.warn(
                `[Theme Deprecation] Accessing theme.colors.${propString} is deprecated.\n` +
                    `Migration:\n` +
                    `  - For palette colors: Use theme.palette.* (e.g., theme.palette.primary.main)\n` +
                    `  - For CSS variables: Use theme.vars.palette.* (recommended for dynamic theming)\n` +
                    `  - See packages/ui/src/themes/MIGRATION.md for full guide`
            )

            const value = obj[prop as keyof LegacyColorToken]

            // Handle getter functions
            if (typeof value === 'function') {
                return value.call(obj)
            }

            return value
        }
    })
}

export default legacyColorTokens
