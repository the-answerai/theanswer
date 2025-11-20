/**
 * @deprecated This file is deprecated as of v3.0.0
 *
 * Legacy palette configuration has been replaced by CSS Variables theme.
 *
 * Migration Guide:
 * ================
 *
 * Import the new color tokens:
 * ```javascript
 * import { colorTokens } from '@ui/theme/tokens/colors'
 * ```
 *
 * In components, use the theme palette:
 * ```javascript
 * // ❌ Old (if this function was used)
 * const palette = themePalette(theme)
 * color: palette.primary.main
 *
 * // ✅ New (recommended - CSS variables)
 * color: theme.vars.palette.primary.main
 *
 * // ✅ Alternative (static palette)
 * color: theme.palette.primary.main
 * ```
 *
 * Benefits:
 * - Instant theme switching (<10ms vs 120-250ms)
 * - No Flash of Unstyled Content (FOUC)
 * - Automatic dark/light mode handling
 *
 * This file will be removed in v4.0.0
 *
 * See: packages/ui/src/themes/MIGRATION.md for complete guide
 */

import { deprecationWarning } from '../../../packages-answers/ui/src/theme/utils/deprecation'

/**
 * @deprecated Use theme.vars.palette.* or theme.palette.* instead
 */
export default function themePalette(theme) {
    deprecationWarning(
        'themePalette() from packages/ui/src/themes/palette.js',
        'theme.vars.palette.* (recommended) or theme.palette.*',
        'v4.0.0',
        'For CSS variables: theme.vars.palette.primary.main\n  For static colors: theme.palette.primary.main'
    )

    // Return empty object for backward compatibility
    // Components should not be using this function anymore
    return {}
}
