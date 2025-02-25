import axios from 'axios'
import { BILLING_TEST_CONFIG } from './setup'

describe('Billing API', () => {
    describe('Customer Management', () => {
        it('should automatically create customer on first auth', async () => {
            try {
                // First make any authenticated request to trigger customer creation
                const response = await axios.get(`${BILLING_TEST_CONFIG.API_URL}/api/v1/billing/customer/status`, {
                    headers: BILLING_TEST_CONFIG.headers
                })
                expect(response.status).toBe(200)
                expect(response.data).toHaveProperty('stripeCustomerId')
            } catch (error) {
                expect(error).toBeNull()
            }
        })

        it('should get existing customer status', async () => {
            try {
                const response = await axios.get(`${BILLING_TEST_CONFIG.API_URL}/api/v1/billing/customer/status`, {
                    headers: BILLING_TEST_CONFIG.headers
                })
                expect(response.status).toBe(200)
                expect(response.data).toHaveProperty('credits')
                expect(response.data).toHaveProperty('tier')
            } catch (error) {
                expect(error).toBeNull()
            }
        })
    })

    describe('Usage Tracking', () => {
        it('should track usage event', async () => {
            try {
                const response = await axios.post(
                    `${BILLING_TEST_CONFIG.API_URL}/api/v1/billing/usage/track`,
                    {
                        type: 'token',
                        amount: 100
                    },
                    { headers: BILLING_TEST_CONFIG.headers }
                )
                expect(response.status).toBe(200)
                expect(response.data).toHaveProperty('remainingCredits')
            } catch (error) {
                expect(error).toBeNull()
            }
        })

        it('should get usage summary', async () => {
            try {
                const response = await axios.get(`${BILLING_TEST_CONFIG.API_URL}/api/v1/billing/usage/summary`, {
                    headers: BILLING_TEST_CONFIG.headers
                })
                expect(response.status).toBe(200)
                expect(response.data).toHaveProperty('totalUsage')
                expect(response.data).toHaveProperty('periodStart')
                expect(response.data).toHaveProperty('periodEnd')
            } catch (error) {
                expect(error).toBeNull()
            }
        })
    })

    describe('Subscription Management', () => {
        it('should create subscription', async () => {
            try {
                const response = await axios.post(
                    `${BILLING_TEST_CONFIG.API_URL}/api/v1/billing/subscription/create`,
                    {
                        plan: 'standard',
                        paymentMethodId: 'test-payment-method'
                    },
                    { headers: BILLING_TEST_CONFIG.headers }
                )
                expect(response.status).toBe(200)
                expect(response.data).toHaveProperty('subscriptionId')
                expect(response.data).toHaveProperty('status')
            } catch (error) {
                expect(error).toBeNull()
            }
        })

        it('should get subscription status', async () => {
            try {
                const response = await axios.get(`${BILLING_TEST_CONFIG.API_URL}/api/v1/billing/subscription/status`, {
                    headers: BILLING_TEST_CONFIG.headers
                })
                expect(response.status).toBe(200)
                expect(response.data).toHaveProperty('plan')
                expect(response.data).toHaveProperty('status')
                expect(response.data).toHaveProperty('currentPeriodEnd')
            } catch (error) {
                expect(error).toBeNull()
            }
        })
    })
})
