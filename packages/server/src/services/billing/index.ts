import { BillingService, LangfuseProvider, StripeProvider, stripe as stripeClient } from '../../aai-utils/billing'
import type {
    CreateCustomerParams,
    AttachPaymentMethodParams,
    CreateCheckoutSessionParams,
    UpdateSubscriptionParams,
    GetUpcomingInvoiceParams,
    CreateBillingPortalSessionParams
} from '../../aai-utils/billing'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { StatusCodes } from 'http-status-codes'
import logger from '../../utils/logger'

// Initialize billing service with Stripe provider
const billingService = new BillingService(new StripeProvider(stripeClient), new LangfuseProvider())

async function getUsageStats(customerId?: string) {
    logger.info('Getting usage stats', { customerId })
    try {
        if (!customerId) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, 'User has no associated Stripe customer')
        }
        return await billingService.getUsageStats(customerId)
    } catch (error) {
        logger.error('Error getting usage stats:', { error, customerId })
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Failed to get usage statistics: ${error instanceof Error ? error.message : String(error)}`
        )
    }
}

async function syncUsageToStripe(traceId?: string) {
    try {
        return await billingService.syncUsageToStripe(traceId || '')
    } catch (error) {
        logger.error('Error syncing usage:', error)
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Failed to sync usage: ${error instanceof Error ? error.message : String(error)}`
        )
    }
}

async function createCustomer(params: CreateCustomerParams) {
    try {
        return await billingService.createCustomer(params)
    } catch (error) {
        logger.error('Error creating customer:', error)
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Failed to create customer: ${error instanceof Error ? error.message : String(error)}`
        )
    }
}

async function attachPaymentMethod(params: AttachPaymentMethodParams) {
    try {
        return await billingService.attachPaymentMethod(params)
    } catch (error) {
        logger.error('Error attaching payment method:', error)
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Failed to attach payment method: ${error instanceof Error ? error.message : String(error)}`
        )
    }
}

async function createCheckoutSession(params: CreateCheckoutSessionParams) {
    try {
        return await billingService.createCheckoutSession(params)
    } catch (error) {
        logger.error('Error creating checkout session:', error)
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Failed to create checkout session: ${error instanceof Error ? error.message : String(error)}`
        )
    }
}

async function updateSubscription(params: UpdateSubscriptionParams) {
    try {
        return await billingService.updateSubscription(params)
    } catch (error) {
        logger.error('Error updating subscription:', error)
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Failed to update subscription: ${error instanceof Error ? error.message : String(error)}`
        )
    }
}

async function cancelSubscription(subscriptionId: string) {
    try {
        return await billingService.cancelSubscription(subscriptionId)
    } catch (error) {
        logger.error('Error canceling subscription:', error)
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Failed to cancel subscription: ${error instanceof Error ? error.message : String(error)}`
        )
    }
}

async function getUpcomingInvoice(params: GetUpcomingInvoiceParams) {
    try {
        return await billingService.getUpcomingInvoice(params)
    } catch (error) {
        logger.error('Error getting upcoming invoice:', error)
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Failed to get upcoming invoice: ${error instanceof Error ? error.message : String(error)}`
        )
    }
}

async function createBillingPortalSession(params: CreateBillingPortalSessionParams) {
    try {
        return await billingService.createBillingPortalSession(params)
    } catch (error) {
        logger.error('Error creating billing portal session:', error)
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Failed to create billing portal session: ${error instanceof Error ? error.message : String(error)}`
        )
    }
}

async function getSubscriptionWithUsage(subscriptionId: string) {
    try {
        return await billingService.getSubscriptionWithUsage(subscriptionId)
    } catch (error) {
        logger.error('Error getting subscription with usage:', error)
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Failed to get subscription with usage: ${error instanceof Error ? error.message : String(error)}`
        )
    }
}

export default {
    getUsageStats,
    syncUsageToStripe,
    createCustomer,
    attachPaymentMethod,
    createCheckoutSession,
    updateSubscription,
    cancelSubscription,
    getUpcomingInvoice,
    createBillingPortalSession,
    getSubscriptionWithUsage
}
