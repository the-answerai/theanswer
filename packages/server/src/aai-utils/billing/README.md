# Billing System

Dual-provider system: **Langfuse** (usage tracking) → **Stripe** (metered billing).

## Quick Reference

### Pricing

| Resource | Unit | Credits | Cost |
|----------|------|---------|------|
| AI Tokens | 1K tokens | 100 | $0.004 |
| Compute | 1 minute | 50 | $0.002 |
| Storage | 1 GB/month | 500 | $0.02 |

**Rate**: $0.00004/credit ($20 for 500K)

### Plans

| Plan | Credits/Month | Price |
|------|--------------|-------|
| Free | 10,000 | $0 |
| Pro | 500,000 | $20 |

### Required Environment Variables

```bash
BILLING_STRIPE_SECRET_KEY=sk_xxx
BILLING_STRIPE_WEBHOOK_SECRET=whsec_xxx
BILLING_STRIPE_CREDITS_METER_ID=mtr_xxx
BILLING_STRIPE_FREE_PRICE_ID=price_xxx
BILLING_STRIPE_PAID_PRICE_ID=price_xxx
LANGFUSE_HOST=https://cloud.langfuse.com
LANGFUSE_PUBLIC_KEY=pk_xxx
LANGFUSE_SECRET_KEY=sk_xxx
```

---

## Architecture

### Billing Flow

```
1. CHATFLOW EXECUTION
   ├─ Auth middleware sets req.user.stripeCustomerId
   ├─ Pre-execution billing checks (if enabled)
   └─ Creates Langfuse trace with billing metadata

2. TRACE CREATION (handler.ts:646-665)
   ├─ Injects stripeCustomerId, userId, organizationId
   ├─ Captures aiCredentialsOwnership ('platform' | 'user')
   └─ Records token usage via LangChain callbacks

3. BILLING SYNC (cron every 15 min)
   ├─ Processes traces oldest-first (AAI-761 fix)
   ├─ Filters: billing_status != 'processed'
   └─ Converts usage → credits → Stripe meter events

4. STRIPE BILLING
   └─ Aggregates meter events → invoices
```

### Entity Relationships

```
User ─── stripeCustomerId ──────▶ Stripe Customer
 │                                      │
 └── organizationId ──▶ Organization    │
                        │               │
                        ├── stripeCustomerId (if billingPoolEnabled)
                        └── billingPoolEnabled

Stripe Customer ──▶ Subscription (stripeSubscriptionId, status, creditsLimit)
Stripe Customer ──▶ UsageEvent[] (traceId, creditsConsumed, metadata)
Stripe Webhook  ──▶ StripeEvent (stripeEventId unique for idempotency)
```

### Key Files

| Component | Path |
|-----------|------|
| Orchestrator | `core/BillingService.ts` |
| Stripe | `stripe/StripeProvider.ts` |
| Langfuse | `langfuse/LangfuseProvider.ts` |
| Types | `types.ts`, `*/types.ts` |

---

## Critical Logic

### aiCredentialsOwnership (handler.ts:611-631)

**Determines who pays for LLM costs:**

| Value | Meaning | LLM Cost |
|-------|---------|----------|
| `'platform'` | TheAnswer credentials | Charged to customer |
| `'user'` | Customer's own API keys | $0 |

```typescript
// LangfuseProvider.ts:514-549
const aiCost = aiCredentialsOwnership === 'platform' ? trace.totalCost : 0
const computeCost = computeMinutes * 0.05  // Always charged
```

### 35-Day Stripe Limitation (StripeProvider.ts:307-336)

Stripe rejects meter events >35 days old. System auto-adjusts:

```typescript
if (originalTimestamp < thirtyFiveDaysAgo) {
    return { adjustedTimestamp: thirtyFourDaysAgo, wasAdjusted: true }
}
```

Original dates preserved in trace metadata for auditing.

### Trace Ordering Fix (AAI-761)

