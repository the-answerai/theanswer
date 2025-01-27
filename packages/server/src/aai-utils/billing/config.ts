import Stripe from 'stripe'
import { Logger } from 'winston'
import { Langfuse } from 'langfuse'

// Initialize Stripe client
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '')

// Initialize logger
export const log = console as unknown as Logger

// Default customer ID for development
export const DEFAULT_CUSTOMER_ID = process.env.DEFAULT_STRIPE_CUSTOMER_ID ?? 'cus_Re7UrYXnBJisB8'

// Billing configuration
export const BILLING_CONFIG = {
    // Base rate: $20 for 500,000 sparks = $0.00004 per spark
    SPARK_TO_USD: 0.00004, // Base cost per spark in USD
    MARGIN_MULTIPLIER: 1.2, // 20% margin applied to total cost
    SPARKS_METER_ID: 'mtr_test_61Rgpu5M2KRrOLhJW41FeRAHyP6by5dI',
    SPARKS_METER_NAME: 'sparks',

    AI_TOKENS: {
        TOKENS_PER_SPARK: 10, // 1,000 tokens = 100 Sparks
        METER_NAME: 'sparks'
    },
    COMPUTE: {
        MINUTES_PER_SPARK: 1 / 50, // 1 minute = 50 Sparks
        METER_NAME: 'sparks'
    },
    STORAGE: {
        GB_PER_SPARK: 1 / 500, // 1 GB = 500 Sparks
        METER_NAME: 'sparks'
    },
    RATE_DESCRIPTIONS: {
        AI_TOKENS: 'Usage from AI model token consumption (1,000 tokens = 100 Sparks)',
        COMPUTE: 'Usage from processing time and compute resources (1 minute = 50 Sparks)',
        STORAGE: 'Usage from data storage and persistence (1 GB/month = 500 Sparks)'
    }
}

// Initialize Langfuse client
export const langfuse = new Langfuse({
    publicKey: process.env.LANGFUSE_PUBLIC_KEY || '',
    secretKey: process.env.LANGFUSE_SECRET_KEY || '',
    baseUrl: process.env.LANGFUSE_BASEURL || 'https://cloud.langfuse.com'
})
