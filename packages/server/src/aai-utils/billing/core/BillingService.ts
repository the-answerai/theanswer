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
    async getUsageStats(customerId: string): Promise<UsageStats & any> {
        try {
            // Get meter event summaries from Stripe
            const summaries = await this.paymentProvider.getMeterEventSummaries(customerId)

            // Get active subscription if exists
            const subscriptions = await this.paymentProvider.listSubscriptions({ customer: customerId, status: 'active', limit: 1 })
            const subscription = subscriptions.data[0]

            // Group summaries by meter
            const meterUsage = summaries.data.reduce((acc, summary) => {
                const meterKey = summary.meter_name || summary.meter
                if (!acc[meterKey]) {
                    acc[meterKey] = {
                        total: 0,
                        daily: []
                    }
                }
                acc[meterKey].total += summary.aggregated_value || 0
                acc[meterKey].daily.push({
                    date: new Date(summary.start_time * 1000),
                    value: summary.aggregated_value || 0
                })
                return acc
            }, {} as Record<string, { total: number; daily: Array<{ date: Date; value: number }> }>)

            // Calculate total sparks across all meters
            const total_sparks = Object.values(meterUsage).reduce((acc, meter) => acc + meter.total, 0)

            // Get usage breakdown by meter
            const usageByMeter = Object.entries(meterUsage).reduce((acc, [meterKey, data]) => {
                acc[meterKey] = data.total
                return acc
            }, {} as Record<string, number>)

            // Get daily usage for each meter
            const dailyUsageByMeter = Object.entries(meterUsage).reduce((acc, [meterKey, data]) => {
                acc[meterKey] = data.daily.sort((a, b) => a.date.getTime() - b.date.getTime())
                return acc
            }, {} as Record<string, Array<{ date: Date; value: number }>>)

            return {
                total_sparks,
                usageByMeter,
                dailyUsageByMeter,
                billingPeriod: subscription
                    ? {
                          start: new Date(subscription.current_period_start * 1000),
                          end: new Date(subscription.current_period_end * 1000)
                      }
                    : undefined,
                lastUpdated: new Date(),
                raw: {
                    subscription,
                    summaries,
                    meterUsage
                }
            }
        } catch (error) {
            log.error('Failed to get usage stats', { error, customerId })
            throw error
        }
    }

    async getSubscriptionWithUsage(subscriptionId?: string): Promise<SubscriptionWithUsage> {
        try {
            const result = await this.paymentProvider.getSubscriptionWithUsage(subscriptionId)
            // Ensure usage is always defined, even if empty
            return {
                ...result,
                usage: result.usage || []
            }
        } catch (error: any) {
            log.error('Failed to get subscription with usage in BillingService', {
                error: error.message,
                subscriptionId,
                stack: error.stack
            })
            // Return a default response with empty usage
            return {
                id: '',
                customerId: subscriptionId || '',
                status: 'incomplete',
                currentPeriodStart: new Date(),
                currentPeriodEnd: new Date(),
                cancelAtPeriodEnd: false,
                usage: []
            }
        }
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
