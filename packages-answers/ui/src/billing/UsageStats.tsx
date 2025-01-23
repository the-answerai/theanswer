'use client'

import React, { useEffect, useState } from 'react'
import { Box, Typography, Grid, LinearProgress, Tooltip, IconButton, Stack, useTheme, Skeleton } from '@mui/material'
import { Info as InfoIcon, Bolt as SparkIcon, Memory as CpuIcon, Storage as StorageIcon } from '@mui/icons-material'
import { BILLING_CONFIG } from '../config/billing'
import billingApi from '@/api/billing'

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
}

interface UsageStatsProps {
    currentPlan?: {
        sparksIncluded: number
    }
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

const UsageStats: React.FC<UsageStatsProps> = ({ currentPlan }) => {
    const theme = useTheme()
    const [usage, setUsage] = useState<UsageMetrics>()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string>()

    useEffect(() => {
        const fetchUsage = async () => {
            try {
                const response = await billingApi.getUsageStats()
                setUsage(response.data)
                setError(undefined)
            } catch (error) {
                console.error('Failed to fetch usage stats:', error)
                setError('Failed to load usage statistics')
            } finally {
                setLoading(false)
            }
        }
        fetchUsage()
    }, [])

    const getUsagePercentage = (used: number, total: number) => {
        if (!total) return 0
        return Math.min((used / total) * 100, 100)
    }

    const UsageMetricCard: React.FC<{
        title: string
        icon: React.ReactNode
        metrics?: UsageMetric
        tooltipText: string
        rateInfo: string
    }> = ({ title, icon, metrics, tooltipText, rateInfo }) => (
        <Box
            sx={{
                p: 2.5,
                height: '100%',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                bgcolor: 'rgba(0, 0, 0, 0.2)',
                backdropFilter: 'blur(20px)',
                minHeight: '280px',
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            <Stack spacing={2}>
                <Stack direction='row' alignItems='center' spacing={1}>
                    <Box sx={{ color: theme.palette.primary.main }}>{icon}</Box>
                    <Typography sx={{ color: '#fff', fontSize: '1rem', fontWeight: 500 }}>{title}</Typography>
                    <Tooltip title={tooltipText} arrow placement='top'>
                        <IconButton size='small' sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                            <InfoIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                    </Tooltip>
                </Stack>

                <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>{rateInfo}</Typography>

                <Box>
                    <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem', mb: 1 }}>
                        {metrics?.used?.toLocaleString() ?? '0'} / {metrics?.total?.toLocaleString() ?? '∞'}
                    </Typography>

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

                <Grid container spacing={2}>
                    <Grid item xs={6}>
                        <Typography sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.75rem', mb: 0.5 }}>SPARKS USED</Typography>
                        <Typography sx={{ color: '#fff', fontSize: '1.25rem', fontWeight: 600 }}>
                            {metrics?.sparks?.toLocaleString() ?? '0'}
                        </Typography>
                    </Grid>
                    <Grid item xs={6}>
                        <Typography sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.75rem', mb: 0.5 }}>COST</Typography>
                        <Typography sx={{ color: '#fff', fontSize: '1.25rem', fontWeight: 600 }}>
                            ${metrics?.cost?.toFixed(2) ?? '0'}
                        </Typography>
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
                                Simple, Usage-Based Pricing
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
