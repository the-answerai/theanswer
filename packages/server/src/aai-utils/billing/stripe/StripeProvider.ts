import type Stripe from 'stripe'
import {
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
    SparksData
} from '../core/types'
import { log, DEFAULT_CUSTOMER_ID, BILLING_CONFIG } from '../config'
import { langfuse } from '../config'

export class StripeProvider {
    constructor(private stripeClient: Stripe) {}

    async getInvoices(params: Stripe.InvoiceListParams): Promise<Stripe.Response<Stripe.ApiList<Stripe.Invoice>>> {
        log.info('Getting invoices', { params })
        const invoices = await this.stripeClient.invoices.list(params)
        log.info('Retrieved invoices', { count: invoices.data.length })
        return invoices
    }

    async listSubscriptions(params: Stripe.SubscriptionListParams): Promise<Stripe.Response<Stripe.ApiList<Stripe.Subscription>>> {
        log.info('Listing subscriptions', { params })
        const subscriptions = await this.stripeClient.subscriptions.list(params)
        log.info('Retrieved subscriptions', { count: subscriptions.data.length })
        return subscriptions
    }

    async createCustomer(params: CreateCustomerParams): Promise<BillingCustomer> {
        try {
            log.info('Creating customer', { params })
            const customer = await this.stripeClient.customers.create({
                email: params.email,
                name: params.name,
                metadata: params.metadata
            })
            log.info('Created customer', { customerId: customer.id })
            return {
                id: customer.id,
                email: customer.email || undefined,
                name: customer.name || undefined,
                metadata: customer.metadata
            }
        } catch (error: any) {
            log.error('Failed to create customer', { error: error.message, params })
            throw error
        }
    }

    async attachPaymentMethod(params: AttachPaymentMethodParams): Promise<PaymentMethod> {
        try {
            log.info('Attaching payment method', { params })
            const paymentMethod = await this.stripeClient.paymentMethods.attach(params.paymentMethodId, {
                customer: params.customerId
            })

            // Set as default payment method
            log.info('Setting default payment method', {
                customerId: params.customerId,
                paymentMethodId: params.paymentMethodId
            })
            await this.stripeClient.customers.update(params.customerId, {
                invoice_settings: {
                    default_payment_method: params.paymentMethodId
                }
            })

            log.info('Successfully attached payment method', {
                paymentMethodId: paymentMethod.id,
                customerId: params.customerId
            })
            return {
                id: paymentMethod.id,
                type: paymentMethod.type,
                last4: paymentMethod.card?.last4,
                expMonth: paymentMethod.card?.exp_month,
                expYear: paymentMethod.card?.exp_year
            }
        } catch (error: any) {
            log.error('Failed to attach payment method', { error: error.message, params })
            throw error
        }
    }

    async createCheckoutSession(params: CreateCheckoutSessionParams): Promise<CheckoutSession> {
        try {
            log.info('Creating checkout session', { params })
            const session = await this.stripeClient.checkout.sessions.create({
                mode: 'subscription',
                payment_method_types: ['card'],
                line_items: [
                    {
                        price: params.priceId
                    }
                ],
                success_url: params.successUrl,
                cancel_url: params.cancelUrl,
                customer: params.customerId
            })
            log.info('Created checkout session', { sessionId: session.id })
            if (!session.url) {
                throw new Error('Checkout session URL is required but was not provided')
            }
            return {
                url: session.url
            }
        } catch (error: any) {
            log.error('Failed to create checkout session', { error: error.message, params })
            throw error
        }
    }

    async createBillingPortalSession(params: CreateBillingPortalSessionParams): Promise<BillingPortalSession> {
        try {
            log.info('Creating billing portal session', { params })
            const session = await this.stripeClient.billingPortal.sessions.create({
                customer: params.customerId,
                return_url: params.returnUrl
            })
            log.info('Created billing portal session', { sessionId: session.id })
            if (!session.url) {
                throw new Error('Billing portal session URL is required but was not provided')
            }
            return {
                url: session.url,
                returnUrl: params.returnUrl
            }
        } catch (error: any) {
            log.error('Failed to create billing portal session', { error: error.message, params })
            throw error
        }
    }

