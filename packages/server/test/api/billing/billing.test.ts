import axios from 'axios'
import { BILLING_TEST_CONFIG } from './setup'

describe('Billing API', () => {
    describe('Customer Management', () => {
        it('should create a new customer', async () => {
            try {
                const response = await axios.post(
                    `${BILLING_TEST_CONFIG.API_URL}/api/v1/billing/customer/create`,
                    { email: 'test@example.com' },
                    { headers: BILLING_TEST_CONFIG.headers }
                )
                expect(response.status).toBe(200)
                expect(response.data).toHaveProperty('customerId')
            } catch (error) {
                fail('Customer creation failed: ' + error)
            }
        })

        it('should get customer status', async () => {
            try {
                const response = await axios.get(`${BILLING_TEST_CONFIG.API_URL}/api/v1/billing/customer/status`, {
                    headers: BILLING_TEST_CONFIG.headers
                })
                expect(response.status).toBe(200)
                expect(response.data).toHaveProperty('credits')
                expect(response.data).toHaveProperty('tier')
            } catch (error) {
                fail('Customer status check failed: ' + error)
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
                fail('Usage tracking failed: ' + error)
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
                fail('Usage summary check failed: ' + error)
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
                fail('Subscription creation failed: ' + error)
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
                fail('Subscription status check failed: ' + error)
            }
        })
    })
})
