Querying Perplexity AI using sonar-pro for: Stripe Meter Events
Stripe Meter Events allow recording customer usage for usage-based billing. Key points:

-   Meter Events represent raw usage data sent to Stripe[1][2].
-   Events are associated with meters that define payload contents and aggregation[6].
-   Create events via API with event name, customer ID, usage value, and optional timestamp[1][3].
-   Events are processed asynchronously and aggregated by meters[1][2].
-   Rate limit is 1000 calls/second in live mode[1].
-   For higher throughput, use Meter Event Streams API (up to 10,000 events/second)[1].
-   Can view usage details and summaries in Dashboard or via API[4][7].
-   Errors are reported via webhook events[1].
-   Can cancel incorrect events within 24 hours using Meter Event Adjustments[2].

Example API call to create an event:

```bash
curl https://api.stripe.com/v1/billing/meter_events \
-u "sk_test_...:" \
-d event_name=alpaca_ai_tokens \
-d "payload[value]"=25 \
-d "payload[stripe_customer_id]"=cus_123
```

[1][3][5]

citations:

1. https://docs.stripe.com/billing/subscriptions/usage-based/recording-usage-api
2. https://docs.stripe.com/billing/subscriptions/usage-based/recording-usage
3. https://docs.stripe.com/api/billing/meter-event/create
4. https://docs.stripe.com/billing/subscriptions/usage-based/implementation-guide
5. https://docs.stripe.com/api/v2/billing/meter-event/create
6. https://docs.stripe.com/api/billing/meter-event
7. https://docs.stripe.com/api/billing/meter-event-summary/list
8. https://docs.stripe.com/api/events