    async updateSubscription(params: UpdateSubscriptionParams): Promise<Subscription> {
        try {
            log.info('Updating subscription', { params })
            const subscription = await this.stripeClient.subscriptions.retrieve(params.subscriptionId)

            const updatedSubscription = await this.stripeClient.subscriptions.update(params.subscriptionId, {
                items: [
                    {
                        id: subscription.items.data[0].id,
                        price: params.priceId
                    }
                ],
                proration_behavior: 'create_prorations'
            })

            log.info('Updated subscription', { subscriptionId: updatedSubscription.id })
            return {
                id: updatedSubscription.id,
                customerId: updatedSubscription.customer as string,
                status: updatedSubscription.status as Subscription['status'],
                currentPeriodStart: new Date(updatedSubscription.current_period_start * 1000),
                currentPeriodEnd: new Date(updatedSubscription.current_period_end * 1000),
                cancelAtPeriodEnd: updatedSubscription.cancel_at_period_end
            }
        } catch (error: any) {
            log.error('Failed to update subscription', { error: error.message, params })
            throw error
        }
    }

    async cancelSubscription(subscriptionId: string): Promise<Subscription> {
        try {
            log.info('Canceling subscription', { subscriptionId })
            const subscription = await this.stripeClient.subscriptions.cancel(subscriptionId)
            log.info('Canceled subscription', { subscriptionId })
            return {
                id: subscription.id,
                customerId: subscription.customer as string,
                status: subscription.status as Subscription['status'],
                currentPeriodStart: new Date(subscription.current_period_start * 1000),
                currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                cancelAtPeriodEnd: subscription.cancel_at_period_end
            }
        } catch (error: any) {
            log.error('Failed to cancel subscription', { error: error.message, subscriptionId })
            throw error
        }
    }

    async getUpcomingInvoice(params: GetUpcomingInvoiceParams): Promise<Invoice> {
        try {
            log.info('Getting upcoming invoice', { params })

            const invoiceParams: Stripe.InvoiceRetrieveUpcomingParams = {
                customer: params.customerId
            }

            if (params.subscriptionId) {
                invoiceParams.subscription = params.subscriptionId
            }

            if (params.priceId && params.subscriptionId) {
                const subscription = await this.stripeClient.subscriptions.retrieve(params.subscriptionId)
                invoiceParams.subscription_items = [
                    {
                        id: subscription.items.data[0].id,
                        price: params.priceId
                    }
                ]
            }

            const invoice = await this.stripeClient.invoices.retrieveUpcoming(invoiceParams)
            log.info('Retrieved upcoming invoice', { invoice })
            const customerId = invoice.customer as string
            if (!customerId) {
                throw new Error('Customer ID is required but was not provided')
            }
            return {
                id: `upcoming_${customerId}`,
                customerId,
                amount: invoice.total,
                currency: invoice.currency,
                status: invoice.status || 'draft',
                created: new Date(invoice.created * 1000),
                dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : undefined
            }
        } catch (error: any) {
            log.error('Failed to get upcoming invoice', { error: error.message, params })
            throw error
        }
    }

