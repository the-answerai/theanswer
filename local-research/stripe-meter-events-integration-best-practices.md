Querying Perplexity AI using sonar-pro for: Stripe Meter Events integration best practices
Here are the key best practices for integrating Stripe Meter Events:

1. Configure your meter before sending meter events[1]:

    - Create a meter specifying the event name, aggregation method, etc.
    - Attach the meter to a price for billing

2. Send meter events with required data[1]:

    - Event name (configured on meter)
    - Customer ID
    - Numerical usage value
    - Timestamp (optional)

3. Use idempotency keys to prevent duplicate events[1]

4. Ensure event timestamps are within allowed range[1]:

    - Within past 35 days
    - Not more than 5 minutes in future

5. Only use whole number values for usage[1]

6. Handle rate limits[1]:

    - 1000 calls/sec in live mode
    - 1 concurrent call per customer per meter
    - Bundle usage into larger amounts if needed

7. Use high-throughput ingestion API v2 for higher volumes[1]:

    - Up to 10,000 events/sec
    - Create meter event session for auth token
    - Use meter event stream endpoint

8. Handle meter event errors[1]:

    - Listen for error events like `v1.billing.meter.error_report_triggered`
    - Set up event destination to receive error events
    - Implement error handling and retry logic

9. Design for out-of-order and duplicate events[3]:

    - Don't assume events arrive in order
    - Make event processing idempotent

10. Fetch latest object state when processing events[2]:

    - Thin events only contain IDs, not full object data
    - Use SDK helpers to retrieve associated records

11. Monitor and alert on webhook processing errors[3]

12. Use AWS services for scalable webhook handling[3]:
    - API Gateway to receive webhooks
    - Lambda to verify signatures
    - SQS for queueing
    - Lambda for processing

Example meter event creation:

```python
stripe.MeterEvent.create(
  event_name="alpaca_ai_tokens",
  payload={
    "value": 25,
    "stripe_customer_id": "cus_123"
  }
)
```

citations:

1. https://docs.stripe.com/billing/subscriptions/usage-based/recording-usage-api
2. https://docs.stripe.com/event-destinations
3. https://www.stigg.io/blog-posts/best-practices-i-wish-we-knew-when-integrating-stripe-webhooks
4. https://docs.stripe.com/billing/subscriptions/designing-integration
5. https://docs.stripe.com/billing/subscriptions/usage-based/implementation-guide
6. https://docs.stripe.com/api/billing/meter-event
7. https://stripe.com/billing/usage-based-billing
8. https://docs.stripe.com/api/events
