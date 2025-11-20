/**
 * Skip Links Component
 * Provides keyboard navigation shortcuts for accessibility (WCAG 2.1 Level A)
 *
 * Skip links allow keyboard users to bypass repetitive navigation and jump
 * directly to main content areas. They are hidden by default and become
 * visible when focused via keyboard (Tab key).
 */

import { Box } from '@mui/material'

interface SkipLink {
    href: string
    label: string
}

const skipLinks: SkipLink[] = [
    { href: '#main-content', label: 'Skip to main content' },
    { href: '#navigation', label: 'Skip to navigation' },
    { href: '#sidebar', label: 'Skip to sidebar' }
]

/**
 * SkipLinks Component
 *
 * Usage:
 * 1. Add <SkipLinks /> as the first child in your layout
 * 2. Ensure target elements have matching IDs:
 *    - <main id="main-content">
 *    - <nav id="navigation">
 *    - <aside id="sidebar">
 *
 * @example
 * ```tsx
 * <AppLayout>
 *   <SkipLinks />
 *   <nav id="navigation">...</nav>
 *   <main id="main-content">...</main>
 * </AppLayout>
 * ```
 */
export const SkipLinks = () => {
    return (
        <Box
            component='nav'
            aria-label='Skip links'
            sx={{
                position: 'absolute',
                top: -100, // Hidden by default
                left: 0,
                zIndex: 9999, // Ensure it appears above all content
                '& a': {
                    position: 'absolute',
                    top: -100,
                    left: 0,
                    padding: 2,
                    fontSize: '1rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                    color: 'transparent',
                    backgroundColor: 'transparent',
                    border: 'none',
                    outline: 'none',
                    transition: 'all 0.2s ease-in-out',

                    // When focused (via Tab key), reveal the link
                    '&:focus': {
                        position: 'fixed',
                        top: 16,
                        left: 16,
                        color: 'primary.contrastText',
                        backgroundColor: 'primary.main',
                        borderRadius: 1,
                        boxShadow: 3,
                        zIndex: 9999,
                        outline: '2px solid transparent', // High contrast mode
                        outlineOffset: '2px',

                        // Glassmorphism effect for skip links
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)'
                    },

                    // Hover state (when link is visible and focused)
                    '&:focus:hover': {
                        backgroundColor: 'primary.dark',
                        transform: 'translateY(-1px)',
                        boxShadow: 4
                    }
                }
            }}
        >
            {skipLinks.map(({ href, label }) => (
                <a key={href} href={href}>
                    {label}
                </a>
            ))}
        </Box>
    )
}

/**
 * Accessibility Notes:
 *
 * - WCAG 2.1 Level A: Bypass Blocks (2.4.1)
 * - Hidden by default (position: absolute, top: -100)
 * - Becomes visible when focused via keyboard (Tab key)
 * - Fixed positioning ensures visibility regardless of scroll
 * - High z-index (9999) ensures it appears above modals
 * - High contrast mode support via transparent outline
 * - Smooth transitions for polished UX
 * - Glassmorphism styling matches theme design system
 *
 * Browser Support:
 * - All modern browsers (Chrome, Firefox, Safari, Edge)
 * - Keyboard navigation: Tab to focus, Enter/Space to activate
 * - Screen readers: Properly announced as navigation
 */