    async syncUsageToStripe(sparksData: Array<SparksData & { fullTrace: any }>): Promise<{
        meterEvents: Stripe.Billing.MeterEvent[]
        failedEvents: Array<{ traceId: string; error: string }>
        processedTraces: string[]
    }> {
        try {
            log.info('Syncing usage to Stripe', { count: sparksData.length })

            // Parallel fetch meters and prepare events
            const [meters] = await Promise.all([this.stripeClient.billing.meters.list()])

            const metersMap = new Map(meters.data.map((meter) => [meter.display_name || meter.id, meter.id]))

            const BATCH_SIZE = 15
            const DELAY_BETWEEN_BATCHES = 1000
            const meterEvents: Stripe.Billing.MeterEvent[] = []
            const failedEvents: Array<{ traceId: string; error: string }> = []
            const processedTraces: string[] = []

            // Process in optimized batches
            for (let i = 0; i < sparksData.length; i += BATCH_SIZE) {
                const batch = sparksData.slice(i, i + BATCH_SIZE)
                const batchStartTime = Date.now()

                const batchResults = await Promise.allSettled(
                    batch.map(async (data) => {
                        const timestamp = data.timestampEpoch || Math.floor(new Date(data.metadata.timestamp).getTime() / 1000)
                        const totalSparks = Object.values(data.sparks).reduce((sum, val) => sum + val, 0)
                        const totalSparksWithMargin = Math.floor(totalSparks * BILLING_CONFIG.MARGIN_MULTIPLIER)
                        const meterId = metersMap.get('sparks')

                        if (!meterId) {
                            throw new Error('No meter found for type: sparks')
                        }

                        try {
                            const result = await this.stripeClient.billing.meterEvents.create({
                                event_name: 'sparks',
                                identifier:
                                    process.env.NODE_ENV === 'production'
                                        ? `${data.traceId}_sparks`
                                        : `${data.traceId}_sparks_${Date.now()}`,
                                timestamp,
                                payload: {
                                    value: totalSparksWithMargin.toString(),
                                    stripe_customer_id: data.stripeCustomerId,
                                    trace_id: data.traceId,
                                    ai_tokens_sparks: (data.sparks.ai_tokens * BILLING_CONFIG.MARGIN_MULTIPLIER).toString(),
                                    compute_sparks: (data.sparks.compute * BILLING_CONFIG.MARGIN_MULTIPLIER).toString(),
                                    storage_sparks: (data.sparks.storage * BILLING_CONFIG.MARGIN_MULTIPLIER).toString(),
                                    ai_tokens_cost: (data.costs.base.ai * BILLING_CONFIG.MARGIN_MULTIPLIER).toFixed(6),
                                    compute_cost: (data.costs.base.compute * BILLING_CONFIG.MARGIN_MULTIPLIER).toFixed(6),
                                    storage_cost: (data.costs.base.storage * BILLING_CONFIG.MARGIN_MULTIPLIER).toFixed(6),
                                    // margin: BILLING_CONFIG.MARGIN_MULTIPLIER.toString(),
                                    total_cost_with_margin: (
                                        (data.costs.base.ai + data.costs.base.compute + data.costs.base.storage) *
                                        BILLING_CONFIG.MARGIN_MULTIPLIER
                                    ).toFixed(6)
                                }
                            })

                            console.log('Data', data)
                            // Update trace metadata to mark as processed
                            const updatedTrace = await langfuse.trace({
                                id: data.traceId,
                                timestamp: data.fullTrace?.timestamp,
                                metadata: {
                                    ...data.fullTrace?.metadata,
                                    billing_status: 'processed',
                                    meter_event_id: result.identifier,
                                    billing_details: {
                                        total_sparks: totalSparksWithMargin,
                                        breakdown: {
                                            ai_tokens: {
                                                base_sparks: data.sparks.ai_tokens,
                                                sparks_with_margin: data.sparks.ai_tokens * BILLING_CONFIG.MARGIN_MULTIPLIER,
                                                base_cost: data.costs.base.ai,
                                                cost_with_margin: data.costs.base.ai * BILLING_CONFIG.MARGIN_MULTIPLIER,
                                                rate: data.sparks.ai_tokens > 0 ? data.costs.base.ai / data.sparks.ai_tokens : 0,
                                                percentage: (data.sparks.ai_tokens / totalSparks) * 100
                                            },
                                            compute: {
                                                base_sparks: data.sparks.compute,
                                                sparks_with_margin: data.sparks.compute * BILLING_CONFIG.MARGIN_MULTIPLIER,
                                                base_cost: data.costs.base.compute,
                                                cost_with_margin: data.costs.base.compute * BILLING_CONFIG.MARGIN_MULTIPLIER,
                                                rate: data.sparks.compute > 0 ? data.costs.base.compute / data.sparks.compute : 0,
                                                percentage: (data.sparks.compute / totalSparks) * 100
                                            },
                                            storage: {
                                                base_sparks: data.sparks.storage,
                                                sparks_with_margin: data.sparks.storage * BILLING_CONFIG.MARGIN_MULTIPLIER,
                                                base_cost: data.costs.base.storage,
                                                cost_with_margin: data.costs.base.storage * BILLING_CONFIG.MARGIN_MULTIPLIER,
                                                rate: data.sparks.storage > 0 ? data.costs.base.storage / data.sparks.storage : 0,
                                                percentage: (data.sparks.storage / totalSparks) * 100
                                            }
                                        },
                                        costs: {
                                            total_base_cost: data.costs.base.ai + data.costs.base.compute + data.costs.base.storage,
                                            total_with_margin:
                                                (data.costs.base.ai + data.costs.base.compute + data.costs.base.storage) *
                                                BILLING_CONFIG.MARGIN_MULTIPLIER,
                                            currency: 'USD'
                                        },
                                        billing_config: {
                                            margin_multiplier: BILLING_CONFIG.MARGIN_MULTIPLIER,
                                            environment: process.env.NODE_ENV || 'development',
                                            version: '1.0.0',
                                            meter_id: meterId
                                        },
                                        event: {
                                            customer_id: data.stripeCustomerId,
                                            timestamp: timestamp,
                                            event_name: 'sparks',
                                            meter_identifier: result.identifier,
                                            identifier_production: process.env.NODE_ENV === 'production' ? result.identifier : undefined
                                        },
                                        processing: {
                                            started_at: new Date(batchStartTime).toISOString(),
                                            completed_at: new Date().toISOString(),
                                            duration_ms: Date.now() - batchStartTime,
                                            batch_size: batch.length,
                                            batch_index: Math.floor(i / BATCH_SIZE)
                                        }
                                    }
                                }
                            })

                            console.log('Updated trace', updatedTrace)

                            return { result, traceId: data.traceId }
                        } catch (error: any) {
                            // Check if it's a resource_missing error for the customer
                            if (error.code === 'resource_missing' && error.param === 'payload[stripe_customer_id]') {
                                log.warn('Customer not found, falling back to default customer', {
                                    originalCustomerId: data.stripeCustomerId,
                                    defaultCustomerId: DEFAULT_CUSTOMER_ID
                                })

                                // Retry with default customer ID
                                const result = await this.stripeClient.billing.meterEvents.create({
                                    event_name: 'sparks',
                                    identifier:
                                        process.env.NODE_ENV === 'production'
                                            ? `${data.traceId}_sparks`
                                            : `${data.traceId}_sparks_${Date.now()}`,
                                    timestamp,
                                    payload: {
                                        value: totalSparksWithMargin.toString(),
                                        stripe_customer_id: DEFAULT_CUSTOMER_ID,
                                        trace_id: data.traceId,
                                        ai_tokens_sparks: (data.sparks.ai_tokens * BILLING_CONFIG.MARGIN_MULTIPLIER).toString(),
                                        compute_sparks: (data.sparks.compute * BILLING_CONFIG.MARGIN_MULTIPLIER).toString(),
                                        storage_sparks: (data.sparks.storage * BILLING_CONFIG.MARGIN_MULTIPLIER).toString(),
                                        ai_tokens_cost: (data.costs.base.ai * BILLING_CONFIG.MARGIN_MULTIPLIER).toFixed(6),
                                        compute_cost: (data.costs.base.compute * BILLING_CONFIG.MARGIN_MULTIPLIER).toFixed(6),
                                        storage_cost: (data.costs.base.storage * BILLING_CONFIG.MARGIN_MULTIPLIER).toFixed(6),
                                        // margin: BILLING_CONFIG.MARGIN_MULTIPLIER.toString(),
                                        total_cost_with_margin: (
                                            (data.costs.base.ai + data.costs.base.compute + data.costs.base.storage) *
                                            BILLING_CONFIG.MARGIN_MULTIPLIER
                                        ).toFixed(6)
                                    }
                                })
                                console.log('Result', data)

                                // Update trace metadata to mark as processed
                                const updatedTrace = await langfuse.trace({
                                    id: data.traceId,
                                    timestamp: data.fullTrace?.timestamp,
                                    metadata: {
                                        ...data.fullTrace.metadata,
                                        billing_status: 'processed',
                                        meter_event_id: result.identifier
                                    }
                                })
                                console.log('Updated trace', updatedTrace)

                                return { result, traceId: data.traceId }
                            }
                            throw error
                        }
                    })
                )

                // Process batch results
                batchResults.forEach((result, index) => {
                    if (result.status === 'fulfilled') {
                        meterEvents.push(result.value.result)
                        processedTraces.push(result.value.traceId)
                    } else {
                        const error = result.reason
                        // Only add to failedEvents if it's not a resource_missing error that was handled
                        if (!(error.code === 'resource_missing' && error.param === 'payload[stripe_customer_id]')) {
                            failedEvents.push({
                                traceId: batch[index].traceId,
                                error: error?.message || 'Unknown error during meter event creation'
                            })
                        }
                    }
                })

                log.info('Batch processing complete', {
                    batchSize: batch.length,
                    successCount: meterEvents.length,
                    failedCount: failedEvents.length,
                    processedCount: processedTraces.length,
                    durationMs: Date.now() - batchStartTime
                })

                if (i + BATCH_SIZE < sparksData.length) {
                    await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_BATCHES))
                }
            }

