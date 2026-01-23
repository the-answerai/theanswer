import { useCallback } from 'react'
import { Plan } from 'types'
import useSWR from 'swr'
import plansApi from '@/api/plans'

// Flowise plan data structure (from /api/v1/plan)
interface FlowisePlan {
    id: string
    availableExecutions: number
    usedExecutions: number
    type?: 'Free Trial' | 'Paid'
    createdDate?: string
}

// Adapted structure for UI compatibility
interface ActiveUserPlan {
    planId?: number
    tokensLeft: number
    gpt3RequestCount: number
    gpt4RequestCount: number
    renewalDate?: Date
    shouldRenew: boolean
    plan: {
        name: string
    }
}

const fetcher = () =>
    plansApi
        .getCurrentPlan()
        .then((res) => {
            const data = res.data as FlowisePlan
            if (!data) return null
            // Adapt Flowise plan to UI structure
            return {
                planId: undefined,
                tokensLeft: data.availableExecutions - data.usedExecutions,
                gpt3RequestCount: data.usedExecutions,
                gpt4RequestCount: 0,
                renewalDate: data.createdDate ? new Date(data.createdDate) : undefined,
                shouldRenew: false,
                plan: {
                    name: data.type || 'Free Trial'
                }
            }
        })
        .catch(() => null)

export const useUserPlans = () => {
    const { data: activeUserPlan, mutate: mutateActiveUserPlan } = useSWR<ActiveUserPlan | null>('plan', fetcher)

    const handleCancelPlan = useCallback(async (onEnd: Function) => {
        // Cancel not supported in Flowise API currently
        onEnd()
    }, [])

    const isActivePlan = useCallback(
        (plan: Plan) => {
            return activeUserPlan?.planId === plan.id
        },
        [activeUserPlan]
    )

    return {
        activeUserPlan,
        mutateActiveUserPlan,
        handleCancelPlan,
        isActivePlan
    }
}
