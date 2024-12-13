# Requirements for MVP Spike: Usage Tracking System with Stripe Billing Integration

## Overview

This document outlines the requirements for implementing an MVP version of the usage tracking system. The primary focus is on extending the existing Langfuse trace integration to include Stripe billing with meters. The implementation should demonstrate end-to-end functionality and serve as a proof of concept.

---

## Analysis of the Existing System

### Langfuse Integration

-   Tracks traces, spans, and events for chains, LLMs, and tools.
-   Provides automatic metadata collection (e.g., Chatflow ID, User ID, Session ID).
-   Handles retries and error management internally.

### Key Relationships:

-   Langfuse captures usage events, while Stripe processes billing based on those events.
-   Metadata from Langfuse traces is essential for accurate billing.
-   New endpoints and dependencies are required for synchronizing Langfuse data with Stripe meters.

---

## New Requirements

### Functional Requirements

1. **Usage Tracking Enhancements:**

    - Collect additional metadata (Customer ID, subscription tier, usage quotas, and cost center).
    - Categorize usage types (LLM, compute, storage).

2. **Stripe Integration:**

    - Synchronize usage data with Stripe meters.
    - Send data on a 1:1 basis, aligning Stripe events directly with Langfuse traces unless aggregation is absolutely required.
    - Support invoicing, subscription, and customer management.

3. **Error Handling:**

    - Implement robust error recovery mechanisms for failed Stripe updates.
    - Ensure trace data consistency during retries.

4. **Customer Authentication and Management:**

    - Seamless integration with Auth0 for user authentication.
    - Link Auth0 user IDs to Stripe customer records without duplicating data.

5. **Monitoring & Alerts:**

    - Detect anomalies in usage spikes.
    - Notify thresholds nearing quota limits.

6. **Webhooks:**

    - Implement Stripe webhooks to track payment failures, subscription changes, and usage quota breaches.

---

## Updated Approach: Langfuse-to-Stripe Sync Mechanism

### Core Process

1. **Sparks Conversion Logic:**

    - **Definition:** "Sparks" is a virtual currency representing usage costs across AI tokens, compute time, and storage.
    - **Conversion Table:**
        - AI Tokens: 1,000 tokens = 100 Sparks ($0.10)
        - Compute Time: 1 minute = 50 Sparks ($0.05)
        - Storage: 1 GB/month = 500 Sparks ($0.50)
    - **Implementation:**
        - Each Langfuse trace includes metadata (e.g., tokens used, compute duration, storage size).
        - Conversion logic maps usage metrics to Sparks using a multiplier.
        - This conversion is executed within the integration layer before syncing with Stripe.

2. **Pricing Management:**

    - **Flat Pricing:**
        - Sparks have a fixed conversion rate to USD ($0.001 per Spark).
    - **Volume Discounts (Optional):**
        - Predefined discount tiers (e.g., 5% for over 10,000 Sparks).
        - Managed via pricing configuration or Stripe discount objects.
    - **Configuration:**
        - Pricing is centrally managed in an environment variable or JSON file.
        - Example:
            ```json
            {
                "spark_rate": 0.001,
                "volume_discounts": [{ "threshold": 10000, "discount": 0.05 }]
            }
            ```

3. **Monthly Billing Cycle Logic:**

    - **Cycle Definition:**
        - Usage is aggregated for each customer starting on the 1st of each month.
        - Billing resets at midnight UTC on the last day of the month.
    - **Implementation:**
        - A scheduler runs daily to ensure usage is properly tracked.
        - At the end of the cycle:
            1. All accumulated Sparks are synced with Stripe as metered usage.
            2. Invoices are generated automatically via Stripe.
    - **Proration:**
        - Stripe handles mid-cycle changes (e.g., subscription upgrades) using prorated calculations.

4. **Usage Reports for Customers:**

    - **Purpose:** Provide transparency on usage and costs.
    - **Report Content:**
        - Breakdown by resource type (AI tokens, compute, storage).
        - Total Sparks consumed and equivalent cost in USD.
        - Current subscription tier and remaining quotas.
    - **Delivery:**
        - Access through a `GET /usage/report` API endpoint.
        - Optionally include monthly email reports.
    - **Example Response:**
        ```json
        {
            "customer_id": "cust_123",
            "usage_summary": {
                "ai_tokens": { "used": 5000, "sparks": 500 },
                "compute_time": { "used": 120, "sparks": 600 },
                "storage": { "used": 2, "sparks": 1000 }
            },
            "total_sparks": 2100,
            "total_cost_usd": 2.1
        }
        ```

5. **Subscription Tier Feature Access:**

    - **Tiers Definition:**
        - Free: Limited to 10,000 Sparks/month, basic feature set.
        - Standard: Unlimited Sparks, advanced workflows.
        - Enterprise: Unlimited Sparks, custom SLAs.
    - **Feature Restrictions:**
        - Use feature flags to control access based on the subscription tier.
        - Implement restrictions server-side (e.g., API rate limits, feature toggles).
    - **Integration with Auth0:**
        - Use Auth0 roles or metadata to link users to their subscription tier.
        - Fetch subscription details dynamically from Stripe and store minimally in Auth0 profiles.

6. **Webhook Handling:**

    - Receive Stripe webhooks for events like payment failures, subscription updates, and invoice generation.
    - Process these webhooks to adjust internal logic dynamically (e.g., pausing accounts on failed payments).

