import Stripe from 'stripe'
import { Logger } from 'winston'
import { Langfuse } from 'langfuse'

// Initialize Stripe client
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '')

// Initialize logger
export const log = console as unknown as Logger

// Default customer ID for development
export const DEFAULT_CUSTOMER_ID = process.env.DEFAULT_STRIPE_CUSTOMER_ID

// Billing configuration
export const BILLING_CONFIG = {
    AI_TOKENS: {
        TOKENS_PER_SPARK: 10,
        COST_PER_SPARK: 0.001,
        USD_TO_SPARKS: 25000,
        RETAIL_PRICE_PER_SPARK: 0.00004 * 1.2,
        MARGIN_MULTIPLIER: 1.2
    },
    COMPUTE: {
        MINUTES_PER_SPARK: 1 / 50,
        COST_PER_SPARK: 0.001,
        MARGIN_MULTIPLIER: 1.2
    },
    STORAGE: {
        GB_PER_SPARK: 1 / 500,
        COST_PER_SPARK: 0.001,
        MARGIN_MULTIPLIER: 1.2
    },
    SPARKS: {
        METER_ID: process.env.STRIPE_SPARKS_METER_ID || '',
        METER_NAME: 'sparks',
        MARGIN_MULTIPLIER: 1.2
    }
}

// Initialize Langfuse client
export const langfuse = new Langfuse({
    publicKey: process.env.LANGFUSE_PUBLIC_KEY || '',
    secretKey: process.env.LANGFUSE_SECRET_KEY || '',
    baseUrl: process.env.LANGFUSE_BASEURL || 'https://cloud.langfuse.com'
})
