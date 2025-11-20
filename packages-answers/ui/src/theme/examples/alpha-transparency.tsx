/**
 * Alpha Transparency Patterns Example
 *
 * Demonstrates two approaches to color transparency:
 *
 * 1. Pre-calculated Alpha Variants (Recommended for common opacities)
 *    - Uses theme.vars.palette.primary.alpha10, alpha20, etc.
 *    - Best performance (no runtime calculations)
 *    - Browser compatibility: All browsers
 *    - Use for: 10%, 20%, 30%, 40%, 50% opacity
 *
 * 2. Dynamic Alpha with alphaVar() (For custom opacities)
 *    - Uses CSS color-mix() with fallback
 *    - Runtime color calculations
 *    - Browser compatibility: Modern browsers (Chrome 111+, Safari 16.2+)
 *    - Use for: Custom opacities (15%, 65%, 75%, etc.)
 *
 * When to use which:
 * - Common opacities (10-50% in 10% steps) → Pre-calculated variants
 * - Custom opacities or dynamic values → alphaVar() utility
 */

'use client'

import { Box, Stack, Typography, useTheme, Paper } from '@mui/material'
import { alphaVar } from '../utils/alpha'

/**
 * Demonstrates pre-calculated alpha variants
 */
export const PreCalculatedAlphaExample: React.FC = () => {
    const theme = useTheme()

    const alphaVariants = [
        { name: 'alpha10', value: 10, color: theme.vars.palette.primary.alpha10 },
        { name: 'alpha20', value: 20, color: theme.vars.palette.primary.alpha20 },
        { name: 'alpha30', value: 30, color: theme.vars.palette.primary.alpha30 },
        { name: 'alpha40', value: 40, color: theme.vars.palette.primary.alpha40 },
        { name: 'alpha50', value: 50, color: theme.vars.palette.primary.alpha50 }
    ]

    return (
        <Paper
            elevation={0}
            sx={{
                p: 3,
                ...theme.vars.palette.glass.glassSecondary
            }}
        >
            <Typography variant='h6' gutterBottom fontWeight={600}>
                Pre-calculated Alpha Variants
            </Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
                Best for common opacities (10%, 20%, 30%, 40%, 50%)
            </Typography>

            <Stack spacing={2}>
                {alphaVariants.map(({ name, value, color }) => (
                    <Box key={name}>
                        <Box
                            sx={{
                                height: 60,
                                backgroundColor: color,
                                borderRadius: 2,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: `1px solid ${theme.vars.palette.divider}`,
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            {/* Checkered background to show transparency */}
                            <Box
                                sx={{
                                    position: 'absolute',
                                    inset: 0,
                                    backgroundImage: `
                                        linear-gradient(45deg, #ccc 25%, transparent 25%),
                                        linear-gradient(-45deg, #ccc 25%, transparent 25%),
                                        linear-gradient(45deg, transparent 75%, #ccc 75%),
                                        linear-gradient(-45deg, transparent 75%, #ccc 75%)
                                    `,
                                    backgroundSize: '20px 20px',
                                    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                                    zIndex: 0
                                }}
                            />

                            <Typography
                                variant='body2'
                                fontWeight={600}
                                sx={{
                                    zIndex: 1,
                                    color: theme.vars.palette.text.primary,
                                    backgroundColor: theme.vars.palette.background.paper,
                                    px: 2,
                                    py: 0.5,
                                    borderRadius: 1
                                }}
                            >
                                {value}% opacity
                            </Typography>
                        </Box>

                        <Typography
                            variant='caption'
                            color='text.secondary'
                            component='code'
                            sx={{
                                mt: 0.5,
                                display: 'block',
                                fontFamily: 'monospace',
                                fontSize: '0.75rem'
                            }}
                        >
                            theme.vars.palette.primary.{name}
                        </Typography>
                    </Box>
                ))}
            </Stack>
        </Paper>
    )
}

/**
 * Demonstrates dynamic alpha using alphaVar() utility
 */
export const DynamicAlphaExample: React.FC = () => {
    const theme = useTheme()

    const customOpacities = [
        { label: '15%', opacity: 0.15 },
        { label: '35%', opacity: 0.35 },
        { label: '65%', opacity: 0.65 },
        { label: '85%', opacity: 0.85 }
    ]

    return (
        <Paper
            elevation={0}
            sx={{
                p: 3,
                ...theme.vars.palette.glass.glassSecondary
            }}
        >
            <Typography variant='h6' gutterBottom fontWeight={600}>
                Dynamic Alpha with alphaVar()
            </Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
                Best for custom opacities not in pre-calculated set
            </Typography>

            <Stack spacing={2}>
                {customOpacities.map(({ label, opacity }) => {
                    const primaryColor = theme.vars.palette.primary.main
                    const fallbackColor = `rgba(37, 99, 235, ${opacity})` // Fallback for older browsers

                    return (
                        <Box key={label}>
                            <Box
                                sx={{
                                    height: 60,
                                    backgroundColor: alphaVar(`var(--theanswer-palette-primary-main)`, opacity, fallbackColor),
                                    borderRadius: 2,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: `1px solid ${theme.vars.palette.divider}`,
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                            >
                                {/* Checkered background */}
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        inset: 0,
                                        backgroundImage: `
                                            linear-gradient(45deg, #ccc 25%, transparent 25%),
                                            linear-gradient(-45deg, #ccc 25%, transparent 25%),
                                            linear-gradient(45deg, transparent 75%, #ccc 75%),
                                            linear-gradient(-45deg, transparent 75%, #ccc 75%)
                                        `,
                                        backgroundSize: '20px 20px',
                                        backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                                        zIndex: 0
                                    }}
                                />

                                <Typography
                                    variant='body2'
                                    fontWeight={600}
                                    sx={{
                                        zIndex: 1,
                                        color: theme.vars.palette.text.primary,
                                        backgroundColor: theme.vars.palette.background.paper,
                                        px: 2,
                                        py: 0.5,
                                        borderRadius: 1
                                    }}
                                >
                                    {label} opacity
                                </Typography>
                            </Box>

                            <Typography
                                variant='caption'
                                color='text.secondary'
                                component='code'
                                sx={{
                                    mt: 0.5,
                                    display: 'block',
                                    fontFamily: 'monospace',
                                    fontSize: '0.75rem'
                                }}
                            >
                                alphaVar(primaryColor, {opacity})
                            </Typography>
                        </Box>
                    )
                })}
            </Stack>
        </Paper>
    )
}

/**
 * Combined example showing both approaches
 */
export const AlphaTransparencyShowcase: React.FC = () => {
    return (
        <Stack spacing={3} sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
            <Box>
                <Typography variant='h4' gutterBottom fontWeight={700}>
                    Alpha Transparency Patterns
                </Typography>
                <Typography variant='body1' color='text.secondary' paragraph>
                    Two approaches for handling color transparency in the theme system
                </Typography>
            </Box>

            <PreCalculatedAlphaExample />
            <DynamicAlphaExample />

            <Paper
                elevation={0}
                sx={{
                    p: 2,
                    backgroundColor: 'info.main',
                    color: 'info.contrastText',
                    borderRadius: 2
                }}
            >
                <Typography variant='body2' fontWeight={600} gutterBottom>
                    Key Concepts
                </Typography>
                <Typography variant='body2' component='ul' sx={{ pl: 2, m: 0 }}>
                    <li>Pre-calculated variants: Zero runtime cost, universal browser support</li>
                    <li>Dynamic alphaVar(): Flexible but requires modern browser (color-mix support)</li>
                    <li>Always provide fallback color for alphaVar() to support older browsers</li>
                    <li>Pre-calculated covers 90% of use cases (10%, 20%, 30%, 40%, 50%)</li>
                </Typography>
            </Paper>
        </Stack>
    )
}

/**
 * Usage Example:
 *
 * Pre-calculated Alpha (Recommended):
 * ```tsx
 * import { Box, useTheme } from '@mui/material'
 *
 * function MyComponent() {
 *   const theme = useTheme()
 *
 *   return (
 *     <Box
 *       sx={{
 *         backgroundColor: theme.vars.palette.primary.alpha20, // 20% opacity
 *         '&:hover': {
 *           backgroundColor: theme.vars.palette.primary.alpha30, // 30% on hover
 *         }
 *       }}
 *     >
 *       Content
 *     </Box>
 *   )
 * }
 * ```
 *
 * Dynamic Alpha (For custom values):
 * ```tsx
 * import { Box } from '@mui/material'
 * import { alphaVar } from '@ui/theme/utils/alpha'
 *
 * function CustomOpacity() {
 *   return (
 *     <Box
 *       sx={{
 *         // 65% opacity (not available in pre-calculated)
 *         backgroundColor: alphaVar(
 *           'var(--theanswer-palette-primary-main)',
 *           0.65,
 *           'rgba(37, 99, 235, 0.65)' // Fallback for older browsers
 *         )
 *       }}
 *     >
 *       Content
 *     </Box>
 *   )
 * }
 * ```
 *
 * Browser Compatibility:
 * - Pre-calculated: All browsers (IE11+)
 * - alphaVar() with color-mix: Chrome 111+, Safari 16.2+, Firefox 113+
 * - alphaVar() with fallback: All browsers (graceful degradation)
 */
