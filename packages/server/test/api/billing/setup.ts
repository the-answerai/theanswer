import { TEST_CONFIG } from '../setup'

// Test API key for authentication
export const TEST_API_KEY = 'o5ruFiTnNqoPHmA72_2VdEuwBuBpORHK6lVM11eGTEk'

// Billing test configuration
export const BILLING_TEST_CONFIG = {
    ...TEST_CONFIG,
    headers: {
        Authorization: `Bearer ${TEST_API_KEY}`,
        'Content-Type': 'application/json'
    },
    testCustomerId: 'test-customer-123',
    freeTierCredits: 10000,
    hardLimitCredits: 500000
}
