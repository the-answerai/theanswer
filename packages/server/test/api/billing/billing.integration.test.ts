import axios from 'axios'
import { BILLING_TEST_CONFIG, makePredictionRequest, simulateCreditsUsage } from './setup'

// Use a hardcoded bearer token for testing
const TEST_AUTH_TOKEN = 'o5ruFiTnNqoPHmA72_2VdEuwBuBpORHK6lVM11eGTEk'

describe('Billing Integration Tests', () => {
    describe('Usage Stats', () => {
        it('should get usage statistics', async () => {
            try {
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
            } catch (error: any) {
                expect(error).toBeNull()
            }
        })

        it('should track credit usage from predictions', async () => {
            try {
                // Get initial stats
                const initialStats = await axios.get(`${BILLING_TEST_CONFIG.API_URL}/api/v1/billing/usage/stats`, {
                    headers: BILLING_TEST_CONFIG.headers
                })

                // Make a prediction request
                const predictionResponse = await makePredictionRequest()
                expect(predictionResponse.status).toBe(200)

                // Wait for usage to be recorded
                await new Promise((resolve) => setTimeout(resolve, 1000))

                // Check updated stats
                const updatedStats = await axios.get(`${BILLING_TEST_CONFIG.API_URL}/api/v1/billing/usage/stats`, {
                    headers: BILLING_TEST_CONFIG.headers
                })
                expect(updatedStats.data.total_sparks).toBeGreaterThan(initialStats.data.total_sparks)
            } catch (error: any) {
                expect(error).toBeNull()
            }
        })
    })

    describe('Subscription Management', () => {
        it('should create a checkout session', async () => {
            try {
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
            } catch (error: any) {
                expect(error).toBeNull()
            }
        })

        it('should get subscription with usage', async () => {
            try {
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
            } catch (error: any) {
                expect(error).toBeNull()
            }
        })
    })

    describe('Payment Methods', () => {
        it('should attach a payment method', async () => {
            try {
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
            } catch (error: any) {
                expect(error).toBeNull()
            }
        })
    })

    describe('Billing Portal', () => {
        it('should create a billing portal session', async () => {
            try {
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
            } catch (error: any) {
                expect(error).toBeNull()
            }
        })
    })

    describe('Invoices', () => {
        it('should get upcoming invoice', async () => {
            try {
                const response = await axios.post(
                    `${BILLING_TEST_CONFIG.API_URL}/api/v1/billing/invoices/upcoming`,
                    {},
                    { headers: BILLING_TEST_CONFIG.headers }
                )
                expect(response.status).toBe(200)
                expect(response.data).toHaveProperty('amount')
                expect(response.data).toHaveProperty('currency')
                expect(response.data).toHaveProperty('status')
            } catch (error: any) {
                expect(error).toBeNull()
            }
        })
    })

    describe('Free Tier Management', () => {
        it('should track free tier usage correctly', async () => {
            try {
                // First check initial credits
                const initialStats = await axios.get(`${BILLING_TEST_CONFIG.API_URL}/api/v1/billing/usage/stats`, {
                    headers: BILLING_TEST_CONFIG.headers
                })
                expect(initialStats.data.total_sparks).toBeDefined()

                // Use credits through predictions
                await simulateCreditsUsage(5000) // Use about half of free tier

                // Wait for usage to be recorded
                await new Promise((resolve) => setTimeout(resolve, 1000))

                // Check updated stats
                const updatedStats = await axios.get(`${BILLING_TEST_CONFIG.API_URL}/api/v1/billing/usage/stats`, {
                    headers: BILLING_TEST_CONFIG.headers
                })
                expect(updatedStats.data.total_sparks).toBeGreaterThan(initialStats.data.total_sparks)
                expect(updatedStats.data.total_sparks).toBeLessThanOrEqual(BILLING_TEST_CONFIG.freeTierCredits)
            } catch (error: any) {
                expect(error).toBeNull()
            }
        })

        it('should notify when approaching free tier limit', async () => {
            try {
                // Use most of free tier through predictions
                await simulateCreditsUsage(9000) // Use 90% of free tier

                // Wait for usage to be recorded
                await new Promise((resolve) => setTimeout(resolve, 1000))

                // Make one more prediction to trigger warning
                const response = await makePredictionRequest()
                expect(response.data).toHaveProperty('warnings')
                expect(response.data.warnings).toContain('approaching_free_tier_limit')
            } catch (error: any) {
                expect(error).toBeNull()
            }
        })
    })

    describe('Hard Limit Implementation', () => {
        it('should enforce hard limit', async () => {
            try {
                // Attempt to exceed hard limit through predictions
                await simulateCreditsUsage(BILLING_TEST_CONFIG.hardLimitCredits + 1000)

                // This prediction should fail
                await expect(makePredictionRequest()).rejects.toThrow()
            } catch (error: any) {
                expect(error.response.status).toBe(403)
                expect(error.response.data).toHaveProperty('error', 'usage_limit_exceeded')
            }
        })

        it('should handle blocking mechanism', async () => {
            try {
                // Get close to limit
                await simulateCreditsUsage(BILLING_TEST_CONFIG.hardLimitCredits - 10000)

                // Wait for usage to be recorded
                await new Promise((resolve) => setTimeout(resolve, 1000))

                // Check blocking status
                const statusResponse = await axios.get(`${BILLING_TEST_CONFIG.API_URL}/api/v1/billing/usage/status`, {
                    headers: BILLING_TEST_CONFIG.headers
                })
                expect(statusResponse.data).toHaveProperty('isBlocked', false)
                expect(statusResponse.data).toHaveProperty('warnings')
                expect(statusResponse.data.warnings).toContain('approaching_hard_limit')

                // Should still allow predictions
                const predictionResponse = await makePredictionRequest()
                expect(predictionResponse.status).toBe(200)
            } catch (error: any) {
                expect(error).toBeNull()
            }
        })
    })

    describe('Error Handling', () => {
        it('should handle invalid usage data', async () => {
            try {
                await expect(
                    axios.post(
                        `${BILLING_TEST_CONFIG.API_URL}/api/v1/billing/usage/sync`,
                        {
                            trace_id: 'test-error-1',
                            usage: {
                                tokens: -1000, // Invalid negative value
                                computeMinutes: -30,
                                storageGB: -1
                            }
                        },
                        { headers: BILLING_TEST_CONFIG.headers }
                    )
                ).rejects.toThrow()
            } catch (error: any) {
                expect(error.response.status).toBe(400)
                expect(error.response.data).toHaveProperty('error', 'invalid_usage_data')
            }
        })

        it('should handle missing authentication', async () => {
            try {
                await expect(axios.get(`${BILLING_TEST_CONFIG.API_URL}/api/v1/billing/usage/stats`)).rejects.toThrow()
            } catch (error: any) {
                expect(error.response.status).toBe(401)
            }
        })
    })

    describe('Usage Dashboard', () => {
        it('should return detailed usage breakdown by resource type', async () => {
            try {
                const response = await axios.get(`${BILLING_TEST_CONFIG.API_URL}/api/v1/billing/usage/stats`, {
                    headers: BILLING_TEST_CONFIG.headers
                })
                expect(response.status).toBe(200)

                // Resource type breakdown
                expect(response.data.usageByMeter).toHaveProperty('ai_tokens')
                expect(response.data.usageByMeter).toHaveProperty('compute')
                expect(response.data.usageByMeter).toHaveProperty('storage')

                // Check rates and limits
                expect(response.data.rates).toEqual({
                    ai_tokens: 10.0,
                    compute: 0.02,
                    storage: 5.0
                })

                // Check resource limits
                expect(response.data.limits).toEqual({
                    ai_tokens: 1000000,
                    compute: 10000,
                    storage: 100
                })

                // Check billing period
                expect(response.data).toHaveProperty('billingPeriod')
                expect(response.data.billingPeriod).toHaveProperty('start')
                expect(response.data.billingPeriod).toHaveProperty('end')
            } catch (error: any) {
                expect(error).toBeNull()
            }
        })

        it('should track daily usage for each resource type', async () => {
            try {
                const response = await axios.get(`${BILLING_TEST_CONFIG.API_URL}/api/v1/billing/usage/stats`, {
                    headers: BILLING_TEST_CONFIG.headers
                })
                expect(response.status).toBe(200)

                // Check daily usage structure
                expect(response.data.dailyUsageByMeter).toHaveProperty('ai_tokens')
                expect(response.data.dailyUsageByMeter.ai_tokens).toBeInstanceOf(Array)
                expect(response.data.dailyUsageByMeter.ai_tokens[0]).toHaveProperty('date')
                expect(response.data.dailyUsageByMeter.ai_tokens[0]).toHaveProperty('value')
                expect(response.data.dailyUsageByMeter.ai_tokens[0]).toHaveProperty('cost')
            } catch (error: any) {
                expect(error).toBeNull()
            }
        })
    })

    describe('Plan Management', () => {
        it('should return current plan details', async () => {
            try {
                const response = await axios.get(`${BILLING_TEST_CONFIG.API_URL}/api/v1/billing/plan`, {
                    headers: BILLING_TEST_CONFIG.headers
                })
                expect(response.status).toBe(200)

                // Plan details
                expect(response.data).toHaveProperty('name')
                expect(response.data).toHaveProperty('price')
                expect(response.data).toHaveProperty('status')
                expect(response.data).toHaveProperty('features')
                expect(response.data).toHaveProperty('credits_included')

                // Basic plan structure
                if (response.data.name === 'Basic') {
                    expect(response.data.price).toBe(0)
                    expect(response.data.credits_included).toBe(10000)
                }

                // Pro plan structure
                if (response.data.name === 'Pro') {
                    expect(response.data.price).toBe(99)
                    expect(response.data.credits_included).toBe(500000)
                }

                // Common features
                expect(response.data.features).toContain('Full API access')
                expect(response.data.features).toContain('Community support')
                expect(response.data.features).toContain('All features included')
                expect(response.data.features).toContain('Usage analytics')
            } catch (error: any) {
                expect(error).toBeNull()
            }
        })

        it('should handle plan upgrade', async () => {
            try {
                const response = await axios.post(
                    `${BILLING_TEST_CONFIG.API_URL}/api/v1/billing/plan/upgrade`,
                    { plan: 'pro' },
                    { headers: BILLING_TEST_CONFIG.headers }
                )
                expect(response.status).toBe(200)
                expect(response.data).toHaveProperty('checkout_url')
                expect(response.data.checkout_url).toMatch(/^https:\/\/checkout\.stripe\.com/)
            } catch (error: any) {
                expect(error).toBeNull()
            }
        })

        it('should return cost calculator estimates', async () => {
            try {
                const response = await axios.post(
                    `${BILLING_TEST_CONFIG.API_URL}/api/v1/billing/calculate-cost`,
                    {
                        ai_tokens: 1000,
                        compute_minutes: 60,
                        storage_gb: 1
                    },
                    { headers: BILLING_TEST_CONFIG.headers }
                )
                expect(response.status).toBe(200)
                expect(response.data).toHaveProperty('total_cost')
                expect(response.data).toHaveProperty('breakdown')
                expect(response.data.breakdown).toHaveProperty('ai_tokens')
                expect(response.data.breakdown).toHaveProperty('compute')
                expect(response.data.breakdown).toHaveProperty('storage')
                expect(response.data).toHaveProperty('total_sparks')
            } catch (error: any) {
                expect(error).toBeNull()
            }
        })
    })
})
