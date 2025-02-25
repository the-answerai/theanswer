import { TEST_CONFIG } from '../setup'
import { BillingService, StripeProvider } from '../../../src/aai-utils/billing'
import { UsageStats, Subscription, BillingPortalSession, Invoice, SubscriptionWithUsage } from '../../../src/aai-utils/billing/core/types'
import axios from 'axios'

// Test API key for authentication
export const TEST_API_KEY = 'o5ruFiTnNqoPHmA72_2VdEuwBuBpORHK6lVM11eGTEk'

// Resource rates and limits
export const RESOURCE_RATES = {
    ai_tokens: 10.0,
    compute: 0.02,
    storage: 5.0
}

export const RESOURCE_LIMITS = {
    ai_tokens: 1000000,
    compute: 10000,
    storage: 100
}

// Billing test configuration type
type BillingTestConfig = typeof TEST_CONFIG & {
    headers: {
        Authorization: string
        'Content-Type': string
    }
    testCustomerId: string
    freeTierCredits: number
    hardLimitCredits: number
    resourceRates: typeof RESOURCE_RATES
    resourceLimits: typeof RESOURCE_LIMITS
}

// Billing test configuration
export const BILLING_TEST_CONFIG: BillingTestConfig = {
    ...TEST_CONFIG,
    headers: {
        Authorization: `Bearer ${TEST_API_KEY}`,
        'Content-Type': 'application/json'
    },
    testCustomerId: 'test-customer-123',
    freeTierCredits: 10000,
    hardLimitCredits: 500000,
    resourceRates: RESOURCE_RATES,
    resourceLimits: RESOURCE_LIMITS
}

// Mock customer data
export const MOCK_STRIPE_CUSTOMER = {
    id: 'test-customer-123',
    email: 'test@example.com',
    name: 'Test Customer',
    phone: '+1234567890',
    address: {
        city: 'San Francisco',
        country: 'US',
        line1: '123 Main St',
        postal_code: '94101',
        state: 'CA'
    },
    metadata: {
        testMetadata: 'testValue'
    }
}

// Mock subscription data
export const MOCK_SUBSCRIPTION: Subscription = {
    id: 'test-subscription-123',
    customerId: MOCK_STRIPE_CUSTOMER.id,
    status: 'active',
    currentPeriodStart: new Date(Date.now() - 86400000), // 1 day ago
    currentPeriodEnd: new Date(Date.now() + 2592000000), // 30 days from now
    cancelAtPeriodEnd: false
}

// Mock Stripe provider for testing
class MockStripeProvider extends StripeProvider {
    private usageStats: UsageStats = {
        total_sparks: 0,
        usageByMeter: {},
        dailyUsageByMeter: {},
        lastUpdated: new Date(),
        raw: {
            summaries: {
                object: 'list',
                data: [],
                has_more: false,
                url: '/v1/billing/meter_event_summaries',
                lastResponse: {
                    headers: {},
                    requestId: 'test-request-123',
                    statusCode: 200
                }
            },
            meterUsage: {}
        }
    }

    async getCustomer(customerId: string) {
        return MOCK_STRIPE_CUSTOMER
    }

    async getSubscription(subscriptionId: string) {
        return MOCK_SUBSCRIPTION
    }

    async getSubscriptionWithUsage(subscriptionId?: string): Promise<SubscriptionWithUsage> {
        return {
            ...MOCK_SUBSCRIPTION,
            usage: []
        }
    }

    async createCheckoutSession(params: any) {
        return {
            url: 'https://checkout.stripe.com/test'
        }
    }

    async createBillingPortalSession(params: any): Promise<BillingPortalSession> {
        return {
            url: 'https://billing.stripe.com/test',
            returnUrl: params.returnUrl
        }
    }

    async getUpcomingInvoice(params: any): Promise<Invoice> {
        return {
            id: 'test-invoice-123',
            customerId: params.customerId,
            amount: 1000,
            currency: 'usd',
            status: 'draft',
            created: new Date(),
            dueDate: new Date(Date.now() + 2592000000)
        }
    }

    async attachPaymentMethod(params: any) {
        return {
            id: 'test-payment-123',
            type: 'card',
            last4: '4242',
            expMonth: 12,
            expYear: 2025
        }
    }

    async getUsageStats(customerId: string): Promise<UsageStats> {
        return this.usageStats
    }
}

// Create mock billing service
export const mockBillingService = new BillingService(new MockStripeProvider({} as any), {} as any)

// Test chatflow configuration
export const TEST_CHATFLOW_CONFIG = {
    id: '79507fc1-7f5d-4f24-8d2a-fc48fa7c51f1',
    question: 'Test question',
    chatType: 'ANSWERAI',
    socketIOClientId: 'test-socket-id'
}

// Helper function to make prediction request
export async function makePredictionRequest(config = TEST_CHATFLOW_CONFIG) {
    return axios.post(
        `${TEST_CONFIG.API_URL}/api/v1/prediction/${config.id}`,
        {
            question: config.question,
            history: [],
            chatType: config.chatType,
            socketIOClientId: config.socketIOClientId
        },
        {
            headers: {
                ...BILLING_TEST_CONFIG.headers,
                Accept: 'application/json, text/plain, */*',
                'Cache-Control': 'no-cache',
                Pragma: 'no-cache'
            }
        }
    )
}

// Helper function to simulate credit usage
export async function simulateCreditsUsage(credits: number) {
    const requestsNeeded = Math.ceil(credits / 100) // Assuming each request uses ~100 credits
    const requests = Array(requestsNeeded)
        .fill(null)
        .map(() =>
            makePredictionRequest({
                ...TEST_CHATFLOW_CONFIG,
                question: `Test question ${Math.random()}` // Ensure unique requests
            })
        )
    return Promise.all(requests)
}
