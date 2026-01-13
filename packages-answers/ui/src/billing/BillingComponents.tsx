import React from 'react'
import { Box, Container, Typography, Card, Stack } from '@mui/material'
import { useTheme, alpha } from '@mui/material/styles'
// import { Info as InfoIcon, Bolt as CreditIcon } from '@mui/icons-material'
// import UsageStats from '@ui/billing/UsageStats'

export const UsageStats = () => {
    const theme = useTheme()
    return (
    <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant='h4' gutterBottom sx={{ color: theme.palette.text.primary }}>
            Simple, Usage-Based Pricing
        </Typography>
        <Typography variant='body1' sx={{ color: theme.palette.text.secondary, mb: 2 }}>
            Pay only for what you use with our Credits-based billing
        </Typography>
        <Typography variant='body1' sx={{ color: theme.palette.text.primary, mb: 4 }}>
            1 Credit = $0.001 USD
        </Typography>

        <Stack direction='row' spacing={3} justifyContent='center'>
            <Card
                sx={{
                    bgcolor: alpha(theme.palette.background.paper, 0.8),
                    backdropFilter: 'blur(10px)',
                    border: `1px solid ${theme.palette.divider}`,
                    boxShadow: 'none',
                    p: 2,
                    flex: 1,
                    maxWidth: 300
                }}
            >
                <Stack direction='row' alignItems='center' spacing={1}>
                    {/* <CreditIcon /> */}
                    <Typography variant='h6' sx={{ color: theme.palette.text.primary }}>
                        AI Tokens
                    </Typography>
                    {/* <InfoIcon sx={{ fontSize: 16, color: 'rgba(255,255,255,0.5)' }} /> */}
                </Stack>
                <Typography variant='body2' sx={{ color: theme.palette.text.secondary, mt: 1 }}>
                    1,000 tokens = 100 Credits ($0.1)
                </Typography>
            </Card>

            <Card
                sx={{
                    bgcolor: alpha(theme.palette.background.paper, 0.8),
                    backdropFilter: 'blur(10px)',
                    border: `1px solid ${theme.palette.divider}`,
                    boxShadow: 'none',
                    p: 2,
                    flex: 1,
                    maxWidth: 300
                }}
            >
                <Stack direction='row' alignItems='center' spacing={1}>
                    {/* <CreditIcon sx={{ color: 'primary.main' }} /> */}
                    <Typography variant='h6' sx={{ color: theme.palette.text.primary }}>
                        Compute Time
                    </Typography>
                    {/* <InfoIcon sx={{ fontSize: 16, color: 'rgba(255,255,255,0.5)' }} /> */}
                </Stack>
                <Typography variant='body2' sx={{ color: theme.palette.text.secondary, mt: 1 }}>
                    1 minute = 50 Credits ($0.05)
                </Typography>
            </Card>

            <Card
                sx={{
                    bgcolor: alpha(theme.palette.background.paper, 0.8),
                    backdropFilter: 'blur(10px)',
                    border: `1px solid ${theme.palette.divider}`,
                    boxShadow: 'none',
                    p: 2,
                    flex: 1,
                    maxWidth: 300
                }}
            >
                <Stack direction='row' alignItems='center' spacing={1}>
                    {/* <CreditIcon sx={{ color: 'primary.main' }} /> */}
                    <Typography variant='h6' sx={{ color: theme.palette.text.primary }}>
                        Storage
                    </Typography>
                    {/* <InfoIcon sx={{ fontSize: 16, color: 'rgba(255,255,255,0.5)' }} /> */}
                </Stack>
                <Typography variant='body2' sx={{ color: theme.palette.text.secondary, mt: 1 }}>
                    1 GB/month = 500 Credits ($0.5)
                </Typography>
            </Card>
        </Stack>
    </Box>
)
}

export const BillingContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const theme = useTheme()
    return (
        <Container
            maxWidth='lg'
            sx={{
                py: 4,
                minHeight: '100vh',
                bgcolor: theme.palette.background.default,
                color: theme.palette.text.primary
            }}
        >
            {children}
        </Container>
    )
}
