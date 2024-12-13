## **1. Validate Current Setup**

1. [ ] **Confirm Flowise → Langfuse Tracing**
    - Ensure Flowise usage events (tokens, compute time, storage) arrive in Langfuse.
    - Verify existing Langchain + Flowise integration is functioning.
    - Ensure required metadata is being added to the traces.
2. [ ] **Review Project Structure**
    - Validate code organization for modules handling billing, sync, webhooks, etc.
    - Note any refactoring needed for MVP add-ons.

---

## **2. Establish Core Billing Definitions**

3. [ ] **Define Usage Categories & Metadata**

    - AI tokens, compute minutes, storage size.
    - Additional fields: Customer ID, subscription tier, cost center.

4. [ ] **Confirm Sparks Conversion**

    - AI Tokens: 1,000 tokens = 100 Sparks ($0.10)
    - Compute: 1 minute = 50 Sparks ($0.05)
    - Storage: 1 GB/month = 500 Sparks ($0.50)
    - Spark rate = $0.001 per Spark.

5. [ ] **Volume Discounts**
    - If usage > 10,000 Sparks, apply 5% discount.
    - Decide config approach (JSON, DB, environment variable).

---

## **3. Stripe Setup**

6. [ ] **Create Metered Products**

    - Set up LLM (tokens), Compute, and Storage products in Stripe.
    - Enable usage-based billing (Stripe meters).

7. [ ] **Configure Webhooks in Stripe**

    - Payment failures, subscription changes, invoice creation.
    - Set up test environment with `STRIPE_API_KEY`, `STRIPE_WEBHOOK_SECRET`.

8. [ ] **Test Customers & Subscriptions**
    - Create a few test customers in Stripe to simulate the billing cycle.
    - Assign them usage-based subscriptions.

---

## **4. Environment & Service Config**

9. [ ] **Render Environment Variables**

    - Stripe: `STRIPE_API_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_METER_PREFIX`.
    - Langfuse: `LANGFUSE_SECRET_KEY`, `LANGFUSE_BASE_URL`.
    - Auth0: `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`.
    - Others: `SPARK_RATE=0.001`, optional `USAGE_RETENTION_DAYS`, `SYNC_SCHEDULE`.

10. [ ] **Langfuse SDK Updates**

-   Make sure Langfuse usage traces include `customer_id`, `subscription_tier`, usage category.
-   Plan to add “Sparks” calculations in the integration layer if needed.

---

## **5. Develop Integration Layer**

11. [ ] **Implement 1:1 Trace-to-Stripe Sync**

-   Unless absolutely needed, sync each Langfuse trace individually to Stripe.
-   Convert usage → Sparks just-in-time.

12. [ ] **Build Sparks Conversion Function**

-   Accept AI tokens, compute time, storage; return Sparks.
-   Apply volume discount logic if threshold met.

13. [ ] **Usage Aggregation (If Required)**

-   If partial aggregation is needed, create aggregator to store daily usage before syncing.
-   Mark usage as “billed” in aggregator or trace metadata.

---

## **6. Endpoints & APIs**

14. [ ] **POST /usage/sync**

-   Pull new Langfuse usage events.
-   Convert each usage item → Sparks.
-   Update corresponding Stripe meter usage.
-   Return sync status & processed trace IDs.

15. [ ] **POST /usage/errors/retry**

-   Retry failed Stripe sync attempts by `error_id`.
-   Update logs to success/failure upon retry.

16. [ ] **POST /stripe/webhook**

-   Verify signature.
-   Handle payment failures (pause usage?), subscription changes, invoice generation.
-   Log or update DB based on event type.

17. [ ] **GET /usage/report**

-   Return monthly usage data, Sparks total, equivalent USD cost.
-   Break down by category (AI tokens, compute, storage).
-   Show subscription tier & discounts if any.

18. [ ] **POST /subscriptions/update**

-   Accept new `subscription_tier`.
-   Update Stripe subscription object (proration automatically handled by Stripe).
-   Return updated subscription details.

---

## **7. Error Handling & Logging**

19. [ ] **Error Logging & Persistence**

-   Use a DB or robust log store to track failed Stripe updates.
-   Store relevant usage data for easy retry.

20. [ ] **Exponential Backoff Retries**

-   For repeated errors, space out retry attempts.
-   Update logs on each attempt.

21. [ ] **Trace Consistency**

-   Ensure each trace from Flowise includes correct metadata before sending to Stripe.
-   If metadata is missing, log error for manual resolution.

22. [ ] **Audit Logging**

-   Log every Stripe usage update event.
-   Keep separate logs for Stripe webhooks.

---

## **8. Customer Authentication & Management**

23. [ ] **Auth0 Integration**

-   For each user signup, link Auth0 user → Stripe customer.
-   Store `stripe_customer_id` in Auth0 metadata or a local DB table.

24. [ ] **Subscription Tier Feature Access**

-   Free tier: 10,000 Sparks/month limit.
-   Standard + Enterprise: unlimited or custom quotas.
-   Implement feature flags or server-side checks for tier-limited features.

---

## **9. Monthly Billing Cycle**

25. [ ] **Define Billing Cycle**

-   Usage aggregates reset on the 1st of each month.
-   Stripe auto-generates invoices after usage finalization.

26. [ ] **End-of-Month Sync**

-   On last day (midnight UTC), finalize usage from aggregator.
-   Call `/usage/sync` if not already done.
-   Stripe closes out monthly invoice cycle.

27. [ ] **Proration & Mid-Cycle Changes**

-   Stripe automatically prorates subscription upgrades.
-   Ensure sync logic handles partial usage in old tier vs new tier.

---

## **10. Monitoring & Alerts**

28. [ ] **Usage Threshold Monitoring**

-   Send alerts (email or Slack) when usage nears monthly limit for Free tier.
-   Detect usage spikes that could indicate errors or abuse.

29. [ ] **Webhook & Payment Failures**

-   On payment failure event, optionally throttle or suspend usage.
-   Notify user to update payment method.

30. [ ] **Logs & Alerts Integration**

-   Use Render logs or third-party monitoring to watch for repeated sync errors.
-   Set up notifications for critical webhook failures.

---

## **11. Testing & Validation**

31. [ ] **E2E Tests (Staging)**

-   Simulate Flowise usage events (tokens, compute, storage).
-   Confirm conversion → Sparks → Stripe invoice.
-   Exercise subscription tier changes mid-cycle.

32. [ ] **Security & Webhook Signature Checks**

-   Make sure `/stripe/webhook` validates the signature properly.
-   Confirm all MVP endpoints require Auth0 tokens for user-level data.

33. [ ] **Error Handling Tests**

-   Force Stripe errors to validate retry logic.
-   Check aggregator consistency for missed usage events.

---

## **12. Deployment & Maintenance**

34. [ ] **CI/CD on Render**

-   Automatic testing and build upon commit.
-   Deploy to staging for each push, then to prod on approval.

35. [ ] **Production Launch**

-   Switch to live Stripe keys, final environment variables.
-   Keep aggregator DB or logs from staging if relevant.

36. [ ] **Post-Launch Monitoring & Reconciliation**

-   Compare Langfuse usage vs. Stripe bills for accuracy.
-   Fine-tune discount logic or usage thresholds as needed.

37. [ ] **Feature Enhancements (Out of Scope for MVP)**

-   Advanced quota management.
-   Detailed analytics dashboards.
-   Multi-tier rate handling or custom SLA expansions.