**Critical**: Process traces `orderBy: 'timestamp.asc'` (oldest first) to ensure correct billing period allocation.

---

## Organization Billing Pool

Consolidates all users' billing to single organization customer.

### Enable

```bash
BILLING_STRIPE_ORGANIZATION_CUSTOMER_ID=cus_org_main
# OR via DB: organization.billingPoolEnabled = true
```

### Override Points (3 locations)

1. **Auth Middleware** (`middlewares/authentication/index.ts:187,112`)
   - Sets `req.user.stripeCustomerId` during auth

2. **Billing Sync** (`langfuse/LangfuseProvider.ts:589`)
   - Overrides historical trace customer IDs

3. **DB Access** (`utils/buildChatflow.ts:1030`)
   - Applies override for usage limit checks

### Customer ID Resolution Priority

```
1. BILLING_STRIPE_ORGANIZATION_CUSTOMER_ID env var
2. organization.stripeCustomerId + billingPoolEnabled
3. user.stripeCustomerId (existing)
4. Create new Stripe customer
```

---

## API Endpoints

Base: `/api/v1/billing/`

| Endpoint | Auth | Purpose |
|----------|------|---------|
| `GET /usage/summary` | Yes | Period totals + daily breakdown |
| `GET /usage/events` | Yes | Paginated usage history |
| `POST /usage/sync` | No | Trigger Langfuse→Stripe sync |
| `GET /subscription/status` | Yes | Active subscription + usage |
| `POST /subscriptions` | Yes | Create checkout session |
| `DELETE /subscriptions/:id` | Yes | Cancel subscription |
| `GET /customer/status` | No | Customer + plan status |
| `POST /portal-sessions` | Yes | Stripe billing portal |
| `POST /webhooks` | Stripe Sig | Webhook handler |

See `types.ts` for response structures.

---

## Configuration

### Optional Overrides

```bash
# Customer override (dev/testing)
BILLING_OVERRIDE_CUSTOMER_ID=true
BILLING_DEFAULT_STRIPE_CUSTOMER_ID=cus_xxx

# Sync tuning
BILLING_SYNC_CRON_SCHEDULE='*/15 * * * *'
BILLING_SYNC_LOOKBACK_DAYS=7
BILLING_SYNC_CHUNK_SIZE_DAYS=30

# Development
DISABLE_BILLING_CHECKS=true  # Skip credit limit checks
```

See `config.ts` for full configuration object.

---

## Troubleshooting

### Sync Not Running

```bash
echo $ENABLE_BILLING_SYNC_CRON  # should not be 'false'
echo $BILLING_STRIPE_SECRET_KEY # must be set
grep "billing usage sync" logs.txt
curl -X POST http://localhost:3000/api/v1/billing/usage/sync
```

### Rate Limiting

```bash
BILLING_SYNC_RATE_LIMIT_MS=3000
BILLING_PAGE_FETCH_DELAY_MS=1000
BILLING_SYNC_PAGE_BATCH_SIZE=2
```

### Duplicate Charges

Should not happen (idempotent system). Verify:
1. Langfuse trace: `billing_status='processed'`
2. Stripe: duplicate meter event identifiers
3. DB: StripeEvent table for duplicate webhooks

### Customer Not Found

1. Set `BILLING_DEFAULT_STRIPE_CUSTOMER_ID` as fallback
2. Verify `ensureStripeCustomerForUser` middleware runs
3. Check `user.stripeCustomerId` in database

### Old Traces Not Syncing

Stripe 35-day limit. System auto-adjusts. Check logs:
```
Adjusting old timestamp for Stripe
```

### Local Testing

```bash
curl -X POST http://localhost:3000/api/v1/billing/usage/sync
stripe listen --forward-to localhost:3000/api/v1/billing/webhooks
stripe trigger customer.subscription.created
```

---

## References

- [Stripe Metered Billing](https://stripe.com/docs/billing/subscriptions/metered-billing)
- [Langfuse Docs](https://langfuse.com/docs)
