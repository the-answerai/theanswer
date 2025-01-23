'use client'

import React from 'react'
import { Box, Card, Typography, Button, Chip, Grid, Stack, Divider, useTheme } from '@mui/material'
import { BillingPlan } from '@/config/billing'
import Link from 'next/link'

interface BillingOverviewProps {
    currentPlan?: BillingPlan
    billingPeriod?: {
        start: string
        end: string
    }
    nextBillingDate?: string
    status?: 'active' | 'inactive' | 'past_due'
}

const BillingOverview: React.FC<BillingOverviewProps> = ({ currentPlan, billingPeriod, nextBillingDate, status = 'active' }) => {
    const theme = useTheme()

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return theme.palette.success.main
            case 'past_due':
                return theme.palette.error.main
            default:
                return 'rgba(255, 255, 255, 0.5)'
        }
    }

    return (
        <Card
            elevation={0}
            sx={{
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                bgcolor: 'rgba(0, 0, 0, 0.2)',
                backdropFilter: 'blur(20px)',
                p: 0
            }}
        >
            <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant='h5' sx={{ fontWeight: 600, color: '#fff' }}>
                    Billing Overview
                </Typography>
                <Button
                    component={Link}
                    href='/admin/pricing'
                    variant='outlined'
                    sx={{
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        color: '#fff',
                        '&:hover': {
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                            bgcolor: 'rgba(255, 255, 255, 0.05)'
                        }
                    }}
                >
                    CHANGE PLAN
                </Button>
            </Box>

            <Box sx={{ px: 3, pb: 3 }}>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <Stack spacing={2}>
                            <Box>
                                <Typography sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.875rem', mb: 0.5 }}>
                                    Current Plan
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant='h6' sx={{ color: '#fff', fontWeight: 600 }}>
                                        {currentPlan?.name || 'Free'}
                                    </Typography>
                                    <Chip
                                        label={status}
                                        size='small'
                                        sx={{
                                            bgcolor: `${getStatusColor(status)}20`,
                                            color: getStatusColor(status),
                                            borderRadius: '4px',
                                            height: '20px',
                                            fontSize: '0.75rem',
                                            fontWeight: 600
                                        }}
                                    />
                                </Box>
                            </Box>
                            {currentPlan?.pricePerMonth > 0 && (
                                <Box>
                                    <Typography sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.875rem', mb: 0.5 }}>
                                        Plan Cost
                                    </Typography>
                                    <Typography sx={{ color: '#fff' }}>${currentPlan.pricePerMonth}/month</Typography>
                                </Box>
                            )}
                        </Stack>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Stack spacing={2}>
                            {billingPeriod && (
                                <Box>
                                    <Typography sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.875rem', mb: 0.5 }}>
                                        Current Period
                                    </Typography>
                                    <Typography sx={{ color: '#fff' }}>
                                        {new Date(billingPeriod.start).toLocaleDateString()} -{' '}
                                        {new Date(billingPeriod.end).toLocaleDateString()}
                                    </Typography>
                                </Box>
                            )}
                            <Box>
                                <Typography sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.875rem', mb: 0.5 }}>
                                    Sparks Included
                                </Typography>
                                <Typography sx={{ color: '#fff' }}>
                                    {currentPlan?.sparksIncluded === -1
                                        ? 'Unlimited'
                                        : currentPlan?.sparksIncluded.toLocaleString() || '10,000'}{' '}
                                    Sparks/month
                                </Typography>
                            </Box>
                        </Stack>
                    </Grid>
                </Grid>

                <Divider sx={{ my: 3, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

                <Box>
                    <Typography sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.875rem', mb: 1.5 }}>Plan Features</Typography>
                    <Grid container spacing={2}>
                        {currentPlan?.features.map((feature) => (
                            <Grid item xs={12} sm={6} key={feature}>
                                <Typography sx={{ color: '#fff', fontSize: '0.875rem' }}>• {feature}</Typography>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            </Box>
        </Card>
    )
}

export default BillingOverview
