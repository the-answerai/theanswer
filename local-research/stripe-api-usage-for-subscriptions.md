Querying Perplexity AI using sonar-pro for: Stripe API usage for subscriptions
To use the Stripe API for subscriptions:

1. Create a customer:

```python
customer = stripe.Customer.create(
  email='customer@example.com',
  payment_method='pm_card_visa',
  invoice_settings={'default_payment_method': 'pm_card_visa'}
)
```

2. Create a subscription:

```python
subscription = stripe.Subscription.create(
  customer=customer.id,
  items=[{'price': 'price_1234'}],
  payment_behavior='default_incomplete',
  expand=['latest_invoice.payment_intent']
)
```

3. Handle the initial payment:

```python
if subscription.status == 'incomplete':
  payment_intent = subscription.latest_invoice.payment_intent
  # Send payment_intent.client_secret to client to confirm payment
```

4. Listen for webhook events:

```python
@app.route('/webhook', methods=['POST'])
def webhook():
  event = stripe.Event.construct_from(request.json, stripe.api_key)

  if event.type == 'invoice.paid':
    subscription_id = event.data.object.subscription
    # Provision access for customer
  elif event.type == 'invoice.payment_failed':
    # Handle failed payment
```

5. Record usage for metered billing:

```python
stripe.SubscriptionItem.create_usage_record(
  'si_1234',
  quantity=100,
  timestamp=int(time.time())
)
```

Key points:

-   Use `payment_behavior='default_incomplete'` when creating subscriptions
-   Confirm initial payment client-side using PaymentIntent
-   Listen for webhook events to provision access and handle failures
-   Record usage for metered billing subscriptions[1][3][4][6][8]

citations:

1. https://docs.stripe.com/billing/subscriptions/usage-based/implementation-guide
2. https://www.youtube.com/watch?v=4YjsG8u2QFA
3. https://docs.stripe.com/billing/subscriptions/overview
4. https://docs.stripe.com/billing/subscriptions/usage-based-legacy/recording-usage
5. https://docs.stripe.com/billing/subscriptions/usage-based-legacy
6. https://docs.stripe.com/api/usage_records
7. https://docs.stripe.com/billing/subscriptions/usage-based
8. https://docs.stripe.com/api/subscriptions
