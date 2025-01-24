import {
    BillingProvider,
    CreateCustomerParams,
    AttachPaymentMethodParams,
    CreateCheckoutSessionParams,
    CreateBillingPortalSessionParams,
    UpdateSubscriptionParams,
    GetUpcomingInvoiceParams,
    BillingCustomer,
    PaymentMethod,
    CheckoutSession,
    BillingPortalSession,
    Subscription,
    Invoice,
    UsageStats
} from './types'
import { LangfuseProvider } from '../langfuse/LangfuseProvider'
import { StripeProvider } from '../stripe/StripeProvider'
import { log } from '../config'

export class BillingService {
    private usageProvider: LangfuseProvider
    private paymentProvider: StripeProvider

    constructor(stripeProvider: StripeProvider, langfuseProvider: LangfuseProvider) {
        this.paymentProvider = stripeProvider
        this.usageProvider = langfuseProvider
    }

    // Payment and subscription methods delegated to Stripe
    async createCustomer(params: CreateCustomerParams): Promise<BillingCustomer> {
        return this.paymentProvider.createCustomer(params)
    }

    async attachPaymentMethod(params: AttachPaymentMethodParams): Promise<PaymentMethod> {
        return this.paymentProvider.attachPaymentMethod(params)
    }

    async createCheckoutSession(params: CreateCheckoutSessionParams): Promise<CheckoutSession> {
        return this.paymentProvider.createCheckoutSession(params)
    }

    async createBillingPortalSession(params: CreateBillingPortalSessionParams): Promise<BillingPortalSession> {
        return this.paymentProvider.createBillingPortalSession(params)
    }

    async updateSubscription(params: UpdateSubscriptionParams): Promise<Subscription> {
        return this.paymentProvider.updateSubscription(params)
    }

    async cancelSubscription(subscriptionId: string): Promise<Subscription> {
        return this.paymentProvider.cancelSubscription(subscriptionId)
    }

    async getUpcomingInvoice(params: GetUpcomingInvoiceParams): Promise<Invoice> {
        return this.paymentProvider.getUpcomingInvoice(params)
    }

    // Usage tracking methods using Langfuse
    async getUsageStats(customerId: string): Promise<UsageStats> {
        try {
            const usageStats = await this.usageProvider.getUsageStats(customerId)
            return usageStats
        } catch (error) {
            log.error('Failed to get usage stats', { error, customerId })
            throw error
        }
    }

    async syncUsageToStripe(traceId?: string): Promise<{
        processedTraces: string[]
        failedTraces: Array<{ traceId: string; error: string }>
    }> {
        let result: any
        try {
            // Get usage data from Langfuse
            result = await this.usageProvider.syncUsageToStripe(traceId)

            // Sync to Stripe if needed
            if (result.sparksData && result.sparksData.length > 0) {
                const meterEvents = await this.paymentProvider.syncUsageToStripe(result.sparksData)
                result.meterEvents = meterEvents
            }

            return result
        } catch (error: any) {
            log.error('Failed to sync usage to Stripe', { error, traceId })
            return {
                ...result,
                processedTraces: [],
                failedTraces: [{ traceId: traceId || 'unknown', error: error.message }]
            }
        }
    }
}
