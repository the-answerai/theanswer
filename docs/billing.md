# Billing System Documentation

## Overview

The billing system implements a hybrid billing model with both trial and paid plans. It uses Stripe for payment processing and tracks usage through execution counts.

### Key Features

-   Trial and Paid Plan Management
-   Usage-based Billing
-   Subscription Management
-   Self-service Billing Portal
-   Usage Tracking

## Architecture

### Core Components

1. **Billing Service** ([`/packages/server/src/services/billing/index.ts`](/packages/server/src/services/billing/index.ts))

    - Handles customer management
    - Manages payment methods
    - Creates checkout sessions
    - Manages subscriptions

2. **Plans Management** ([`/packages/server/src/services/billing/plans.ts`](/packages/server/src/services/billing/plans.ts))
    - Manages trial and paid plans
    - Tracks execution usage
    - Handles plan transitions
    - Maintains plan history

## Plan Types

### Trial Plan

-   Available for public organizations
-   Fixed number of executions (configurable via `TRIAL_PLAN_EXECUTIONS`)
-   Automatically created for new users
-   Tracks used executions

### Paid Plan

-   Organization-based billing
-   Execution-based usage tracking
-   Automatic plan transitions when executions are depleted
-   Historical tracking of plan usage

## Usage Tracking

### Execution Tracking

-   Per-user tracking for trial plans
-   Per-organization tracking for paid plans
-   Real-time execution counting
-   Automatic plan updates based on usage

### Usage Collection

-   Automatic tracking of executions
-   Usage validation before execution
-   Real-time usage monitoring
-   Daily aggregation for billing

## Frontend Implementation

### Key Components

1. **BillingDashboard** ([`/packages-answers/ui/src/billing/BillingDashboard.tsx`](/packages-answers/ui/src/billing/BillingDashboard.tsx))

    - Main billing interface
    - Subscription status display
    - Usage visualization
    - Plan management

2. **BillingOverview** ([`/packages-answers/ui/src/billing/BillingOverview.tsx`](/packages-answers/ui/src/billing/BillingOverview.tsx))

    - Current plan details
    - Billing period information
    - Subscription status

3. **UsageStats** ([`/packages-answers/ui/src/billing/UsageStats.tsx`](/packages-answers/ui/src/billing/UsageStats.tsx))
    - Execution usage metrics
    - Usage history
    - Remaining executions

## API Reference

### Plan Management

-   `GET /billing/plans/current`: Get current plan
-   `GET /billing/plans/history`: Get plan history
-   `POST /billing/plans/check-executions`: Check available executions

### Subscription Management

-   `POST /billing/subscriptions`: Create subscription
-   `PUT /billing/subscriptions/:id`: Update subscription
-   `DELETE /billing/subscriptions/:id`: Cancel subscription

### Billing Portal

-   `POST /billing/portal-sessions`: Create billing portal session

## Error Handling

Common error scenarios handled:

1. Insufficient executions
2. Plan not found
3. Organization not found
4. Payment processing errors

## Configuration

### Environment Variables

-   `TRIAL_PLAN_EXECUTIONS`: Number of executions for trial plans
-   `PUBLIC_ORG_ID`: ID for public organization
-   Stripe configuration keys

## Best Practices

### Usage Tracking

-   Validate available executions before processing
-   Use transactions for execution counting
-   Maintain execution history

### Security

-   Organization-based access control
-   Transaction-based updates
-   Error handling with proper status codes
