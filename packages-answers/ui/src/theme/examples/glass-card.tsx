/**
 * Glassmorphism Card Component Example
 *
 * Demonstrates modern glassmorphism effects with:
 * - Semi-transparent background with backdrop blur
 * - Hover animations with transform and shadow transitions
 * - Responsive sizing and spacing
 * - Accessibility-friendly with reduced motion support
 *
 * Features:
 * - Uses theme.vars.palette.glass.glassSecondary for glassmorphism
 * - Smooth hover effects with 3D transform
 * - Respects prefers-reduced-motion for accessibility
 * - Fully responsive design
 */

'use client'

import { Card, CardContent, Typography, useTheme } from '@mui/material'
import { useReducedMotion } from '../hooks/useReducedMotion'

export interface GlassCardProps {
    title: string
    description: string
    children?: React.ReactNode
}

/**
 * A glassmorphism-styled card with hover effects
 */
export const GlassCard: React.FC<GlassCardProps> = ({ title, description, children }) => {
    const theme = useTheme()
    const prefersReducedMotion = useReducedMotion()

    return (
        <Card
            sx={{
                // Glassmorphism base styles
                ...theme.vars.palette.glass.glassSecondary,

                // Spacing and sizing
                p: 3,
                maxWidth: { xs: '100%', sm: 400 },

                // Smooth transitions (disabled if user prefers reduced motion)
                transition: prefersReducedMotion ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',

                // Hover effects
                '&:hover': prefersReducedMotion
                    ? {} // No hover animation if reduced motion preferred
                    : {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 12px 40px 0 rgba(0, 0, 0, 0.15)',
                          borderColor: theme.vars.palette.primary.main + '40' // 25% opacity
                      },

                // Focus styles for keyboard navigation
                '&:focus-visible': {
                    outline: `2px solid ${theme.vars.palette.primary.main}`,
                    outlineOffset: 2
                }
            }}
            // Make card keyboard-focusable if it's interactive
            tabIndex={0}
        >
            <CardContent sx={{ p: 0 }}>
                {/* Title */}
                <Typography
                    variant='h5'
                    component='h2'
                    gutterBottom
                    sx={{
                        fontWeight: 600,
                        color: theme.vars.palette.text.primary
                    }}
                >
                    {title}
                </Typography>

                {/* Description */}
                <Typography variant='body2' color='text.secondary' sx={{ mb: children ? 2 : 0 }}>
                    {description}
                </Typography>

                {/* Additional content */}
                {children}
            </CardContent>
        </Card>
    )
}

/**
 * Usage Example:
 *
 * ```tsx
 * import { GlassCard } from '@ui/theme/examples/glass-card'
 *
 * function MyComponent() {
 *   return (
 *     <GlassCard
 *       title="Feature Card"
 *       description="This card demonstrates glassmorphism with smooth hover effects"
 *     >
 *       <Button variant="contained">Action</Button>
 *     </GlassCard>
 *   )
 * }
 * ```
 *
 * Advanced Usage with Custom Styling:
 *
 * ```tsx
 * <GlassCard
 *   title="Custom Card"
 *   description="Override styles as needed"
 * >
 *   <Stack spacing={2}>
 *     <Chip label="Tag" />
 *     <Button>Learn More</Button>
 *   </Stack>
 * </GlassCard>
 * ```
 */
