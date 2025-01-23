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
    Invoice
} from '../core/types'
import { stripe as stripeClient, log } from '../config'

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

    async syncUsageToStripe(traceId?: string): Promise<void> {
        // This method now only handles the actual syncing to Stripe meters
        // The usage data is already processed by LangfuseProvider
        try {
            log.info('Syncing usage to Stripe', { traceId })
            // Implementation for syncing usage data to Stripe meters would go here
        } catch (error: any) {
            log.error('Failed to sync usage to Stripe', { error: error.message, traceId })
            throw error
        }
    }
}
