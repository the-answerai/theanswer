import { Logger } from 'winston'

// Initialize logger
export const log = console as unknown as Logger

// Default customer ID for development
export const DEFAULT_CUSTOMER_ID = process.env.BILLING_DEFAULT_STRIPE_CUSTOMER_ID

// Override flag: When true, ALWAYS use DEFAULT_CUSTOMER_ID regardless of trace metadata or user data
export const OVERRIDE_CUSTOMER_ID = process.env.BILLING_OVERRIDE_CUSTOMER_ID === 'true'

// Load environment variables with defaults
// Base rate: $20 for 500,000 credits = $0.00004 per credit
const BILLING_CREDIT_PRICE_USD = parseFloat(process.env.BILLING_CREDIT_PRICE_USD || '0.00004')
const MARGIN_MULTIPLIER = parseFloat(process.env.BILLING_MARGIN_MULTIPLIER || '1')
const BILLING_PRO_PLAN_CREDITS = parseInt(process.env.BILLING_PRO_PLAN_CREDITS || '500000')
const BILLING_FREE_PLAN_CREDITS = parseInt(process.env.BILLING_FREE_PLAN_CREDITS || '10000')

// Billing configuration
export const BILLING_CONFIG = {
    PRICE_IDS: {
        FREE_MONTHLY: process.env.STRIPE_FREE_PRICE_ID,
        PAID_MONTHLY: process.env.BILLING_STRIPE_PAID_PRICE_ID
    },
    // Base rate: $20 for 500,000 credits = $0.00004 per credit
    CREDIT_TO_USD: BILLING_CREDIT_PRICE_USD,
    MARGIN_MULTIPLIER: MARGIN_MULTIPLIER,
    BILLING_CREDITS_METER_ID: process.env.STRIPE_CREDITS_METER_ID,
    BILLING_CREDITS_METER_NAME: 'credits',

    // Plan limits
    PLAN_LIMITS: {
        PRO: BILLING_PRO_PLAN_CREDITS,
        FREE: BILLING_FREE_PLAN_CREDITS
    },

    // Validation rules
    VALIDATION: {
        MIN_BATCH_SIZE: 1,
        MAX_BATCH_SIZE: 100,
        MAX_RETRIES: 3,
        RETRY_DELAY_MS: 1000,
        BATCH_DELAY_MS: 1000
    },

    // Sync configuration
    SYNC: {
        LOOKBACK_DAYS: parseInt(process.env.BILLING_SYNC_LOOKBACK_DAYS || '7'), // Reduced from 90 to 7 days
        PAGE_BATCH_SIZE: parseInt(process.env.BILLING_SYNC_PAGE_BATCH_SIZE || '3'), // Reduced from 15 to 3 pages
        RATE_LIMIT_DELAY_MS: parseInt(process.env.BILLING_SYNC_RATE_LIMIT_MS || '2000'), // Increased from 1000 to 2000ms
        TRACE_BATCH_SIZE: parseInt(process.env.BILLING_SYNC_TRACE_BATCH_SIZE || '5'), // Reduced from 15 to 5 traces
        MAX_RETRIES: 3,
        RETRY_DELAY_MS: 1000,
        EXPONENTIAL_BACKOFF: true
    },

    // Resource configuration
    AI_TOKENS: {
        TOKENS_PER_CREDIT: 10, // 1,000 tokens = 100 Credits
        METER_NAME: 'credits',
        MIN_TOKENS: 1,
        MAX_TOKENS_PER_REQUEST: 1000000
    },
    COMPUTE: {
        MINUTES_PER_CREDIT: 1 / 50, // 1 minute = 50 Credits
        METER_NAME: 'credits',
        MIN_MINUTES: 0.1,
        MAX_MINUTES_PER_REQUEST: 1440 // 24 hours
    },
    STORAGE: {
        GB_PER_CREDIT: 1 / 500, // 1 GB = 500 Credits
        METER_NAME: 'credits',
        MIN_GB: 0.1,
        MAX_GB_PER_REQUEST: 1000
    },

    // Usage metadata fields
    METADATA_FIELDS: {
        REQUIRED: ['customerId', 'timestamp', 'resourceType'],
        OPTIONAL: ['model', 'endpoint', 'tags']
    },

    RATE_DESCRIPTIONS: {
        AI_TOKENS: 'Usage from AI model token consumption (1,000 tokens = 100 Credits)',
        COMPUTE: 'Usage from processing time and compute resources (1 minute = 50 Credits)',
        STORAGE: 'Usage from data storage and persistence (1 GB/month = 500 Credits)'
    }
}
