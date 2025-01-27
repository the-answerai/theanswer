'use client'

import React, { useEffect, useState } from 'react'
import { Box, Stack, Typography, Card } from '@mui/material'
import BillingOverview from './BillingOverview'
import UsageStats from './UsageStats'
import { BillingPlan } from '@/config/billing'
import billingApi from '@/api/billing'

interface BillingInfo {
    currentPlan: BillingPlan
    billingPeriod: {
        start: string
        end: string
    }
    nextBillingDate: string
    status: 'active' | 'inactive' | 'past_due'
}

const BillingDashboard: React.FC = () => {
    const [billingInfo, setBillingInfo] = useState<BillingInfo>()
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchBillingInfo = async () => {
            try {
                // Get active subscription info
                const subscription = await billingApi.getSubscriptions()
                const activeSubscription = subscription.data.data[0]

                if (activeSubscription) {
                    setBillingInfo({
                        currentPlan: {
                            name: activeSubscription.data.items.data[0].plan.name,
                            sparksIncluded: activeSubscription.plan.metadata.sparks_included
                        },
                        billingPeriod: {
                            start: activeSubscription.current_period_start,
                            end: activeSubscription.current_period_end
                        },
                        nextBillingDate: activeSubscription.current_period_end,
                        status: activeSubscription.status
                    })
                }
            } catch (error) {
                console.error('Failed to fetch billing info:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchBillingInfo()
    }, [])

    if (loading) {
        return null // Or a loading spinner
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
                        <BillingOverview
                            currentPlan={billingInfo?.currentPlan}
                            billingPeriod={billingInfo?.billingPeriod}
                            nextBillingDate={billingInfo?.nextBillingDate}
                            status={billingInfo?.status}
                        />
                        <UsageStats currentPlan={billingInfo?.currentPlan} />
                    </Stack>
                </Card>
            </Stack>
        </Box>
    )
}

export default BillingDashboard
