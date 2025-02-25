Querying Perplexity AI using sonar-pro for: What are the best practices for implementing Stripe's usage-based billing?
Here are the key best practices for implementing Stripe's usage-based billing:

1. Create a meter to specify how to aggregate usage events over a billing period[2].

2. Set up pricing using metered billing and choose an appropriate pricing model (e.g. flat fee per unit, tiered, graduated)[4].

3. Create a Stripe customer and subscription for the usage-based plan[2].

4. Record usage data by creating usage records associated with the customer's subscription item ID[5]. Include:

    - Subscription item ID
    - Quantity used
    - Timestamp

5. Use idempotency keys when reporting usage to prevent duplicate records[9].

6. Ensure timestamps are within the current billing period[9].

7. Consider "bundling" usage into larger units if exceeding API rate limits (e.g. report per 1000 requests instead of per request)[9].

8. Use the `increment` action (default) for prices with `aggregate_usage=sum`. Use `set` action for self-aggregated usage[9].

9. Account for potential clock drift by utilizing the short grace period at the start of billing periods[9].

10. Monitor webhook events related to subscription status changes, especially for free trials[5].

11. Implement proper error handling and retry logic for usage reporting[1].

12. Provide real-time visibility into usage data for customers[3].

Code example for recording usage:

```python
import stripe
stripe.api_key = "sk_test_..."

stripe.SubscriptionItem.create_usage_record(
  "si_1234",
  quantity=100,
  timestamp=1635724800,
  action='increment'
)
```

citations:

1. https://www.wingback.com/blog/implementiing-usage-based-billing-with-stripee
2. https://docs.stripe.com/billing/subscriptions/usage-based/implementation-guide
3. https://stripe.com/blog/three-ways-our-usage-based-billing-product-is-unique
4. https://docs.stripe.com/billing/subscriptions/usage-based-legacy
5. https://docs.stripe.com/billing/subscriptions/usage-based/pricing-models
6. https://openmeter.io/blog/implementing-usage-based-pricing-with-stripe
7. https://docs.stripe.com/billing/subscriptions/usage-based
8. https://www.roastmypricingpage.com/blog/implementing-usage-based-pricing-with-stripe
9. https://docs.stripe.com/billing/subscriptions/usage-based-legacy/recording-usage
10. https://stripe.com/resources/more/usage-based-billing-explained-how-it-works-and-how-to-optimize-its-benefits
