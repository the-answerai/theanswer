'use client'

import { Box, Typography } from '@mui/material'
import NextLink from 'next/link'
import { useUserPlans } from './hooks/useUserPlan'

export const RemainingTokensCounter: React.FC = () => {
    const { activeUserPlan } = useUserPlans()
    const planTokenLimit = activeUserPlan?.plan?.tokenLimit
    const planName = activeUserPlan?.plan?.name?.toLowerCase() ?? ''
    const isUnlimitedPlan =
        planTokenLimit === undefined ||
        planTokenLimit === null ||
        planTokenLimit <= 0 ||
        Number.isNaN(planTokenLimit) ||
        planName.includes('unlimited')

    const remainingTokens = isUnlimitedPlan ? Infinity : activeUserPlan?.tokensLeft ?? 0
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography>
                {!activeUserPlan ? (
                    'Calculating remaining tokens...'
                ) : remainingTokens <= 0 ? (
                    <>
                        You are out of tokens on the {activeUserPlan?.plan.name} plan. Your plan will renew with{' '}
                        {activeUserPlan?.plan.tokenLimit?.toLocaleString()} tokens on {activeUserPlan?.renewalDate?.toLocaleDateString()}.
                        {activeUserPlan?.planId < 3 && (
                            <>
                                {' '}
                                Click <NextLink href='/plans'>here</NextLink> to upgrade.
                            </>
                        )}
                    </>
                ) : (
                    <>Tokens remaining: {isUnlimitedPlan ? 'unlimited' : remainingTokens}</>
                )}
            </Typography>
        </Box>
    )
}
