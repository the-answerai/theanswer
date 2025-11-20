/**
 * @deprecated This file is deprecated as of v3.0.0
 *
 * Typography configuration has been migrated to CSS Variables theme.
 *
 * Migration Guide:
 * ================
 *
 * Old approach:
 * ```javascript
 * const typography = themeTypography(theme)
 * ```
 *
 * New approach:
 * ```typescript
 * // Typography is now part of the theme
 * import { cssVarsTheme } from '@ui/theme/cssVarsTheme'
 *
 * // Access in components:
 * const MyComponent = styled(Box)(({ theme }) => ({
 *   ...theme.typography.h1,
 *   // or
 *   fontSize: theme.typography.h1.fontSize,
 *   fontFamily: theme.typography.fontFamily
 * }))
 * ```
 *
 * Typography variants available:
 * - h1, h2, h3, h4, h5, h6
 * - subtitle1, subtitle2
 * - body1, body2
 * - button, caption, overline
 *
 * Benefits:
 * - Consistent with MUI v6 standards
 * - Type-safe with TypeScript
 * - Better IntelliSense support
 * - Integrated with CSS variables theme
 *
 * This file will be removed in v4.0.0
 *
 * See: packages/ui/src/themes/MIGRATION.md for complete guide
 */

import { deprecationWarning } from '../../../packages-answers/ui/src/theme/utils/deprecation'

/**
 * @deprecated Use theme.typography.* instead
 */
export default function themeTypography(theme) {
    deprecationWarning(
        'themeTypography() from packages/ui/src/themes/typography.js',
        'theme.typography.*',
        'v4.0.0',
        'Typography is now part of the theme: theme.typography.h1, theme.typography.body1, etc.'
    )

    // Return empty object for backward compatibility
    // Typography is now defined in the CSS Variables theme
    return {}
}
