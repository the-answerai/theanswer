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
    UsageStats,
    SubscriptionWithUsage
} from './types'
import { LangfuseProvider } from '../langfuse/LangfuseProvider'
import { StripeProvider } from '../stripe/StripeProvider'
import { log } from '../config'
import type Stripe from 'stripe'

export class BillingService implements BillingProvider {
    private usageProvider: LangfuseProvider
    private paymentProvider: StripeProvider

    constructor(stripeProvider: StripeProvider, langfuseProvider: LangfuseProvider) {
        this.paymentProvider = stripeProvider
        this.usageProvider = langfuseProvider
    }

    // Payment and subscription methods delegated to Stripe
    async listSubscriptions(params: Stripe.SubscriptionListParams): Promise<Stripe.Response<Stripe.ApiList<Stripe.Subscription>>> {
        return this.paymentProvider.listSubscriptions(params)
    }

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
        return this.paymentProvider.getUsageStats(customerId)
    }

    async getSubscriptionWithUsage(subscriptionId: string): Promise<SubscriptionWithUsage> {
        try {
            log.info('Getting subscription with usage', { subscriptionId })
            const subscriptions = await this.paymentProvider.listSubscriptions({
                customer: subscriptionId,
                status: 'active',
                limit: 1
            })
            const subscription = subscriptions.data[0]

            // If no active subscription found, return a default response
            if (!subscription) {
                log.info('No active subscription found', { subscriptionId })
                return {
                    id: '',
                    customerId: subscriptionId || '',
                    status: 'unpaid',
                    currentPeriodStart: new Date(),
                    currentPeriodEnd: new Date(),
                    cancelAtPeriodEnd: false,
                    usage: [] // Ensure usage is always present
                }
            }

            // Get usage for current month
            const now = new Date()
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
            const startTime = Math.floor(startOfMonth.getTime() / 1000)
            const endTime = Math.floor(now.getTime() / 1000)

            // Get usage stats which includes meter summaries
            const usageStats = await this.paymentProvider.getUsageStats(subscription.customer as string)

            // Map summaries to include meter_name
            const usage = usageStats.raw.summaries.data.map((summary) => ({
                ...summary,
                meter_name: summary.meter === process.env.STRIPE_SPARKS_METER_ID ? 'sparks' : 'unknown'
            }))

            return {
                id: subscription.id,
                customerId: subscription.customer as string,
                status: subscription.status as Subscription['status'],
                currentPeriodStart: new Date(subscription.current_period_start * 1000),
                currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                cancelAtPeriodEnd: subscription.cancel_at_period_end,
                usage // Now properly typed with meter_name
            }
        } catch (error: any) {
            log.error('Failed to get subscription with usage', {
                error: error.message,
                subscriptionId,
                stack: error.stack
            })
            // Return a default response with empty usage array
            return {
                id: '',
                customerId: subscriptionId || '',
                status: 'unpaid',
                currentPeriodStart: new Date(),
                currentPeriodEnd: new Date(),
                cancelAtPeriodEnd: false,
                usage: [] // Ensure usage is always present
            }
        }
    }

    async handleWebhook(payload: any, signature: string): Promise<any> {
        return this.paymentProvider.handleWebhook(payload, signature)
    }

    async syncUsageToStripe(traceId?: string): Promise<{
        processedTraces: string[]
        failedTraces: Array<{ traceId: string; error: string }>
        skippedTraces: Array<{ traceId: string; reason: string }>
        meterEvents: any[]
    }> {
        let result: any = {
            meterEvents: [],
            processedTraces: [],
            failedTraces: [],
            skippedTraces: []
        }
        const startTime = Date.now()
        try {
            // Get usage data from Langfuse
            const langfuseStartTime = Date.now()
            result = await this.usageProvider.syncUsageToStripe(traceId)
            const langfuseTime = Date.now() - langfuseStartTime
            log.info('Langfuse sync completed', { durationMs: langfuseTime, traceId })

            // Sync to Stripe if needed
            if (result.sparksData && result.sparksData.length > 0) {
                const stripeStartTime = Date.now()
                const stripeResult = await this.paymentProvider.syncUsageToStripe(result.sparksData)
                const stripeTime = Date.now() - stripeStartTime
                log.info('Stripe sync completed', { durationMs: stripeTime, traceId })

                // Update with successful traces and meter events from Stripe
                result.processedTraces = stripeResult.processedTraces
                result.meterEvents = stripeResult.meterEvents

                // Add any failed events from Stripe to the failed traces
                if (stripeResult.failedEvents && stripeResult.failedEvents.length > 0) {
                    result.failedTraces.push(...stripeResult.failedEvents)
                }
            }

            const totalTime = Date.now() - startTime
            log.info('Total sync completed', {
                durationMs: totalTime,
                traceId,
                processedCount: result.processedTraces.length,
                failedCount: result.failedTraces.length,
                skippedCount: result.skippedTraces.length,
                meterEventsCount: result.meterEvents.length,
                skippedTraces: result.skippedTraces
            })
            return result
        } catch (error: any) {
            const totalTime = Date.now() - startTime
            log.error('Failed to sync usage to Stripe', { error, traceId, durationMs: totalTime })
            return {
                ...result,
                processedTraces: [],
                failedTraces: [{ traceId: traceId || 'unknown', error: error.message }],
                skippedTraces: result.skippedTraces || [],
                meterEvents: []
            }
        }
    }
}
