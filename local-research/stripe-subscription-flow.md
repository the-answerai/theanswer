Querying Perplexity AI using sonar-pro for: Stripe creating subscriptions, retrieving event summaries, viewing subscription status, subscribe flow
To create a Stripe subscription:

1. Create a Product and Price in the Stripe Dashboard[1].

2. On the frontend, pass the selected price ID and customer ID to the backend[4]:

```javascript
fetch('/create-subscription', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        priceId: priceId,
        customerId: customerId
    })
})
```

3. On the backend, create the subscription[4]:

```ruby
subscription = Stripe::Subscription.create(
  customer: customer_id,
  items: [{ price: price_id }],
  payment_behavior: 'default_incomplete',
  payment_settings: {save_default_payment_method: 'on_subscription'},
  expand: ['latest_invoice.payment_intent']
)
```

4. Return the client secret to complete payment on the frontend[4].

To retrieve event summaries[2]:

```ruby
Stripe::BillingMeter.list_event_summaries(
  'mtr_123',
  customer: 'cus_123',
  start_time: 1711584000,
  end_time: 1711666800,
  value_grouping_window: 'hour'
)
```

Subscription statuses[3][6]:

-   incomplete: First payment pending
-   incomplete_expired: First payment failed after 23 hours
-   trialing: In trial period
-   active: In good standing
-   past_due: Recent invoice failed
-   canceled: Subscription canceled
-   unpaid: Invoices open but not attempting payment

To view subscription status[9]:

1. Stripe Dashboard: Subscriptions section
2. WPForms plugin: WPForms > Payments > Overview

Subscription flow[1][4]:

1. Customer selects plan
2. Create Subscription object with 'incomplete' status
3. Collect payment details and confirm payment
4. Subscription becomes 'active' if payment succeeds

citations:

1. https://www.youtube.com/watch?v=Nk4TAvScoRY
2. https://docs.stripe.com/api/billing/meter-event-summary
3. https://mrcoles.com/stripe-api-subscription-status/
4. https://docs.stripe.com/billing/subscriptions/build-subscriptions?platform=web&ui=elements
5. https://docs.stripe.com/api/events/retrieve
6. https://checkoutpage.co/help/articles/subscription-status
7. https://docs.stripe.com/no-code/subscriptions
8. https://docs.stripe.com/api/billing/meter-event-summary/list
9. https://wpforms.com/how-to-track-stripe-subscription-status-in-wordpress/
10. https://www.youtube.com/watch?v=4YjsG8u2QFA
