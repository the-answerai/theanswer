# Usage Tracking Technical Specification

## System Architecture

Flowise's usage tracking system leverages the existing Langfuse integration to provide millisecond-precision monitoring. This document details the technical implementation for developers and system architects.

### Core Components

1. **Trace Collection System**

    - Built-in Langfuse SDK integration via handler.ts
    - Automatic event capture for chains, LLMs, and tools
    - Real-time usage tracking with existing analytics handlers
    - Built-in retry and error handling

2. **Usage Processing Pipeline**

    - Automatic trace creation per chatflow
    - Built-in metadata collection
    - Existing customer attribution
    - Real-time rate application

3. **Billing Integration**
    - Direct Langfuse to Stripe sync
    - Automatic meter updates
    - Usage record creation
    - Subscription management

### Integration Architecture

#### Existing Langfuse Integration

The system leverages the existing Langfuse integration in handler.ts which provides:

1. **Automatic Trace Creation**

    - One trace per chatflow execution
    - Automatic user and session tracking
    - Built-in metadata collection:
        - Chatflow ID and name
        - User ID
        - Session ID
        - Chat ID
        - Environment information

2. **Event Tracking**
    - Chain events (start/end)
    - LLM interactions
    - Tool usage
    - Error handling

#### Required Additional Metadata

To enable usage tracking, the following additional metadata needs to be captured:

1. **Billing Metadata**

    - Customer ID
    - Subscription tier
    - Rate information
    - Usage quotas

2. **Resource Attribution**
    - Resource type (LLM/Compute/Storage)
    - Resource-specific metrics
    - Usage category
    - Cost center

## Usage Types Implementation

### LLM Usage (ai_tokens_sparks)

-   Automatically tracked via existing Langfuse integration
-   Requires additional metadata for:
    -   Token counting
    -   Model identification
    -   Rate application
    -   Customer attribution

### Compute Usage (compute_sparks)

-   Leverages existing span tracking
-   Additional metadata needed:
    -   Resource type classification
    -   Compute time tracking
    -   Environment information
    -   Cost allocation

### Storage Usage (storage_sparks)

-   Requires new tracking implementation
-   Integration points with existing system:
    -   Storage measurement jobs
    -   Usage aggregation
    -   Customer attribution
    -   Rate application

## Sync Process Details

### Real-time Flow

1. **Event Capture** (Existing)

    - Automatic via handler.ts
    - Built-in error handling
    - Retry mechanisms
    - Real-time tracking

2. **Usage Processing** (To Be Added)

    - Rate application
    - Usage categorization
    - Customer attribution
    - Quota tracking

3. **Billing Updates** (To Be Added)
    - Stripe meter updates
    - Usage record creation
    - Invoice preparation
    - Quota management

### Required Enhancements

1. **Metadata Enrichment**

    - Add billing-specific fields
    - Enhance resource attribution
    - Include rate information
    - Add customer context

2. **Rate Management**
    - Real-time rate application
    - Rate caching
    - Version tracking
    - Audit logging

## Technical Requirements

### Configuration Updates

-   Additional environment variables for billing
-   Rate configuration
-   Customer attribution rules
-   Usage categorization logic

### Trace Requirements

#### Existing Fields

-   LLM Traces: model, token counts, timestamps
-   Compute Traces: name, duration, status
-   Storage Traces: type, size, user_id, timestamp

#### Additional Required Fields

-   Billing tier
-   Rate information
-   Usage category
-   Cost center
-   Customer ID
-   Quota information

## Implementation Guide

### Setup Checklist

1. Real-time Capture Setup

    - [x] Configure immediate usage event recording
    - [ ] Implement complete metadata capture
    - [ ] Set up proper resource attribution
    - [ ] Enable trace context maintenance

2. Resource Attribution
    - [ ] Configure per-user tracking
    - [ ] Set up chatflow association
    - [ ] Implement billing context
    - [ ] Enable usage analytics

### Monitoring Configuration

#### System Health Checks

-   Usage spike detection thresholds
-   Failed trace alert configuration
-   Aggregation delay monitoring
-   Data consistency validation

#### Business Metrics

-   Usage threshold notifications
-   Billing cycle alerts
-   Reconciliation monitoring
-   Capacity warning configuration

### Data Retention

| Data Type       | Retention Period |
| --------------- | ---------------- |
| Raw traces      | 30 days          |
| Aggregated data | 12 months        |
| Billing records | 7 years          |
| Audit logs      | 12 months        |

### Error Handling

1. Collection Errors

    - Local buffering
    - Retry logic
    - Circuit breaking
    - Fallback mechanisms

2. Processing Errors
    - Data validation
    - Error recovery
    - State management
    - Alert triggering

## Related Documentation

For technical implementation details, please refer to:

-   [Usage Billing ](./usage-billing.md)
-   [Usage Tracking MVP](./usage-billing-mvp.md)
-   [Usage Tracking MVP Progress](./usage-billing-mvp-progress.md)
-   [Stripe API Documentation](https://stripe.com/docs/api)
-   [Langfuse Documentation](https://langfuse.com/docs)
