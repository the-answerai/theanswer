import type Stripe from 'stripe'

export interface BillingCustomer {
    id: string
    email?: string
    name?: string
    metadata?: Record<string, any>
}

export interface PaymentMethod {
    id: string
    type: string
    last4?: string
    expMonth?: number
    expYear?: number
}

export interface Subscription {
    id: string
    customerId: string
    status: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'incomplete_expired' | 'trialing' | 'unpaid'
    currentPeriodStart: Date
    currentPeriodEnd: Date
    cancelAtPeriodEnd: boolean
}

export interface UsageMetric {
    used: number
    total: number
    sparks: number
    cost: number
    rate: number
}

export interface UsageStats {
    ai_tokens: UsageMetric
    compute: UsageMetric
    storage: UsageMetric
    total_sparks: number
    total_cost: number
    billing_period: {
        start: string
        end: string
    }
    upcomingInvoice?: Stripe.Response<Stripe.UpcomingInvoice>
    sparksSummary?: Array<{
        id: string
        aggregated_value: number
        meter: string
        start_time: number
        end_time: number
        payload?: any
    }>
}

export interface BillingPortalSession {
    url: string
    returnUrl: string
}

export interface CheckoutSession {
    url: string
}

export interface Invoice {
    id: string
    customerId: string
    amount: number
    currency: string
    status: string
    created: Date
    dueDate?: Date
}

export interface BillingProvider {
    createCustomer(params: CreateCustomerParams): Promise<BillingCustomer>
    attachPaymentMethod(params: AttachPaymentMethodParams): Promise<PaymentMethod>
    createCheckoutSession(params: CreateCheckoutSessionParams): Promise<CheckoutSession>
    createBillingPortalSession(params: CreateBillingPortalSessionParams): Promise<BillingPortalSession>
    updateSubscription(params: UpdateSubscriptionParams): Promise<Subscription>
    cancelSubscription(subscriptionId: string): Promise<Subscription>
    getUpcomingInvoice(params: GetUpcomingInvoiceParams): Promise<Invoice>
    getUsageStats(customerId: string): Promise<UsageStats>
    syncUsageToStripe(traceId?: string): Promise<{ processedTraces: string[]; failedTraces: Array<{ traceId: string; error: string }> }>
}

export interface CreateCustomerParams {
    email: string
    name?: string
    metadata?: Record<string, any>
}

export interface AttachPaymentMethodParams {
    customerId: string
    paymentMethodId: string
}

export interface CreateCheckoutSessionParams {
    customerId: string
    priceId: string
    successUrl: string
    cancelUrl: string
}

export interface CreateBillingPortalSessionParams {
    customerId: string
    returnUrl: string
}

export interface UpdateSubscriptionParams {
    subscriptionId: string
    priceId: string
}

export interface GetUpcomingInvoiceParams {
    customerId: string
    subscriptionId?: string
    priceId?: string
}

export interface SparksData {
    traceId: string
    customerId: string
    subscriptionTier: string
    sparks: {
        ai_tokens: number
        compute: number
        storage: number
        cost: number
        total: number
    }
    metadata: Record<string, any>
    usage: {
        tokens: number
        computeMinutes: number
        storageGB: number
        totalCost: number
        models: Array<{
            model: string
            inputTokens: number
            outputTokens: number
            totalTokens: number
            costUSD: number
        }>
    }
}

export interface LangfuseTrace {
    id: string
    timestamp: string
    htmlPath: string
    latency: number
    totalCost: number
    observations: Array<{
        id: string
        model?: string
        usage?: {
            input?: number
            output?: number
            total?: number
        }
        calculatedTotalCost?: number
    }>
    metadata?: TraceMetadata
}

export interface TraceMetadata {
    customerId?: string
    subscriptionTier?: string
    [key: string]: any
}

export const SPARK_RATES = {
    AI_TOKENS: {
        TOKENS_PER_SPARK: 10,
        COST_PER_SPARK: 0.001
    },
    COMPUTE: {
        MINUTES_PER_SPARK: 1 / 50,
        COST_PER_SPARK: 0.001
    },
    STORAGE: {
        GB_PER_SPARK: 1 / 500,
        COST_PER_SPARK: 0.001
    }
}
