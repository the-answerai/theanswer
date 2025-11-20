/**
 * Deprecation Warning Utility
 *
 * Provides consistent deprecation warnings across the theme system.
 * Warnings are shown once per unique API pair in development mode only.
 */

const warnings = new Set<string>()

/**
 * Show a deprecation warning for an API that is being phased out
 *
 * @param oldAPI - The deprecated API being used (e.g., 'themePalette()')
 * @param newAPI - The recommended replacement API (e.g., '@ui/theme/tokens/colors')
 * @param removeVersion - Optional version when the old API will be removed (e.g., 'v4.0.0')
 * @param details - Optional additional details or migration instructions
 *
 * @example
 * deprecationWarning(
 *   'themePalette()',
 *   '@ui/theme/tokens/colors',
 *   'v4.0.0',
 *   'Use theme.vars.palette.* in components'
 * )
 */
export function deprecationWarning(oldAPI: string, newAPI: string, removeVersion?: string, details?: string): void {
    const key = `${oldAPI}-${newAPI}`

    // Only show each warning once
    if (warnings.has(key)) return
    warnings.add(key)

    // Only warn in development
    if (process.env.NODE_ENV !== 'production') {
        let message = `[DEPRECATED] ${oldAPI} is deprecated. Use ${newAPI} instead.`

        if (removeVersion) {
            message += ` Will be removed in ${removeVersion}.`
        }

        if (details) {
            message += `\n  ${details}`
        }

        message += `\n  See packages/ui/src/themes/MIGRATION.md for details.`

        console.warn(message)
    }
}

/**
 * Clear all deprecation warnings (useful for testing)
 */
export function clearDeprecationWarnings(): void {
    warnings.clear()
}

/**
 * Get count of unique deprecation warnings shown
 */
export function getDeprecationWarningCount(): number {
    return warnings.size
}
