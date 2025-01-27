declare module '@/api/billing' {
    interface BillingApi {
        getUsageStats: () => Promise<{
            data: {
                total_sparks: number
                usageByMeter: {
                    [key: string]: number
                }
                dailyUsageByMeter: {
                    [key: string]: Array<{
                        date: string
                        value: number
                    }>
                }
                billingPeriod: {
                    start: string
                    end: string
                }
                lastUpdated: string
            }
        }>
        getSubscriptions: () => Promise<{
            data: {
                id: string
                object: string
                status: string
                currency: string
                collection_method: string
                current_period_end: number
                current_period_start: number
                customer: string
                customerId: string
                trial_end: number | null
                trial_start: number | null
                trial_settings: {
                    end_behavior: {
                        missing_payment_method: string
                    }
                }
                default_payment_method: string | null
                items: {
                    data: Array<{
                        id: string
                        plan: {
                            id: string
                            nickname: string
                            product: string
                            usage_type: string
                            billing_scheme: string
                            tiers_mode: string
                            currency: string
                            interval: string
                            interval_count: number
                            metadata: Record<string, any>
                        }
                        price: {
                            recurring: {
                                interval: string
                                interval_count: number
                                usage_type: string
                                aggregate_usage: string | null
                            }
                            nickname: string
                            billing_scheme: string
                            tiers_mode: string
                        }
                    }>
                }
                currentPeriodStart: string
                currentPeriodEnd: string
                cancelAtPeriodEnd: boolean
                usage: Array<{
                    id: string
                    object: string
                    aggregated_value: number
                    end_time: number
                    start_time: number
                    meter: string
                    meter_name: string
                }>
            }
        }>
    }

    const billingApi: BillingApi
    export default billingApi
}
