Querying Perplexity AI using sonar-pro for: Stripe advanced subscription features
Stripe offers several advanced subscription features:

1. Flexible pricing models: Support for flat-rate, per-seat, usage-based, and tiered pricing[2][9].

2. Subscription lifecycle management: Automated handling of trials, activations, cancellations, and renewals[5].

3. Proration: Automatically prorate billing when plans are upgraded, downgraded, canceled, or paused[3].

4. Metered billing: Bill customers based on usage with the Meters API[3].

5. Subscription schedules: Schedule subscription updates ahead of time[3].

6. Entitlements: Control feature access based on subscription status using the Entitlements API[7].

7. Multiple items per subscription: Create subscriptions with multiple products billed in a single invoice[1].

8. Dunning management: Custom retry strategies for failed payments[3].

9. Customer portal: Self-service portal for customers to manage subscriptions[3].

10. Smart retries: Machine learning-based payment retry system to reduce involuntary churn[4].

11. Subscription migrations: Tools to migrate subscriptions from other systems[3].

12. Test clocks: Simulate subscription lifecycle events for testing[3].

13. Revenue recognition: Automated accrual accounting and revenue reporting[3].

Example code for creating a subscription with usage-based pricing:

```python
subscription = stripe.Subscription.create(
  customer='cus_123',
  items=[{'price': 'price_123'}],
  payment_behavior='default_incomplete',
  payment_settings={'save_default_payment_method': 'on_subscription'},
  expand=['latest_invoice.payment_intent']
)
```

This creates a subscription with status 'incomplete' and saves the payment method for future billing[6].

citations:

1. https://docs.stripe.com/billing/subscriptions/features
2. https://www.iteratorshq.com/blog/stripe-essentials-types-of-subscriptions-and-payments/
3. https://stripe.com/billing/features
4. https://stripe.com/billing
5. https://docs.stripe.com/billing/subscriptions/overview
6. https://docs.stripe.com/billing/subscriptions/build-subscriptions?platform=web&ui=elements
7. https://docs.stripe.com/billing/entitlements
8. https://stripe.com/resources/more/subscription-management-features-explained-and-how-to-choose-a-software-solution
9. https://docs.stripe.com/products-prices/pricing-models
10. https://stripe.com/payments/features
