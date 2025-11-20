import { cssVarsTheme } from '@ui/theme/cssVarsTheme'
import { legacyColorTokens, createDeprecationProxy } from './legacyColors'

// Show deprecation warning in development mode only
if (process.env.NODE_ENV !== 'production') {
    console.warn(
        '[DEPRECATED] packages/ui/src/themes/index.js is deprecated. ' +
            'Use @ui/theme/cssVarsTheme instead. ' +
            'See packages/ui/src/themes/MIGRATION.md for migration guide.'
    )
}

/**
 * @deprecated Use cssVarsTheme from @ui/theme instead
 * This wrapper maintains backward compatibility with Flowise legacy code
 *
 * BACKWARD COMPATIBILITY:
 * - theme.colors.* - Legacy color tokens (deprecated, use theme.palette.* or theme.vars.palette.*)
 * - theme.palette.* - Standard MUI palette
 * - theme.vars.palette.* - CSS variable values (recommended)
 */
export const theme = (customization) => {
    // Return CSS Variables theme with legacy colors support
    return {
        ...cssVarsTheme,
        // Add legacy colors object for backward compatibility
        // In development mode, this will log warnings when accessed
        colors: createDeprecationProxy(legacyColorTokens),
        // Keep customization for legacy code that checks it
        customization: customization || {}
    }
}

export default theme
