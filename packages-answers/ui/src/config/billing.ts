export const BILLING_CONFIG = {
    SPARK_TO_USD: 0.001, // 1 Spark = $0.001 USD

    RATES: {
        AI_TOKENS: {
            UNIT: 1000,
            SPARKS: 100,
            COST: 0.1
        },
        COMPUTE: {
            UNIT: 1, // minutes
            SPARKS: 50,
            COST: 0.05
        },
        STORAGE: {
            UNIT: 1, // GB per month
            SPARKS: 500,
            COST: 0.5
        }
    },

    RATE_DESCRIPTIONS: {
        AI_TOKENS: 'Usage from AI model token consumption (1,000 tokens = 100 Sparks)',
        COMPUTE: 'Usage from processing time and compute resources (1 minute = 50 Sparks)',
        STORAGE: 'Usage from data storage and persistence (1 GB/month = 500 Sparks)'
    }
}

export const STRIPE_PRICE_IDS = {
    FREE: 'price_free',
    STANDARD: 'price_standard',
    ENTERPRISE: 'price_enterprise'
} as const

export type PricingTierName = 'Free' | 'Standard' | 'Enterprise'

export interface BillingPlan {
    id: string
    name: PricingTierName
    priceId: string
    description: string
    features: string[]
    sparksIncluded: number
    pricePerMonth: number
    highlighted?: boolean
}
