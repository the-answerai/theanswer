import client from './client'

// Usage related endpoints
const getCustomerStatus = () => client.get('/billing/customer/status')

// usage reporting endpoints
const getUsageSummary = () => client.get('/billing/usage/summary')
const getUsageEvents = (params) => client.get('/billing/usage/events', { params })
const syncUsage = () => client.post('/billing/usage/sync')

// subscription management
const createSubscription = (body) => client.post('/billing/subscriptions', body)
const cancelSubscription = (subscriptionId) => client.delete(`/subscriptions/${subscriptionId}`)

export default {
    getCustomerStatus,
    getUsageSummary,
    getUsageEvents,
    syncUsage,
    createSubscription,
    cancelSubscription
}
