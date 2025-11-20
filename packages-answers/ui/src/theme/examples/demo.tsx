/**
 * Theme Examples Demo Page
 *
 * Interactive demo showing all theme system examples.
 * Use this as a reference or copy components to your app.
 *
 * To use this demo:
 * 1. Import in any page component
 * 2. Or create a route at /theme-examples
 */

'use client'

import { Stack, Container, Typography, Box, Divider, Grid } from '@mui/material'
import { GlassCard } from './glass-card'
import { ThemeToggle, ThemeToggleCompact } from './theme-toggle'
import { AlphaTransparencyShowcase } from './alpha-transparency'

export const ThemeExamplesDemo: React.FC = () => {
    return (
        <Container maxWidth='lg' sx={{ py: 4 }}>
            <Stack spacing={6}>
                {/* Header with theme toggle */}
                <Stack direction='row' justifyContent='space-between' alignItems='center' flexWrap='wrap' gap={2}>
                    <Box>
                        <Typography variant='h3' fontWeight={700} gutterBottom>
                            Theme System Examples
                        </Typography>
                        <Typography variant='body1' color='text.secondary'>
                            Production-ready components demonstrating CSS Variables theme system
                        </Typography>
                    </Box>
                    <Stack direction='row' spacing={2} alignItems='center'>
                        <ThemeToggle />
                        <Typography variant='caption' color='text.secondary'>
                            Toggle theme
                        </Typography>
                    </Stack>
                </Stack>

                <Divider />

                {/* Section 1: Glassmorphism Cards */}
                <Box>
                    <Typography variant='h4' fontWeight={600} gutterBottom>
                        1. Glassmorphism Cards
                    </Typography>
                    <Typography variant='body1' color='text.secondary' paragraph>
                        Semi-transparent cards with backdrop blur and hover animations
                    </Typography>

                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={6} md={4}>
                            <GlassCard title='Feature Card' description='Hover over this card to see the 3D lift effect' />
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <GlassCard title='Interactive' description='All hover effects respect reduced motion preferences' />
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <GlassCard title='Accessible' description='Keyboard focusable with visible focus indicators' />
                        </Grid>
                    </Grid>
                </Box>

                <Divider />

                {/* Section 2: Theme Toggle */}
                <Box>
                    <Typography variant='h4' fontWeight={600} gutterBottom>
                        2. Theme Toggle Variants
                    </Typography>
                    <Typography variant='body1' color='text.secondary' paragraph>
                        Full-featured theme switcher with accessibility support
                    </Typography>

                    <Stack direction='row' spacing={3} flexWrap='wrap' gap={2}>
                        <Box>
                            <Typography variant='body2' fontWeight={600} gutterBottom>
                                Default (with tooltip)
                            </Typography>
                            <ThemeToggle />
                        </Box>

                        <Box>
                            <Typography variant='body2' fontWeight={600} gutterBottom>
                                Different placement
                            </Typography>
                            <ThemeToggle tooltipPlacement='right' />
                        </Box>

                        <Box>
                            <Typography variant='body2' fontWeight={600} gutterBottom>
                                Compact variant
                            </Typography>
                            <ThemeToggleCompact />
                        </Box>

                        <Box>
                            <Typography variant='body2' fontWeight={600} gutterBottom>
                                Large size
                            </Typography>
                            <ThemeToggle size='large' />
                        </Box>
                    </Stack>

                    <Box
                        sx={{
                            mt: 3,
                            p: 2,
                            backgroundColor: 'info.main',
                            color: 'info.contrastText',
                            borderRadius: 2
                        }}
                    >
                        <Typography variant='body2'>
                            <strong>Features:</strong> Instant switching via CSS Variables, localStorage persistence, ARIA labels, keyboard
                            support
                        </Typography>
                    </Box>
                </Box>

                <Divider />

                {/* Section 3: Alpha Transparency */}
                <Box>
                    <Typography variant='h4' fontWeight={600} gutterBottom>
                        3. Alpha Transparency Patterns
                    </Typography>
                    <Typography variant='body1' color='text.secondary' paragraph>
                        Two approaches: pre-calculated variants and dynamic alpha
                    </Typography>

                    <AlphaTransparencyShowcase />
                </Box>

                <Divider />

                {/* Footer */}
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant='body2' color='text.secondary'>
                        All examples are production-ready, fully accessible, and type-safe
                    </Typography>
                    <Typography variant='caption' color='text.secondary' display='block' sx={{ mt: 1 }}>
                        See <code>packages-answers/ui/src/theme/examples/README.md</code> for documentation
                    </Typography>
                </Box>
            </Stack>
        </Container>
    )
}

/**
 * Usage in Next.js App Router:
 *
 * Create: apps/web/app/theme-examples/page.tsx
 *
 * ```tsx
 * import { ThemeExamplesDemo } from '@ui/theme/examples/demo'
 *
 * export default function ThemeExamplesPage() {
 *   return <ThemeExamplesDemo />
 * }
 * ```
 *
 * Then visit: http://localhost:3000/theme-examples
 */
