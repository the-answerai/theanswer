# Billing System

Dual-provider billing system combining **Langfuse** (usage tracking) and **Stripe** (metered billing).

## System Flow

```
1. Chatflow Executes → Langfuse trace created with usage data
2. Billing Sync (every 15 min) → Fetches unprocessed traces
3. Usage Conversion → Traces → Credits → USD
4. Stripe Sync → Creates meter events
5. Customer Billed → Stripe charges based on meter events
```

**Key Files**:
- `core/BillingService.ts` - Main orchestrator
- `langfuse/LangfuseProvider.ts` - Usage tracking & sync
- `stripe/StripeProvider.ts` - Payment processing
- `routes/billing/index.ts` - API endpoints

## Quick Reference

### Credit Rates

| Resource | Unit | Credits | Cost |
|----------|------|---------|------|
| AI Tokens | 1,000 tokens | 100 | $0.004 |
| Compute | 1 minute | 50 | $0.002 |
| Storage | 1 GB/month | 500 | $0.02 |

**Pricing**: $0.00004 per credit ($20 for 500k credits)

### Plans

| Plan | Credits/Month | Price |
|------|--------------|-------|
| Free | 10,000 | $0 |
| Pro | 500,000 | $20 |

## Configuration

### Required Environment Variables

```bash
# Stripe
BILLING_STRIPE_SECRET_KEY=sk_xxx
BILLING_STRIPE_CREDITS_METER_ID=meter_xxx
BILLING_STRIPE_FREE_PRICE_ID=price_xxx
BILLING_STRIPE_PAID_PRICE_ID=price_xxx

# Optional: Organizational Billing
BILLING_OVERRIDE_CUSTOMER_ID=true              # Routes all billing to one customer
BILLING_DEFAULT_STRIPE_CUSTOMER_ID=cus_xxx     # Organization's Stripe customer ID
```

### Sync Settings (Optional)

```bash
BILLING_SYNC_CRON_SCHEDULE='*/15 * * * *'      # Default: every 15 minutes
ENABLE_BILLING_SYNC_CRON=true                  # Default: enabled
BILLING_SYNC_LOOKBACK_DAYS=7                   # Default: 7 days
```

## Customer Override (Organizational Billing)

Consolidates all users' billing to single organization customer.

**Enable**:
```bash
BILLING_OVERRIDE_CUSTOMER_ID=true
BILLING_DEFAULT_STRIPE_CUSTOMER_ID=cus_org_main
```

**Implementation** (3 locations):

1. **Auth Middleware** (`middlewares/authentication/index.ts:187,112`)
   - Sets `req.user.stripeCustomerId` during authentication
   - Covers: API calls, chatflow execution, trace creation

2. **Billing Sync** (`langfuse/LangfuseProvider.ts:589`)
   - Overrides historical trace customer IDs during sync
   - Covers: Traces created before override enabled

3. **DB Access** (`utils/buildChatflow.ts:1030`)
   - Applies override when reading user from database
   - Covers: Usage limit enforcement

## Billing Sync

### Automatic Sync (Cron)

**Schedule**: Every 15 minutes (configurable)
**Triggers**: `POST /api/v1/billing/usage/sync`

**Process**:
1. Find oldest unprocessed trace
2. Process in 30-day windows
3. Fetch traces (3-page batches, 5 traces/batch)
4. Filter billable traces (totalCost > 0 OR latency > 0)
5. Convert to credits: `tokens/10 + (latencyMs/60000)*50`
6. Create Stripe meter events
7. Mark processed: `billing_status='processed'`

**Deduplication**:
- API filter: `billing_status != 'processed'`
- Batch flush after each page
- Stripe idempotency (duplicate events auto-rejected)

### Manual Sync

```bash
curl -X POST http://localhost:3000/api/v1/billing/usage/sync
```

## API Endpoints

**Authentication**: All endpoints require `enforceAbility('Billing')` except webhooks/sync.

### Usage
```
GET  /api/v1/billing/usage/summary          # Current period totals
GET  /api/v1/billing/usage/events           # Detailed event history
POST /api/v1/billing/usage/sync             # Trigger sync (no auth)
```

### Subscriptions
```
GET    /api/v1/billing/subscription/status  # Active subscription + usage
POST   /api/v1/billing/subscriptions        # Create checkout session
PUT    /api/v1/billing/subscriptions/:id    # Update subscription
DELETE /api/v1/billing/subscriptions/:id    # Cancel subscription
```

### Customer
```
GET  /api/v1/billing/customer/status        # Customer + plan + usage
POST /api/v1/billing/portal-sessions        # Create billing portal session
```

### Webhooks
```
POST /api/v1/billing/webhooks               # Stripe webhook handler (signature verified)
```

## Implementation Details

### Credit Conversion

**File**: `langfuse/LangfuseProvider.ts:convertCostsToCredits()`

```typescript
const aiCredits = totalTokens / 10
const computeCredits = (latencyMs / 1000 / 60) * 50
const storageCredits = gigabytes * 500
const totalCredits = aiCredits + computeCredits + storageCredits
const costUSD = totalCredits * 0.00004
```

### Trace Metadata

**File**: `packages/components/src/handler.ts:652-653`

Traces capture customer ID during chatflow execution:
```typescript
metadata: {
  stripeCustomerId: options.user?.stripeCustomerId,
  userId: options.user?.id,
  organizationId: options.user?.organizationId,
  aiCredentialsOwnership: 'platform' | 'user'
}
```

### Multi-Tenancy

All queries filter by:
- `organizationId` (required)
- `userId` (for non-admin users)

### Self-Healing

**Stripe Timestamp Limitation** (`stripe/StripeProvider.ts:adjustTimestampForStripe()`):
- Meter events cannot be >35 days old
- System auto-adjusts to 34 days ago
- Prevents sync failures for old traces

## Troubleshooting

**Sync not running?**
```bash
# Check cron is enabled
echo $ENABLE_BILLING_SYNC_CRON  # should not be 'false'
echo $BILLING_STRIPE_SECRET_KEY # should be set

# Check logs
grep "billing usage sync" logs.txt
```

**Duplicate charges?**
- Should not happen (idempotent system)
- Check Langfuse trace metadata: `billing_status='processed'`
- Check Stripe meter events for duplicates

**Rate limiting?**
```bash
# Increase delays
BILLING_SYNC_RATE_LIMIT_MS=3000
BILLING_PAGE_FETCH_DELAY_MS=1000

# Reduce batch sizes
BILLING_SYNC_PAGE_BATCH_SIZE=2
BILLING_SYNC_TRACE_BATCH_SIZE=3
```

## Testing

```bash
# Trigger manual sync
curl -X POST http://localhost:3000/api/v1/billing/usage/sync

# Check customer status
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/billing/customer/status

# Test webhooks (Stripe CLI)
stripe listen --forward-to localhost:3000/api/v1/billing/webhooks
stripe trigger payment_intent.succeeded
```

## References

- **Langfuse Docs**: https://langfuse.com/docs
- **Stripe Metered Billing**: https://stripe.com/docs/billing/subscriptions/metered-billing
- **Stripe Meter Events**: https://stripe.com/docs/api/billing/meter-event
