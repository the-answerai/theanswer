import client from './client'

// Usage related endpoints
const getUsageStats = () => client.get('/billing/usage/stats')
const syncUsage = () => client.post('/billing/usage/sync')

// Customer management
const createCustomer = (body) => client.post('/billing/customers', body)

// Payment methods
const attachPaymentMethod = (body) => client.post('/billing/payment-methods', body)

// s management
const createSubscription = (body) => client.post('/billing/subscriptions', body)
const updateSubscription = (subscriptionId, body) => client.put(`/subscriptions/${subscriptionId}`, body)
const cancelSubscription = (subscriptionId) => client.delete(`/subscriptions/${subscriptionId}`)
const getSubscriptions = () => client.get('/billing/subscriptions')
const getSubscriptionWithUsage = (subscriptionId) => client.get(`/billing/subscriptions/${subscriptionId}/usage`)

// Invoices
const getUpcomingInvoice = (body) => client.post('/billing/invoices/upcoming', body)

// Billing portal
const createBillingPortalSession = (body) => client.post('/billing/portal-sessions', body)

export default {
    getUsageStats,
    syncUsage,
    createCustomer,
    attachPaymentMethod,
    createSubscription,
    updateSubscription,
    cancelSubscription,
    getSubscriptions,
    getSubscriptionWithUsage,
    getUpcomingInvoice,
    createBillingPortalSession
}
