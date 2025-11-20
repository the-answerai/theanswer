import type { PaletteColorOptions } from '@mui/material/styles'

/**
 * Converts hex color to RGB components
 */
const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    if (!result) {
        throw new Error(`Invalid hex color: ${hex}`)
    }

    return {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    }
}

/**
 * Generate alpha variants for a color
 * Creates pre-calculated alpha values for common opacities (10%, 20%, 30%, 40%, 50%)
 *
 * NOTE: This function is primarily kept for backward compatibility and tests.
 * For new code, prefer directly accessing theme variables with alpha variants:
 * - theme.vars.palette.primary.alpha10 (instead of withAlpha computation)
 * - Use alphaVar() for dynamic opacity adjustments with CSS color-mix
 *
 * @param hex - Hex color code (e.g., '#2563eb')
 * @returns Partial color options with main color and alpha variants
 *
 * @example
 * const primaryColor = withAlpha('#2563eb')
 * // Returns: {
 * //   main: '#2563eb',
 * //   alpha10: 'rgba(37, 99, 235, 0.10)',
 * //   alpha20: 'rgba(37, 99, 235, 0.20)',
 * //   ...
 * // }
 */
export const withAlpha = (hex: string): Partial<PaletteColorOptions> => {
    const { r, g, b } = hexToRgb(hex)

    return {
        main: hex,
        alpha10: `rgba(${r}, ${g}, ${b}, 0.10)`,
        alpha20: `rgba(${r}, ${g}, ${b}, 0.20)`,
        alpha30: `rgba(${r}, ${g}, ${b}, 0.30)`,
        alpha40: `rgba(${r}, ${g}, ${b}, 0.40)`,
        alpha50: `rgba(${r}, ${g}, ${b}, 0.50)`
    }
}

/**
 * Dynamically adjust color opacity using CSS color-mix (modern browsers)
 * Falls back to pre-calculated value for older browsers
 *
 * @param cssVar - CSS custom property (e.g., '--color-primary')
 * @param opacity - Opacity value between 0 and 1
 * @param fallback - Fallback color for unsupported browsers
 * @returns CSS color value using color-mix or fallback
 *
 * @example
 * const color = alphaVar('--color-primary', 0.5, 'rgba(37, 99, 235, 0.5)')
 */
export const alphaVar = (cssVar: string, opacity: number, fallback?: string): string => {
    const percent = Math.round(opacity * 100)

    // Feature detection for color-mix support
    if (typeof CSS !== 'undefined' && CSS.supports) {
        const supportsColorMix = CSS.supports('color', 'color-mix(in srgb, red 50%, blue)')

        if (supportsColorMix) {
            return `color-mix(in srgb, ${cssVar} ${percent}%, transparent)`
        }
    }

    // Fallback for older browsers
    return fallback || cssVar
}

/**
 * Export hexToRgb for advanced color manipulation
 * Useful when you need raw RGB values for other calculations
 */
export { hexToRgb }
