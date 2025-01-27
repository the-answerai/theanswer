'use client'

import React, { useEffect, useState } from 'react'
import { Box, Typography, Grid, LinearProgress, Tooltip, IconButton, Stack, useTheme, Skeleton } from '@mui/material'
import { Info as InfoIcon, Bolt as SparkIcon, Memory as CpuIcon, Storage as StorageIcon } from '@mui/icons-material'
import billingApi from '@/api/billing'

const getUsagePercentage = (used: number, total: number) => {
    if (!total) return 0
    return Math.min((used / total) * 100, 100)
}

interface UsageMetric {
    used: number
    total: number
    sparks: number
    cost: number
    rate: number
}

interface UsageEvent {
    id: string
    timestamp: string
    type: 'ai_tokens' | 'compute' | 'storage'
    description: string
    sparks: number
    cost: number
    metadata?: {
        model?: string
        tokens?: number
        computeTime?: number
        storageSize?: number
        [key: string]: any
    }
}

interface UsageMetrics {
    ai_tokens?: UsageMetric
    compute?: UsageMetric
    storage?: UsageMetric
    total_sparks?: number
    total_cost?: number
    billing_period?: {
        start: string
        end: string
    }
    events?: UsageEvent[]
    subscription?: {
        id: string
        customerId: string
        status: string
        currentPeriodStart: string
        currentPeriodEnd: string
        cancelAtPeriodEnd: boolean
    }
}

interface UsageStatsProps {
    currentPlan?: {
        sparksIncluded: number
    }
}

interface SubscriptionUsage {
    id: string
    object: string
    aggregated_value: number
    end_time: number
    start_time: number
    meter: string
    meter_name: string
}

interface Subscription {
    id: string
    status: string
    collection_method: string
    currentPeriodStart: string
    currentPeriodEnd: string
    cancelAtPeriodEnd: boolean
    trial_end: number | null
    trial_start: number | null
    trial_settings: {
        end_behavior: {
            missing_payment_method: string
        }
    }
    default_payment_method: string | null
    items?: {
        data: Array<{
            plan: {
                nickname: string
                billing_scheme: string
                tiers_mode: string
                usage_type: string
                product: string
            }
            price: {
                recurring: {
                    interval: string
                    interval_count: number
                }
            }
        }>
    }
    usage: SubscriptionUsage[]
}

const LoadingCard = () => {
    const theme = useTheme()
    return (
        <Box
            sx={{
                p: 2.5,
                height: '100%',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                bgcolor: 'rgba(0, 0, 0, 0.2)',
                backdropFilter: 'blur(20px)'
            }}
        >
            <Stack spacing={2}>
                <Stack direction='row' alignItems='center' spacing={1}>
                    <Skeleton variant='circular' width={24} height={24} />
                    <Skeleton variant='text' width={120} height={24} />
                </Stack>
                <Skeleton variant='text' width='60%' />
                <Box>
                    <Skeleton variant='text' width='40%' sx={{ mb: 1 }} />
                    <Skeleton variant='rectangular' height={8} sx={{ borderRadius: 4 }} />
                </Box>
                <Grid container spacing={2}>
                    <Grid item xs={6}>
                        <Skeleton variant='text' width='80%' />
                        <Skeleton variant='text' width='60%' />
                    </Grid>
                    <Grid item xs={6}>
                        <Skeleton variant='text' width='80%' />
                        <Skeleton variant='text' width='60%' />
                    </Grid>
                </Grid>
            </Stack>
        </Box>
    )
}

const BillingPeriodProgress: React.FC<{ start: string; end: string }> = ({ start, end }) => {
    const theme = useTheme()
    const startDate = new Date(start)
    const endDate = new Date(end)
    const now = new Date()

    const totalDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    const daysElapsed = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    const progress = Math.min(Math.max((daysElapsed / totalDays) * 100, 0), 100)

    return (
        <Box sx={{ width: '100%', mt: 2 }}>
            <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem', mb: 1 }}>Billing Period Progress</Typography>
            <LinearProgress
                variant='determinate'
                value={progress}
                sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    '& .MuiLinearProgress-bar': {
                        bgcolor: theme.palette.primary.main,
                        borderRadius: 4
                    }
                }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Typography sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.75rem' }}>{startDate.toLocaleDateString()}</Typography>
                <Typography sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.75rem' }}>{endDate.toLocaleDateString()}</Typography>
            </Box>
        </Box>
    )
}

