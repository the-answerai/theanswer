import axios from 'axios'
import { TEST_CONFIG } from '../setup'

// Use a hardcoded bearer token for testing
const TEST_AUTH_TOKEN = 'o5ruFiTnNqoPHmA72_2VdEuwBuBpORHK6lVM11eGTEk'

const BILLING_TEST_CONFIG = {
    ...TEST_CONFIG,
    headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${TEST_AUTH_TOKEN}`
    }
}

describe('Billing Integration Tests', () => {
    describe('Usage Stats', () => {
        it('should get usage statistics', async () => {
            const response = await axios.get(`${BILLING_TEST_CONFIG.API_URL}/api/v1/billing/usage/stats`, {
                headers: BILLING_TEST_CONFIG.headers
            })
            expect(response.status).toBe(200)
            expect(response.data).toHaveProperty('total_sparks')
            expect(response.data).toHaveProperty('usageByMeter')
            expect(response.data).toHaveProperty('dailyUsageByMeter')
            expect(response.data).toHaveProperty('lastUpdated')
            expect(response.data.raw).toHaveProperty('summaries')
            expect(response.data.raw).toHaveProperty('meterUsage')
        })

        it('should sync usage data', async () => {
            const response = await axios.post(
                `${BILLING_TEST_CONFIG.API_URL}/api/v1/billing/usage/sync`,
                {
                    trace_id: 'test-trace-1',
                    usage: {
                        tokens: 1000,
                        computeMinutes: 60,
                        storageGB: 1
                    }
                },
                { headers: BILLING_TEST_CONFIG.headers }
            )
            expect(response.status).toBe(200)
            expect(response.data).toHaveProperty('status', 'success')
        })
    })

    describe('Subscription Management', () => {
        it('should create a checkout session', async () => {
            const response = await axios.post(
                `${BILLING_TEST_CONFIG.API_URL}/api/v1/billing/subscriptions`,
                {
                    priceId: process.env.STRIPE_PRICE_ID || 'price_test'
                },
                { headers: BILLING_TEST_CONFIG.headers }
            )
            expect(response.status).toBe(200)
            expect(response.data).toHaveProperty('url')
            expect(response.data.url).toMatch(/^https:\/\/checkout\.stripe\.com/)
        })

        it('should get subscription with usage', async () => {
            const response = await axios.get(`${BILLING_TEST_CONFIG.API_URL}/api/v1/billing/subscriptions`, {
                headers: BILLING_TEST_CONFIG.headers
            })
            expect(response.status).toBe(200)
            if (response.data.subscription) {
                expect(response.data).toHaveProperty('id')
                expect(response.data).toHaveProperty('status')
                expect(response.data).toHaveProperty('currentPeriodStart')
                expect(response.data).toHaveProperty('currentPeriodEnd')
                expect(response.data).toHaveProperty('usage')
            }
        })
    })

    describe('Payment Methods', () => {
        it('should attach a payment method', async () => {
            const response = await axios.post(
                `${BILLING_TEST_CONFIG.API_URL}/api/v1/billing/payment-methods`,
                {
                    paymentMethodId: 'pm_card_visa' // Stripe test payment method
                },
                { headers: BILLING_TEST_CONFIG.headers }
            )
            expect(response.status).toBe(200)
            expect(response.data).toHaveProperty('id')
            expect(response.data).toHaveProperty('type', 'card')
            expect(response.data).toHaveProperty('last4')
        })
    })

    describe('Billing Portal', () => {
        it('should create a billing portal session', async () => {
            const response = await axios.post(
                `${BILLING_TEST_CONFIG.API_URL}/api/v1/billing/portal-sessions`,
                {
                    returnUrl: `${BILLING_TEST_CONFIG.API_URL}/billing`
                },
                { headers: BILLING_TEST_CONFIG.headers }
            )
            expect(response.status).toBe(200)
            expect(response.data).toHaveProperty('url')
            expect(response.data.url).toMatch(/^https:\/\/billing\.stripe\.com/)
        })
    })

    describe('Invoices', () => {
        it('should get upcoming invoice', async () => {
            const response = await axios.post(
                `${BILLING_TEST_CONFIG.API_URL}/api/v1/billing/invoices/upcoming`,
                {},
                { headers: BILLING_TEST_CONFIG.headers }
            )
            expect(response.status).toBe(200)
            expect(response.data).toHaveProperty('amount')
            expect(response.data).toHaveProperty('currency')
            expect(response.data).toHaveProperty('status')
        })
    })
})
