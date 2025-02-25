import express from 'express'

import billingController from '../../controllers/billing'
const router = express.Router()

// Usage stats
router.get('/usage/stats', billingController.getUsageStats)

// Usage sync
router.get('/usage/sync', billingController.usageSyncHandler)
router.post('/usage/sync', billingController.usageSyncHandler)

// Payment Methods
router.post('/payment-methods', billingController.attachPaymentMethod)

// Subscriptions
router.get('/subscriptions', billingController.getSubscriptionWithUsage)
router.post('/subscriptions', billingController.createCheckoutSession)
router.put('/subscriptions/:id', billingController.updateSubscription)
router.delete('/subscriptions/:id', billingController.cancelSubscription)

// Invoices
router.post('/invoices/upcoming', billingController.getUpcomingInvoice)

// Billing Portal
router.post('/portal-sessions', billingController.createBillingPortalSession)

// Webhooks
router.post('/webhooks', billingController.handleWebhook)

export default router
