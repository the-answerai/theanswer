/**
 * Blur Performance Optimization Utilities
 * Returns optimal blur values based on z-index to reduce GPU load
 */

/**
 * Returns optimal blur value based on element's z-index
 * Reduces GPU load for background layers by using lighter blur effects
 *
 * @param zIndex - The z-index of the element
 * @returns Optimal blur filter string
 *
 * @example
 * ```tsx
 * // Low priority background element
 * backdropFilter: getOptimalBlur(50) // → 'blur(8px)'
 *
 * // Modal overlay
 * backdropFilter: getOptimalBlur(1200) // → 'blur(16px)'
 *
 * // Tooltip
 * backdropFilter: getOptimalBlur(1400) // → 'blur(20px)'
 * ```
 */
export const getOptimalBlur = (zIndex: number): string => {
    // Background layers - minimal blur (z-index < 100)
    // Use for: page backgrounds, containers, low-priority elements
    if (zIndex < 100) return 'blur(8px)'

    // Mid-layer elements - medium blur (z-index 100-999)
    // Use for: cards, panels, content containers
    if (zIndex < 1000) return 'blur(12px)'

    // Modal/Dialog layer - strong blur (z-index 1000-1299)
    // Use for: modals, dialogs, drawers, overlays
    if (zIndex < 1300) return 'blur(16px)'

    // Tooltip/Popover layer - maximum blur (z-index >= 1300)
    // Use for: tooltips, popovers, dropdowns, menus
    return 'blur(20px)'
}

/**
 * Get blur with webkit prefix for cross-browser support
 *
 * @param zIndex - The z-index of the element
 * @returns Object with both standard and webkit blur properties
 *
 * @example
 * ```tsx
 * sx={{
 *   ...getOptimalBlurWithPrefix(theme.zIndex.modal)
 * }}
 * // Results in:
 * // {
 * //   backdropFilter: 'blur(16px)',
 * //   WebkitBackdropFilter: 'blur(16px)'
 * // }
 * ```
 */
export const getOptimalBlurWithPrefix = (zIndex: number) => {
    const blur = getOptimalBlur(zIndex)
    return {
        backdropFilter: blur,
        WebkitBackdropFilter: blur
    }
}

/**
 * MUI standard z-index values (for reference)
 *
 * mobileStepper: 1000
 * fab: 1050
 * speedDial: 1050
 * appBar: 1100
 * drawer: 1200
 * modal: 1300
 * snackbar: 1400
 * tooltip: 1500
 */
export const Z_INDEX_REFERENCE = {
    background: 0,
    content: 100,
    card: 200,
    appBar: 1100,
    drawer: 1200,
    modal: 1300,
    snackbar: 1400,
    tooltip: 1500
} as const

/**
 * Get recommended blur for common MUI component types
 *
 * @param componentType - The type of MUI component
 * @returns Optimal blur filter string
 *
 * @example
 * ```tsx
 * backdropFilter: getBlurForComponent('modal') // → 'blur(16px)'
 * ```
 */
export const getBlurForComponent = (componentType: 'background' | 'card' | 'appBar' | 'drawer' | 'modal' | 'tooltip'): string => {
    return getOptimalBlur(Z_INDEX_REFERENCE[componentType])
}
