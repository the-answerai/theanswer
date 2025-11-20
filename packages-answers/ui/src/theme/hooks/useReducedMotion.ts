/**
 * Reduced Motion Hook
 * Detects user's motion preference for accessibility
 */

import { useState, useEffect } from 'react'

/**
 * Hook to detect if user prefers reduced motion
 * Respects system accessibility setting: prefers-reduced-motion
 *
 * @returns boolean - true if user prefers reduced motion
 *
 * @example
 * ```tsx
 * function AnimatedComponent() {
 *   const prefersReducedMotion = useReducedMotion()
 *
 *   return (
 *     <Box
 *       sx={{
 *         transition: prefersReducedMotion ? 'none' : 'all 0.3s ease'
 *       }}
 *     >
 *       Content
 *     </Box>
 *   )
 * }
 * ```
 */
export const useReducedMotion = (): boolean => {
    const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(() => {
        // SSR-safe initialization
        if (typeof window === 'undefined') {
            return false
        }

        // Check media query on mount
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    })

    useEffect(() => {
        // Skip if not in browser
        if (typeof window === 'undefined') {
            return
        }

        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

        // Handler for media query changes
        const handler = (event: MediaQueryListEvent | MediaQueryList) => {
            setPrefersReducedMotion(event.matches)
        }

        // Set initial value (in case state initialization was early)
        handler(mediaQuery)

        // Listen for changes
        // Note: Using deprecated addListener for broader browser support
        // Modern addEventListener is also supported
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', handler)
        } else if (mediaQuery.addListener) {
            // @ts-ignore - Deprecated but needed for Safari < 14
            mediaQuery.addListener(handler)
        }

        // Cleanup
        return () => {
            if (mediaQuery.removeEventListener) {
                mediaQuery.removeEventListener('change', handler)
            } else if (mediaQuery.removeListener) {
                // @ts-ignore - Deprecated but needed for Safari < 14
                mediaQuery.removeListener(handler)
            }
        }
    }, [])

    return prefersReducedMotion
}

/**
 * Transition configuration based on reduced motion preference
 *
 * @param reducedMotion - Whether user prefers reduced motion
 * @returns MUI transition configuration object
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const reducedMotion = useReducedMotion()
 *   const transitions = getTransitions(reducedMotion)
 *
 *   return (
 *     <Box
 *       sx={{
 *         transition: transitions.create(['opacity', 'transform'])
 *       }}
 *     >
 *       Content
 *     </Box>
 *   )
 * }
 * ```
 */
export const getTransitions = (reducedMotion: boolean) => {
    if (reducedMotion) {
        // Zero duration transitions for reduced motion
        return {
            duration: {
                shortest: 0,
                shorter: 0,
                short: 0,
                standard: 0,
                complex: 0,
                enteringScreen: 0,
                leavingScreen: 0
            },
            easing: {
                easeInOut: 'linear',
                easeOut: 'linear',
                easeIn: 'linear',
                sharp: 'linear'
            },
            create: () => 'none'
        }
    }

    // Standard MUI transitions
    return {
        duration: {
            shortest: 150,
            shorter: 200,
            short: 250,
            standard: 300,
            complex: 375,
            enteringScreen: 225,
            leavingScreen: 195
        },
        easing: {
            easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
            easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
            easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
            sharp: 'cubic-bezier(0.4, 0, 0.6, 1)'
        },
        create: (
            props: string[] | string = ['all'],
            options: {
                duration?: number
                easing?: string
                delay?: number
            } = {}
        ) => {
            const { duration = 300, easing = 'cubic-bezier(0.4, 0, 0.2, 1)', delay = 0 } = options

            const properties = Array.isArray(props) ? props : [props]

            return properties.map((prop) => `${prop} ${duration}ms ${easing} ${delay}ms`).join(', ')
        }
    }
}

/**
 * Get animation CSS based on reduced motion preference
 *
 * @param reducedMotion - Whether user prefers reduced motion
 * @param animation - Animation CSS string
 * @returns 'none' if reduced motion, otherwise the animation
 *
 * @example
 * ```tsx
 * const reducedMotion = useReducedMotion()
 *
 * <Box
 *   sx={{
 *     animation: getAnimation(reducedMotion, 'fadeIn 0.3s ease-in')
 *   }}
 * />
 * ```
 */
export const getAnimation = (reducedMotion: boolean, animation: string): string => {
    return reducedMotion ? 'none' : animation
}

/**
 * Hook that returns transition utilities with reduced motion applied
 *
 * @returns Object with transition utilities
 *
 * @example
 * ```tsx
 * function AnimatedBox() {
 *   const { transition, animate } = useTransition()
 *
 *   return (
 *     <Box
 *       sx={{
 *         transition: transition(['opacity', 'transform']),
 *         animation: animate('fadeIn 0.3s ease')
 *       }}
 *     >
 *       Content
 *     </Box>
 *   )
 * }
 * ```
 */
export const useTransition = () => {
    const prefersReducedMotion = useReducedMotion()
    const transitions = getTransitions(prefersReducedMotion)

    return {
        prefersReducedMotion,
        transitions,
        transition: transitions.create,
        animate: (animation: string) => getAnimation(prefersReducedMotion, animation)
    }
}
