Querying Perplexity AI using sonar-pro for: Stripe SDK usage for Meter Events
To use the Stripe SDK for Meter Events:

1. Install the Stripe SDK for your language (e.g. Python, Ruby, PHP, etc.).

2. Configure the SDK with your Stripe API key:

```python
import stripe
stripe.api_key = "sk_test_..."
```

3. Create a meter event:

```python
meter_event = stripe.billing.MeterEvent.create(
  event_name="alpaca_ai_tokens",
  payload={
    "stripe_customer_id": "cus_123456",
    "value": 100
  }
)
```

4. For high-throughput usage, use meter event streams:

```python
# Create a session
session = stripe.billing.MeterEventSession.create()

# Use session token to create events
stripe.billing.MeterEventStream.create(
  session_token=session.token,
  events=[
    {
      "event_name": "alpaca_ai_tokens",
      "payload": {
        "stripe_customer_id": "cus_123456",
        "value": 100
      }
    }
  ]
)
```

5. Handle errors by checking for 429 status codes and implementing retries with exponential backoff[1].

6. Use idempotency keys to prevent duplicate events[1].

7. Ensure timestamps are within the past 35 days and not more than 5 minutes in the future[1].

The SDK supports up to 1,000 events per second in live mode. For higher volumes, use meter event streams which support up to 10,000 events per second[2].

citations:

1. https://docs.stripe.com/billing/subscriptions/usage-based/recording-usage-api
2. https://docs.stripe.com/changelog/acacia/2024-09-30/usage-based-billing-v2-meter-events-api
3. https://docs.stripe.com/billing/subscriptions/usage-based/recording-usage
4. https://docs.stripe.com/api/v2/billing-meter
5. https://docs.stripe.com/billing/subscriptions/usage-based/implementation-guide
6. https://insiders.stripe.dev/t/metered-billing/3728
7. https://docs.stripe.com/api/billing/meter-event
8. https://docs.stripe.com/billing/subscriptions/usage-based
