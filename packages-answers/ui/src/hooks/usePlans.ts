import { Plan } from 'types'
import useSWR from 'swr'
import type { Stripe } from 'stripe'
import pricingApi from '@/api/pricing'

// Flowise pricing plan structure
interface FlowisePricingPlan {
    prodId?: string
    title: string
    subtitle?: string
    price: string
    period?: string
    mostPopular?: boolean
    features: Array<{ text: string; subtext?: string }>
}

const fetcher = () =>
    pricingApi
        .getPricingPlans()
        .then((res) => {
            const data = res.data as FlowisePricingPlan[]
            if (!Array.isArray(data)) return []
            // Adapt Flowise pricing to expected structure
            return data.map((plan, index) => ({
                id: index + 1,
                name: plan.title,
                description: plan.subtitle || '',
                tokenLimit: 0,
                priceObj: {
                    unit_amount: parseInt(plan.price.replace(/[^0-9]/g, '') || '0') * 100
                } as Stripe.Price
            }))
        })
        .catch(() => [])

export const usePlans = () => {
    const { data: plans } = useSWR<PlanWithPriceObject[]>('pricing', fetcher)

    return {
        plans
    }
}

export interface PlanWithPriceObject extends Plan {
    priceObj?: Stripe.Price
}
