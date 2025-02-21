# Billing System Documentation

## Overview

The billing system implements a usage-based billing model using Stripe for payment processing and Langfuse for usage tracking. The system tracks usage through a virtual currency called "Sparks" and supports both individual and organization-level billing.

### Key Features

-   Usage-based Billing with Sparks
-   Real-time Usage Tracking
-   Subscription Management
-   Self-service Billing Portal
-   Organization and Individual Billing Support

## Architecture

### Core Components

1. **Billing Service** (`/packages/server/src/aai-utils/billing/core/BillingService.ts`)

    - Orchestrates billing operations
    - Manages usage tracking
    - Handles subscription management
    - Provides usage statistics

2. **Stripe Provider** (`/packages/server/src/aai-utils/billing/stripe/StripeProvider.ts`)

    - Handles all Stripe-related operations
    - Manages meter events
    - Processes usage synchronization
    - Handles subscription updates

3. **Usage Tracking** (`/packages/server/src/aai-utils/billing/core/types.ts`)
    - Defines usage metrics and types
    - Manages trace metadata
    - Handles usage aggregation

## Billing Configuration

### Spark Rates

```typescript
const STRIPE_CONFIG = {
    SPARK_TO_USD: 0.0001, // Cost per spark in USD
    SPARKS: {
        METER_ID: 'mtr_test_61RqbeVr5wxWsemTV41FeRAHyP6byAfw',
        METER_NAME: 'sparks',
        BASE_PRICE_USD: 0.0001,
        MARGIN_MULTIPLIER: 1.3 // 30% margin
    }
}
```

### Resource Rates

| Resource Type | Unit         | Sparks | Base Cost (USD) |
| ------------- | ------------ | ------ | --------------- |
| AI Tokens     | 1,000 tokens | 100    | 0.001           |
| Compute       | 1 minute     | 50     | 0.001           |
| Storage       | 1 GB/month   | 500    | 0.001           |

## Usage Tracking

### Implementation

1. **Real-time Tracking**

    - Usage events captured via Langfuse
    - Automatic metadata collection
    - Batch processing with retry mechanisms

2. **Usage Synchronization**

    - Periodic sync with Stripe meters
    - Optimized batch processing
    - Error handling and recovery

3. **Usage Statistics**
    - Daily and monthly aggregation
    - Per-resource type breakdown
    - Cost calculation with margins

## API Reference

### Usage Tracking

-   `GET /billing/usage/stats`: Get current usage statistics
-   `POST /billing/usage/sync`: Synchronize usage with Stripe

### Subscription Management

-   `POST /billing/subscriptions`: Create subscription
-   `PUT /billing/subscriptions/:id`: Update subscription
-   `DELETE /billing/subscriptions/:id`: Cancel subscription

### Billing Portal

-   `POST /billing/portal-sessions`: Create billing portal session

## Error Handling

Common error scenarios handled:

1. Customer not found (falls back to default customer)
2. Failed meter events
3. Usage sync failures
4. Payment processing errors

## Configuration

### Environment Variables

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_STANDARD=price_...
STRIPE_PRICE_ID_PREMIUM=price_...

# Default Customer
DEFAULT_STRIPE_CUSTOMER_ID=cus_...

# Trial Configuration
TRIAL_PLAN_EXECUTIONS=1000
PUBLIC_ORG_ID=org_...
```

## Best Practices

### Usage Tracking

-   Validate usage before processing
-   Use batch processing for efficiency
-   Maintain comprehensive metadata
-   Implement proper error handling

### Security

-   Secure API key management
-   Webhook signature verification
-   Transaction-based updates
-   Proper error status codes

## Monitoring

### Key Metrics

1. Usage patterns per organization
2. Payment success/failure rates
3. Meter event processing status
4. API endpoint performance
5. Webhook reliability

### Regular Tasks

1. Validate usage calculations
2. Monitor failed payments
3. Update pricing configurations
4. Review security settings
5. Audit access logs

For technical implementation details, refer to:

-   [Usage Tracking Technical Specification](./docs/pricing/usage-billing-spec.md)
-   [Usage Tracking MVP](./docs/pricing/usage-billing-mvp.md)
-   [Usage Tracking MVP Progress](./docs/pricing/usage-billing-mvp-progress.md)
