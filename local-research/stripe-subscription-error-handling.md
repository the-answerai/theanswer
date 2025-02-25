Querying Perplexity AI using sonar-pro for: Stripe subscription error handling
Stripe offers several ways to handle subscription errors:

1. Catch exceptions when creating or updating subscriptions[1][2]:

```php
try {
  $subscription = \Stripe\Subscription::create($params);
} catch (\Stripe\Exception\CardException $e) {
  // Handle card errors (e.g. declined)
} catch (\Stripe\Exception\InvalidRequestException $e) {
  // Handle invalid parameters
} catch (\Stripe\Exception\AuthenticationException $e) {
  // Handle authentication errors
} catch (\Stripe\Exception\ApiConnectionException $e) {
  // Handle network errors
} catch (\Stripe\Exception\ApiErrorException $e) {
  // Handle generic API errors
}
```

2. Monitor webhook events[1]:

-   `customer.subscription.updated` - Subscription status changed
-   `invoice.payment_failed` - Payment for subscription failed

3. Check subscription status[1]:

-   `incomplete` - First payment failed
-   `past_due` - Latest payment failed
-   `canceled` - Subscription canceled after failed payments

4. Handle payment failures[1]:

-   Retry failed payments using Smart Retries
-   Send dunning emails to customers
-   Provide hosted payment page link for 3D Secure authentication

5. Manage authentication failures[1]:

```javascript
const { setupIntent, error } = await stripe.confirmCardSetup(clientSecret)
if (error) {
    // Handle error
} else {
    // Setup succeeded
}
```

6. Update payment method if authorization fails[1]

7. Configure retry settings and subscription behavior on failure in Dashboard[1]

8. Use error codes to determine specific issues[8]

9. Implement idempotency for retrying failed API calls[4]

citations:

1. https://docs.stripe.com/billing/subscriptions/overview
2. https://docs.stripe.com/error-handling
3. https://docs.stripe.com/error-handling?lang=node
4. https://docs.stripe.com/error-low-level
5. https://docs.stripe.com/api/errors/handling
6. https://docs.stripe.com/connectors/salesforce-cpq/error-handling
7. https://stripe.dev/blog/simple-error-handling-strategies-with-stripe-workbench
8. https://docs.stripe.com/error-codes
9. https://docs.stripe.com/api/errors/handling?lang=php