const SubscriptionStatusCard: React.FC<{ subscription: Subscription }> = ({ subscription }) => {
    const theme = useTheme()
    if (!subscription) return null

    const plan = subscription.items?.data[0]?.plan
    const price = subscription.items?.data[0]?.price

    // Calculate total sparks used
    const totalSparks = subscription.usage
        .filter((item) => item.meter_name === 'sparks')
        .reduce((sum, item) => sum + item.aggregated_value, 0)

    // Format dates
    const formatDate = (date: string | number) =>
        new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })

    return (
        <Box
            sx={{
                p: 3,
                width: '100%',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                bgcolor: 'rgba(0, 0, 0, 0.2)',
                backdropFilter: 'blur(20px)',
                mb: 3
            }}
        >
            {/* Header Section */}
            <Stack spacing={2}>
                <Stack direction='row' alignItems='center' justifyContent='space-between'>
                    <Stack spacing={1}>
                        <Typography variant='h5' sx={{ color: '#fff', fontWeight: 600 }}>
                            Subscription Overview
                        </Typography>
                        <Box
                            sx={{
                                px: 2,
                                py: 0.5,
                                bgcolor: subscription.status === 'active' ? 'success.main' : 'warning.main',
                                borderRadius: '12px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                width: 'fit-content'
                            }}
                        >
                            <Typography sx={{ color: '#fff', fontSize: '0.875rem', fontWeight: 500 }}>
                                {subscription.status.toUpperCase()}
                            </Typography>
                        </Box>
                    </Stack>
                    <Stack alignItems='flex-end'>
                        <Typography sx={{ color: '#fff', fontSize: '1.25rem', fontWeight: 600 }}>
                            ${((totalSparks || 0) * 0.001).toFixed(2)} USD
                        </Typography>
                        <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>Current Period Usage</Typography>
                    </Stack>
                </Stack>

                {/* Usage Progress */}
                <Box sx={{ mt: 3 }}>
                    <Stack direction='row' justifyContent='space-between' sx={{ mb: 1 }}>
                        <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>Total Sparks Used</Typography>
                        <Typography sx={{ color: '#fff', fontSize: '0.875rem' }}>{totalSparks.toLocaleString()} / 500,000</Typography>
                    </Stack>
                    <LinearProgress
                        variant='determinate'
                        value={Math.min((totalSparks / 500000) * 100, 100)}
                        sx={{
                            height: 8,
                            borderRadius: 4,
                            bgcolor: 'rgba(255, 255, 255, 0.1)',
                            '& .MuiLinearProgress-bar': {
                                bgcolor: theme.palette.primary.main,
                                borderRadius: 4
                            }
                        }}
                    />
                </Box>

                {/* Subscription Details Grid */}
                <Grid container spacing={3} sx={{ mt: 2 }}>
                    <Grid item xs={12} md={6}>
                        <Box sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', p: 2, borderRadius: '8px' }}>
                            <Typography sx={{ color: '#fff', fontSize: '1rem', fontWeight: 500, mb: 2 }}>Billing Details</Typography>
                            <Stack spacing={2}>
                                <Stack direction='row' justifyContent='space-between'>
                                    <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>Billing Period</Typography>
                                    <Typography sx={{ color: '#fff', fontSize: '0.875rem' }}>
                                        {formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}
                                    </Typography>
                                </Stack>
                                <Stack direction='row' justifyContent='space-between'>
                                    <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>Payment Method</Typography>
                                    <Typography sx={{ color: '#fff', fontSize: '0.875rem' }}>
                                        {subscription.default_payment_method
                                            ? 'Card ending in ' + subscription.default_payment_method.slice(-4)
                                            : 'Not set'}
                                    </Typography>
                                </Stack>
                                <Stack direction='row' justifyContent='space-between'>
                                    <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>
                                        Collection Method
                                    </Typography>
                                    <Typography sx={{ color: '#fff', fontSize: '0.875rem' }}>
                                        {subscription.collection_method === 'charge_automatically' ? 'Automatic' : 'Manual'}
                                    </Typography>
                                </Stack>
                            </Stack>
                        </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Box sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', p: 2, borderRadius: '8px' }}>
                            <Typography sx={{ color: '#fff', fontSize: '1rem', fontWeight: 500, mb: 2 }}>Plan Details</Typography>
                            <Stack spacing={2}>
                                <Stack direction='row' justifyContent='space-between'>
                                    <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>Billing Scheme</Typography>
                                    <Typography sx={{ color: '#fff', fontSize: '0.875rem' }}>
                                        {plan?.billing_scheme === 'tiered' ? 'Tiered Pricing' : 'Fixed Pricing'}
                                    </Typography>
                                </Stack>
                                <Stack direction='row' justifyContent='space-between'>
                                    <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>Usage Type</Typography>
                                    <Typography sx={{ color: '#fff', fontSize: '0.875rem' }}>
                                        {plan?.usage_type === 'metered' ? 'Pay as you go' : 'Fixed quota'}
                                    </Typography>
                                </Stack>
                                <Stack direction='row' justifyContent='space-between'>
                                    <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>
                                        Billing Interval
                                    </Typography>
                                    <Typography sx={{ color: '#fff', fontSize: '0.875rem' }}>
                                        {price?.recurring?.interval_count === 1
                                            ? 'Monthly'
                                            : `Every ${price?.recurring?.interval_count} ${price?.recurring?.interval}s`}
                                    </Typography>
                                </Stack>
                            </Stack>
                        </Box>
                    </Grid>
                </Grid>

                {/* Usage Breakdown */}
                <Box sx={{ mt: 2 }}>
                    <Typography sx={{ color: '#fff', fontSize: '1rem', fontWeight: 500, mb: 2 }}>Usage Breakdown</Typography>
                    <Box sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', p: 2, borderRadius: '8px' }}>
                        {subscription.usage.map((usage, index) => (
                            <Stack
                                key={usage.id}
                                direction='row'
                                justifyContent='space-between'
                                sx={{
                                    py: 1,
                                    borderBottom: index !== subscription.usage.length - 1 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none'
                                }}
                            >
                                <Stack direction='row' spacing={2} alignItems='center'>
                                    <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>
                                        {usage.meter_name === 'Unknown' ? `Meter ${usage.meter.split('_').pop()}` : usage.meter_name}
                                    </Typography>
                                    <Typography sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.75rem' }}>
                                        {new Date(usage.start_time * 1000).toLocaleDateString()}
                                    </Typography>
                                </Stack>
                                <Typography sx={{ color: '#fff', fontSize: '0.875rem' }}>
                                    {usage.aggregated_value.toLocaleString()} sparks
                                </Typography>
                            </Stack>
                        ))}
                    </Box>
                </Box>

                {subscription.cancelAtPeriodEnd && (
                    <Typography sx={{ color: theme.palette.warning.main, fontSize: '0.875rem', mt: 2 }}>
                        This subscription will be canceled at the end of the current billing period
                    </Typography>
                )}
            </Stack>
        </Box>
    )
}

