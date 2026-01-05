'use client'
import { useMemo } from 'react'
import NextLink from 'next/link'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import LinearProgress from '@mui/material/LinearProgress'
import { Card, CardContent, CircularProgress, Chip } from '@mui/material'
import { useBillingData } from '../billing/hooks/useBillingData'

export const PlanCard: React.FC = () => {
    const { billingData, isLoading, isError } = useBillingData()

    const { creditsUsed, creditsTotal, usagePercent } = useMemo(() => {
        if (!billingData) return { creditsUsed: 0, creditsTotal: 0, usagePercent: 0 }

        const used =
            (billingData.usageDashboard?.aiTokens?.used || 0) +
            (billingData.usageDashboard?.compute?.used || 0) +
            (billingData.usageDashboard?.storage?.used || 0)
        const total = billingData.currentPlan?.creditsIncluded || 0
        const percent = total > 0 ? Math.min(Math.round((used / total) * 100), 100) : 0

        return { creditsUsed: used, creditsTotal: total, usagePercent: percent }
    }, [billingData])

    if (isLoading) {
        return (
            <Card variant='outlined' sx={{ padding: '1rem', display: 'flex', justifyContent: 'center' }}>
                <CircularProgress color='primary' size={24} />
            </Card>
        )
    }

    if (isError) {
        return (
            <Card variant='outlined' sx={{ padding: '1rem' }}>
                <Typography color='error'>Failed to load billing info</Typography>
            </Card>
        )
    }

    const planName = billingData?.currentPlan?.name || 'Free'
    const planStatus = billingData?.currentPlan?.status || 'inactive'
    const billingEnd = billingData?.billingPeriod?.end ? new Date(billingData.billingPeriod.end).toLocaleDateString() : null

    return (
        <Card variant='outlined' sx={{ padding: '1rem' }}>
            <Box display='flex' justifyContent='space-between' alignItems='center' padding='16px'>
                <Box display='flex' alignItems='center' gap={1}>
                    <Typography variant='h6'>Plan</Typography>
                    <Chip
                        label={planName}
                        size='small'
                        color={planName === 'Pro' ? 'primary' : 'default'}
                        variant={planStatus === 'active' ? 'filled' : 'outlined'}
                    />
                </Box>
                <Button component={NextLink} href='/billing' variant='outlined' size='small'>
                    View Details
                </Button>
            </Box>
            <CardContent>
                <Divider />

                <Box sx={{ mt: 2 }}>
                    <Box display='flex' justifyContent='space-between' alignItems='center' mb={0.5}>
                        <Typography variant='body2' color='text.secondary'>
                            Credits Used
                        </Typography>
                        <Typography variant='body2'>
                            {creditsUsed.toLocaleString()} / {creditsTotal.toLocaleString()}
                        </Typography>
                    </Box>
                    <LinearProgress
                        variant='determinate'
                        value={usagePercent}
                        sx={{ height: 8, borderRadius: 4 }}
                        color={usagePercent > 90 ? 'error' : usagePercent > 70 ? 'warning' : 'primary'}
                    />
                </Box>

                {billingEnd && (
                    <Typography variant='body2' color='text.secondary' sx={{ mt: 2 }}>
                        Billing period ends: {billingEnd}
                    </Typography>
                )}
            </CardContent>
        </Card>
    )
}