---

## New Endpoints

1. **POST /usage/sync**

    - **Description:** Pulls usage data from Langfuse and updates Stripe meters.
    - **Input:**
        - `trace_id` (optional): Specific trace to sync if needed.
    - **Output:**
        - `status`: Success or failure.
        - `processed_traces`: List of traces synced with Stripe.

2. **POST /usage/errors/retry**

    - **Description:** Retries failed updates for Stripe.
    - **Input:**
        - `error_id`: Identifier for the failed update.
    - **Output:**
        - `status`: Retry result.

3. **POST /stripe/webhook**

    - **Description:** Handles incoming webhooks from Stripe.
    - **Input:**
        - Webhook payload containing event type and data.
    - **Output:**
        - `status`: Success or failure.
        - `action_taken`: Description of the action performed in response to the webhook.

4. **GET /usage/report**

    - **Description:** Provides a detailed usage report for customers.
    - **Input:**
        - User authentication via Auth0.
    - **Output:**
        - JSON report summarizing usage and associated costs.

5. **POST /subscriptions/update**

    - **Description:** Updates the user's subscription plan.
    - **Input:**
        - `subscription_tier`: Desired subscription tier.
    - **Output:**
        - `status`: Success or failure.
        - `updated_subscription`: Updated subscription details.

---

## New Dependencies

1. **Stripe SDK:**

    - For interacting with Stripe APIs, including customer, subscription, and invoicing management.

2. **Langfuse SDK Updates:**

    - Ensure trace metadata supports new billing fields.

3. **Auth0 Integration:**

    - Use Auth0's user management APIs to link user accounts to Stripe customers seamlessly.

4. **Webhook Signature Verification:**

    - Validate Stripe webhook signatures to ensure security.

---

## Service Configurations

### Environment Variables

1. **Stripe Configuration:**

    - `STRIPE_API_KEY`: Stripe secret key.
    - `STRIPE_METER_PREFIX`: Prefix for usage meter identifiers.
    - `STRIPE_WEBHOOK_SECRET`: Secret for verifying webhook signatures.

2. **Langfuse Configuration:**

    - `LANGFUSE_SECRET_KEY`: Secret key for Langfuse API.
    - `LANGFUSE_BASE_URL`: Base URL for Langfuse.

3. **Auth0 Configuration:**

    - `AUTH0_DOMAIN`: Auth0 domain for authentication.
    - `AUTH0_CLIENT_ID`: Client ID for Auth0.
    - `AUTH0_CLIENT_SECRET`: Client secret for Auth0.

4. **General Configurations:**

    - `USAGE_RETENTION_DAYS`: Number of days to retain raw usage data.
    - `SYNC_SCHEDULE`: Interval for the sync job (e.g., "hourly").

### Billing Metadata Fields

-   `customer_id`
-   `subscription_tier`
-   `rate_info`
-   `quota_limits`

---

## Third-Party Configurations

### Stripe

1. Set up meters in Stripe.

    - Define usage categories: LLM, compute, storage.
    - Assign meters to test subscriptions.

2. Configure webhooks for usage updates and payment events.

    - Triggered on quota thresholds or subscription status changes.

3. Set up test customers for staging.

4. Configure invoicing for automatic generation and email delivery.

### Langfuse

1. Verify trace metadata includes `customer_id`, `rate_info`, and `usage_category`.
2. Test trace capture for all usage events.

### Auth0

1. Ensure all user accounts are managed via Auth0.
2. Link Auth0 user IDs to Stripe customer records during signup or first billing interaction.
3. Use Auth0-provided JWTs for secure authentication of API requests.

---

## Dev Notes

1. **Trace Consistency:**

    - Ensure every trace includes billing metadata before syncing with Stripe.

2. **Rate Caching:**

    - Implement in-memory caching for rate information to reduce API calls.

3. **Audit Logging:**

    - Log all Stripe updates for traceability.

4. **Retry Policies:**

    - Use exponential backoff for retrying failed updates.

5. **Usage Syncing:**

    - Send Langfuse traces to Stripe on a 1:1 basis.
    - Use scheduled jobs or event-driven triggers for periodic syncing.

6. **Webhook Management:**

    - Securely handle Stripe webhooks to dynamically respond to events like payment failures or quota breaches.

7. **Customer and Subscription Management:**

    - Automatically create Stripe customer records for Auth0 users.
    - Manage subscription changes through API endpoints and webhooks.

8. **Invoicing:**

    - Ensure accurate invoicing based on Stripe's usage-based billing capabilities.
    - Track invoice statuses and failures using webhooks.

9. **Reconciliation:**

    - Perform periodic consistency checks between Langfuse and Stripe data to ensure accuracy.

---

## Out of Scope

1. Advanced quota management.
2. Multi-tier rate handling for subscriptions.
3. Detailed analytics dashboards.

## Additional Information

For technical implementation details, please refer to:

-   [Usage Billing ](./usage-billing.md)
-   [Usage Tracking spec](./usage-billing-spec.md)
-   [Usage Tracking MVP Progress](./usage-billing-mvp-progress.md)
-   [Stripe API Documentation](https://stripe.com/docs/api)
-   [Langfuse Documentation](https://langfuse.com/docs)