const UsageStats: React.FC<UsageStatsProps> = ({ currentPlan }) => {
    const theme = useTheme()
    const [usage, setUsage] = useState<UsageMetrics>()
    const [subscription, setSubscription] = useState<Subscription>()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string>()

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                const [usageResponse, subscriptionResponse] = await Promise.all([billingApi.getUsageStats(), billingApi.getSubscriptions()])

                setUsage(usageResponse.data)
                setSubscription(subscriptionResponse.data)
                setError(undefined)
            } catch (error) {
                console.error('Failed to fetch usage stats:', error)
                setError('Failed to load usage statistics')
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    const UsageMetricCard: React.FC<{
        title: string
        icon: React.ReactNode
        metrics?: UsageMetric
        tooltipText: string
        rateInfo: string
    }> = ({ title, icon, metrics, tooltipText, rateInfo }) => (
        <Box
            sx={{
                p: 3,
                height: '100%',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                bgcolor: 'rgba(0, 0, 0, 0.2)',
                backdropFilter: 'blur(20px)',
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            <Stack spacing={3}>
                {/* Header */}
                <Stack direction='row' alignItems='center' justifyContent='space-between'>
                    <Stack direction='row' alignItems='center' spacing={1}>
                        <Box sx={{ color: theme.palette.primary.main, display: 'flex', alignItems: 'center' }}>
                            {React.cloneElement(icon as React.ReactElement, { sx: { fontSize: '1.5rem' } })}
                        </Box>
                        <Typography sx={{ color: '#fff', fontSize: '1.125rem', fontWeight: 500 }}>{title}</Typography>
                    </Stack>
                    <Tooltip title={tooltipText} arrow placement='top'>
                        <IconButton size='small' sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                            <InfoIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                    </Tooltip>
                </Stack>

                {/* Rate Info */}
                <Box sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', p: 2, borderRadius: '8px' }}>
                    <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>{rateInfo}</Typography>
                </Box>

                {/* Usage Progress */}
                <Box>
                    <Stack direction='row' justifyContent='space-between' sx={{ mb: 1 }}>
                        <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>Usage</Typography>
                        <Typography sx={{ color: '#fff', fontSize: '0.875rem' }}>
                            {metrics?.used?.toLocaleString() ?? '0'} / {metrics?.total?.toLocaleString() ?? '∞'}
                        </Typography>
                    </Stack>
                    <LinearProgress
                        variant='determinate'
                        value={getUsagePercentage(metrics?.used ?? 0, metrics?.total ?? 0)}
                        sx={{
                            height: 8,
                            borderRadius: 4,
                            bgcolor: 'rgba(255, 255, 255, 0.1)',
                            '& .MuiLinearProgress-bar': {
                                bgcolor: theme.palette.primary.main,
                                borderRadius: 4
                            }
                        }}
                    />
                </Box>

                {/* Stats */}
                <Grid container spacing={2}>
                    <Grid item xs={6}>
                        <Box>
                            <Typography sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.75rem', mb: 0.5 }}>SPARKS</Typography>
                            <Typography sx={{ color: '#fff', fontSize: '1.25rem', fontWeight: 600 }}>
                                {metrics?.sparks?.toLocaleString() ?? '0'}
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={6}>
                        <Box>
                            <Typography sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.75rem', mb: 0.5 }}>COST</Typography>
                            <Typography sx={{ color: '#fff', fontSize: '1.25rem', fontWeight: 600 }}>
                                ${metrics?.cost?.toFixed(2) ?? '0.00'}
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>
            </Stack>
        </Box>
    )

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Typography sx={{ color: theme.palette.error.main }}>{error}</Typography>
            </Box>
        )
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box sx={{ mb: 2 }}>
                    {loading ? (
                        <>
                            <Skeleton variant='text' width='60%' height={32} sx={{ mb: 1 }} />
                            <Skeleton variant='text' width='40%' />
                            <Skeleton variant='text' width='30%' sx={{ mt: 1 }} />
                        </>
                    ) : (
                        <>
                            <Typography variant='h5' sx={{ fontWeight: 600, color: '#fff', mb: 1 }}>
                                {subscription ? 'Active Subscription' : 'Simple, Usage-Based Pricing'}
                            </Typography>
                            <Typography sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.875rem' }}>
                                Pay only for what you use with our Sparks-based billing
                            </Typography>
                            <Typography sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.875rem', mt: 1 }}>
                                1 Spark = $0.001 USD
                            </Typography>
                        </>
                    )}
                </Box>

                {loading ? (
                    <Skeleton variant='rectangular' height={160} sx={{ borderRadius: 2 }} />
                ) : (
                    subscription && <SubscriptionStatusCard subscription={subscription} />
                )}

                <Grid container spacing={3} sx={{ '&': { ml: -3 } }}>
                    <Grid item xs={12} md={4}>
                        {loading ? (
                            <LoadingCard />
                        ) : (
                            <UsageMetricCard
                                title='AI Tokens'
                                icon={<SparkIcon />}
                                metrics={usage?.ai_tokens}
                                tooltipText='Usage from AI model token consumption'
                                rateInfo='1,000 tokens = 100 Sparks ($0.1)'
                            />
                        )}
                    </Grid>
                    <Grid item xs={12} md={4}>
                        {loading ? (
                            <LoadingCard />
                        ) : (
                            <UsageMetricCard
                                title='Compute Time'
                                icon={<CpuIcon />}
                                metrics={usage?.compute}
                                tooltipText='Usage from processing time and compute resources'
                                rateInfo='1 minute = 50 Sparks ($0.05)'
                            />
                        )}
                    </Grid>
                    <Grid item xs={12} md={4}>
                        {loading ? (
                            <LoadingCard />
                        ) : (
                            <UsageMetricCard
                                title='Storage'
                                icon={<StorageIcon />}
                                metrics={usage?.storage}
                                tooltipText='Usage from data storage and persistence'
                                rateInfo='1 GB/month = 500 Sparks ($0.5)'
                            />
                        )}
                    </Grid>
                </Grid>

                <Box sx={{ textAlign: 'right', mt: 2 }}>
                    {loading ? (
                        <>
                            <Skeleton variant='text' width='120px' sx={{ ml: 'auto' }} />
                            <Skeleton variant='text' width='180px' height={48} sx={{ ml: 'auto' }} />
                            <Skeleton variant='text' width='150px' sx={{ ml: 'auto' }} />
                        </>
                    ) : (
                        usage && (
                            <>
                                <Typography sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.875rem' }}>Total Cost</Typography>
                                <Typography variant='h4' sx={{ color: '#fff', fontWeight: 600 }}>
                                    ${usage.total_cost?.toFixed(2) ?? '0.00'}
                                </Typography>
                                <Typography sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.875rem' }}>
                                    Total Sparks: {usage.total_sparks?.toLocaleString() ?? '0'}
                                </Typography>
                            </>
                        )
                    )}
                </Box>
            </Box>
        </Box>
    )
}

export default UsageStats