            return { meterEvents, failedEvents, processedTraces }
        } catch (error: any) {
            log.error('Failed to sync usage to Stripe', { error: error.message })
            throw error
        }
    }

    async getMeterEventSummaries(
        customerId: string,
        startTime?: number,
        endTime?: number
    ): Promise<Stripe.Response<Stripe.ApiList<Stripe.Billing.MeterEventSummary & { meter_name: string }>>> {
        try {
            log.info('Getting meter event summaries', { customerId, startTime, endTime })

            // If no time range provided, default to current month
            if (!startTime || !endTime) {
                const now = new Date()
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
                startTime = Math.floor(startOfMonth.getTime() / 1000)
                endTime = Math.floor(now.getTime() / 1000)
            }

            // Align timestamps with daily boundaries (UTC midnight)
            const alignedStartTime = Math.floor(startTime / 86400) * 86400 // Round down to nearest day
            const alignedEndTime = Math.ceil(endTime / 86400) * 86400 // Round up to nearest day

            log.info('Aligned timestamps', {
                originalStart: new Date(startTime * 1000),
                originalEnd: new Date(endTime * 1000),
                alignedStart: new Date(alignedStartTime * 1000),
                alignedEnd: new Date(alignedEndTime * 1000)
            })

            // Get all meters for this customer
            const meters = await this.stripeClient.billing.meters.list()
            const summariesPromises = meters.data.map((meter) =>
                this.stripeClient.billing.meters.listEventSummaries(meter.id, {
                    customer: customerId,
                    start_time: alignedStartTime,
                    end_time: alignedEndTime,
                    value_grouping_window: 'day'
                })
            )

            const summariesResults = await Promise.all(summariesPromises)

            // Combine all summaries and add meter names
            const combinedData = summariesResults
                .flatMap((result) => result.data)
                .map((summary) => {
                    // Map meter IDs to their names based on config
                    let meterName = 'Unknown'
                    if (summary.meter === BILLING_CONFIG.SPARKS_METER_ID) {
                        meterName = BILLING_CONFIG.SPARKS_METER_NAME
                    }

                    return {
                        ...summary,
                        meter_name: meterName
                    }
                })

            log.info('Retrieved meter event summaries', {
                count: combinedData.length,
                startTime: new Date(alignedStartTime * 1000),
                endTime: new Date(alignedEndTime * 1000)
            })

            return {
                lastResponse: {
                    headers: {},
                    requestId: '',
                    statusCode: 200,
                    apiVersion: '2024-01-01',
                    idempotencyKey: '',
                    stripeAccount: ''
                },
                object: 'list',
                data: combinedData,
                has_more: false,
                url: '/v1/billing/meter-event-summaries'
            }
        } catch (error: any) {
            log.error('Failed to get meter event summaries', { error: error.message, customerId })
            throw error
        }
    }

    async getSubscriptionWithUsage(subscriptionId?: string): Promise<Subscription & { usage?: any }> {
        try {
            log.info('Getting subscription with usage', { subscriptionId })
            const { data: [subscription] = [] } = await this.stripeClient.subscriptions.list({
                customer: subscriptionId,
                status: 'active',
                limit: 1
            })

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
                    usage: []
                }
            }

            // Get usage for current month
            const now = new Date()
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
            const startTime = Math.floor(startOfMonth.getTime() / 1000)
            const endTime = Math.floor(now.getTime() / 1000)

            // Align timestamps with daily boundaries
            const alignedStartTime = Math.floor(startTime / 86400) * 86400
            const alignedEndTime = Math.ceil(endTime / 86400) * 86400

            let summaries
            try {
                summaries = await this.getMeterEventSummaries(subscription.customer as string, alignedStartTime, alignedEndTime)
            } catch (error) {
                log.warn('Failed to get meter event summaries, defaulting to empty usage', {
                    error,
                    subscriptionId: subscription.id,
                    customerId: subscription.customer
                })
                summaries = { data: [] }
            }

            return {
                ...subscription,
                id: subscription.id,
                customerId: subscription.customer as string,
                status: subscription.status as Subscription['status'],
                currentPeriodStart: new Date(subscription.current_period_start * 1000),
                currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                cancelAtPeriodEnd: subscription.cancel_at_period_end,
                usage: summaries.data
            }
        } catch (error: any) {
            log.error('Failed to get subscription with usage', {
                error: error.message,
                subscriptionId,
                stack: error.stack
            })
            // Return a default response instead of throwing
            return {
                id: '',
                customerId: subscriptionId || '',
                status: 'unpaid',
                currentPeriodStart: new Date(),
                currentPeriodEnd: new Date(),
                cancelAtPeriodEnd: false,
                usage: []
            }
        }
    }
}
