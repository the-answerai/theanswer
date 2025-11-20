/**
 * @deprecated This file is deprecated as of v3.0.0
 *
 * Component style overrides have been migrated to CSS Variables theme.
 *
 * Migration Guide:
 * ================
 *
 * Old location:
 * ```
 * packages/ui/src/themes/compStyleOverride.js
 * ```
 *
 * New location:
 * ```
 * packages-answers/ui/src/theme/components/muiOverridesCssVars.ts
 * ```
 *
 * Usage:
 * ```typescript
 * // Component overrides are now integrated into the theme
 * // No need to import or call this function
 *
 * // The theme automatically includes all overrides
 * import { cssVarsTheme } from '@ui/theme/cssVarsTheme'
 *
 * // Overrides are applied via:
 * // cssVarsTheme.components.MuiButton = { ... }
 * ```
 *
 * Benefits:
 * - Type-safe overrides with TypeScript
 * - Better organization in theme/components/
 * - CSS variables for dynamic theming
 * - Automatic dark mode handling
 *
 * This file will be removed in v4.0.0
 *
 * See: packages/ui/src/themes/MIGRATION.md for complete guide
 */

import { deprecationWarning } from '../../../packages-answers/ui/src/theme/utils/deprecation'

/**
 * @deprecated Component overrides moved to packages-answers/ui/src/theme/components/muiOverridesCssVars.ts
 */
export default function componentStyleOverrides(theme) {
    deprecationWarning(
        'componentStyleOverrides() from packages/ui/src/themes/compStyleOverride.js',
        'packages-answers/ui/src/theme/components/muiOverridesCssVars.ts',
        'v4.0.0',
        'Component overrides are now integrated into cssVarsTheme'
    )

    // Return empty object for backward compatibility
    // Overrides are now defined in the CSS Variables theme
    return {}
}
