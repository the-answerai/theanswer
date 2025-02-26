'use client'

import React from 'react'
import { Box, Stack, Typography, Card, CircularProgress } from '@mui/material'
import BillingOverview from './BillingOverview'
import UsageStats from './UsageStats'
import TotalCreditsProgress from './TotalCreditsProgress'
import { useBillingData } from './hooks/useBillingData'

const BillingDashboard: React.FC = () => {
    const { billingData, isLoading, isError } = useBillingData()

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        )
    }

    if (isError) {
        return (
            <Box sx={{ p: 3, color: 'error.main' }}>
                <Typography>Failed to load billing information. Please try again later.</Typography>
            </Box>
        )
    }

    return (
        <Box sx={{ p: 3 }}>
            <Stack spacing={4}>
                <Box>
                    <Typography variant='h4' sx={{ fontWeight: 600, color: '#fff', mb: 1 }}>
                        Billing Overview
                    </Typography>
                    <Typography sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.875rem' }}>
                        Manage your subscription and monitor your usage
                    </Typography>
                </Box>

                <TotalCreditsProgress usageSummary={billingData} isLoading={isLoading} isError={isError} />

                <Card
                    elevation={0}
                    sx={{
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        bgcolor: 'rgba(0, 0, 0, 0.2)',
                        backdropFilter: 'blur(20px)',
                        overflow: 'hidden'
                    }}
                >
                    <Stack spacing={0} divider={<Box sx={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }} />}>
                        <BillingOverview currentPlan={billingData?.currentPlan} billingPeriod={billingData?.billingPeriod} />
                        <UsageStats usageSummary={billingData} />
                    </Stack>
                </Card>
            </Stack>
        </Box>
    )
}

export default BillingDashboard
