# Usage Tracking Technical Specification

## System Architecture

Flowise's usage tracking system leverages Langfuse integration for precise usage monitoring and Stripe for billing. This document details the technical implementation.

### Core Components

1. **Usage Collection System**

    - Langfuse SDK integration for usage tracking
    - Real-time event capture for all billable operations
    - Automatic metadata collection
    - Built-in retry and error handling

2. **Usage Processing Pipeline**

    - Batch processing of usage events
    - Automatic trace creation and metadata collection
    - Customer attribution
    - Real-time rate application

3. **Billing Integration**
    - Direct Stripe meter integration
    - Usage-based billing with Sparks
    - Subscription management
    - Automated invoicing

## Usage Types Implementation

### Resource Types

1. **AI Tokens (ai_tokens_sparks)**

    - Rate: 100 Sparks per 1,000 tokens
    - Base cost: $0.001 per Spark
    - Margin multiplier: 1.2
    - Automatic token counting

2. **Compute Usage (compute_sparks)**

    - Rate: 50 Sparks per minute
    - Base cost: $0.001 per Spark
    - Margin multiplier: 1.2
    - Real-time compute tracking

3. **Storage Usage (storage_sparks)**
    - Rate: 500 Sparks per GB/month
    - Base cost: $0.001 per Spark
    - Margin multiplier: 1.2
    - Monthly storage calculation

## Implementation Details

### Usage Tracking Flow

```typescript
interface TraceMetadata {
    chatId?: string
    chatflowid?: string
    userId?: string
    customerId?: string
    subscriptionId?: string
    subscriptionTier?: string
    stripeBilled?: boolean
    stripeProcessing?: boolean
    stripeProcessingStartedAt?: string
    stripeBilledAt?: string
    sparksBilled?: Record<string, number>
    stripeError?: string
    stripeBilledTypes?: string[]
    stripePartialBilled?: boolean
}
```

### Stripe Integration

```typescript
const STRIPE_CONFIG = {
    SPARK_TO_USD: 0.0001,
    SPARKS: {
        METER_ID: 'mtr_test_61RqbeVr5wxWsemTV41FeRAHyP6byAfw',
        METER_NAME: 'sparks',
        BASE_PRICE_USD: 0.0001,
        MARGIN_MULTIPLIER: 1.3
    }
}
```

### Batch Processing

```typescript
async syncUsageToStripe(sparksData: SparksData[]): Promise<{
    meterEvents: Stripe.Billing.MeterEvent[]
    failedEvents: Array<{ traceId: string; error: string }>
    processedTraces: string[]
}> {
    const BATCH_SIZE = 15
    const DELAY_BETWEEN_BATCHES = 1000

    for (let i = 0; i < sparksData.length; i += BATCH_SIZE) {
        const batch = sparksData.slice(i, i + BATCH_SIZE)
        // Process batch
        // Update trace metadata
        // Handle errors
    }
}
```

## Usage Statistics

### Data Structure

```typescript
interface UsageStats {
    ai_tokens: UsageMetric
    compute: UsageMetric
    storage: UsageMetric
    total_sparks: number
    total_cost: number
    billing_period: {
        start: string
        end: string
    }
}
```

### Meter Event Processing

```typescript
interface MeterEvent {
    payload: {
        value: string
        stripe_customer_id: string
        trace_id: string
        base_cost: string
        total_cost: string
        margin: string
        ai_sparks: string
        compute_sparks: string
        storage_sparks: string
        dateTimestamp?: string
    }
}
```

## Error Handling

1. **Customer Not Found**

    - Fallback to default customer
    - Error logging
    - Retry mechanism

2. **Failed Events**

    - Batch retry logic
    - Error tracking
    - Manual intervention triggers

3. **Usage Sync Failures**
    - Automatic retries
    - Error reporting
    - Data consistency checks

## Security Considerations

1. **API Security**

    - Secure key management
    - Request signing
    - Rate limiting

2. **Data Protection**

    - Encryption at rest
    - Secure transmission
    - Access control

3. **Audit Trail**
    - Comprehensive logging
    - Change tracking
    - Usage verification

## Monitoring

### Key Metrics

1. Usage patterns
2. Sync success rates
3. Error frequencies
4. Processing times
5. Resource utilization

### Alerts

1. Usage spikes
2. Sync failures
3. Error thresholds
4. Rate limit warnings
5. Quota notifications

## Configuration

### Environment Variables

```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
DEFAULT_CUSTOMER_ID=cus_...
LANGFUSE_PUBLIC_KEY=pk_...
LANGFUSE_SECRET_KEY=sk_...
```

### Rate Configuration

```typescript
const BILLING_CONFIG = {
    MARGIN_MULTIPLIER: 1.3,
    BATCH_SIZE: 15,
    RETRY_ATTEMPTS: 3,
    SYNC_INTERVAL: 300000 // 5 minutes
}
```

## API Endpoints

### Usage Tracking

-   `GET /billing/usage/stats`
-   `POST /billing/usage/sync`
-   `GET /billing/usage/report`

### Subscription Management

-   `POST /billing/subscriptions`
-   `PUT /billing/subscriptions/:id`
-   `DELETE /billing/subscriptions/:id`

## Data Retention

| Data Type       | Retention Period |
| --------------- | ---------------- |
| Raw traces      | 30 days          |
| Usage data      | 12 months        |
| Billing records | 7 years          |
| Audit logs      | 12 months        |
