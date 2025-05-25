**OutboundCallsPage Migration Plan (`OutboundCallsApp`)**

**1. Current Functionality & UX:**

-   **Purpose:** Manages or displays outbound calls. The actual implementation is within the `OutboundCalls` component.
-   **Main View:** Renders the `OutboundCalls` component.
-   **UX:** Dependent on the `OutboundCalls` component. Analysis of `../components/calls/OutboundCalls` is needed to understand:
    -   How outbound calls are listed or initiated.
    -   Information displayed per outbound call (e.g., recipient, status, time, duration).
    -   Actions available (e.g., initiating a call, viewing call details, scheduling calls).
    -   Filtering or search capabilities specific to outbound calls.
    -   If it integrates with a dialer or telephony system.

**2. UI Components (Material UI):**

-   The `OutboundCalls` component will use MUI components for layout, lists/tables, forms (for initiating calls), buttons, etc.

**3. Backend Interactions & APIs (Inferred):**

-   `OutboundCalls` will interact with a backend to:
    -   Fetch a list of past or scheduled outbound calls.
    -   Initiate new outbound calls (this might involve an integration with a telephony service).
    -   Update the status of outbound calls.
-   **Potential Endpoints:**
    -   `GET /api/v1/outbound-calls?orgId={orgId}&userId={userId}&status={status}&page={page}&limit={limit}`: List outbound calls.
        -   Response: `{ calls: [outboundCallObject1, ...], pagination: { ... } }`
        -   `outboundCallObject` might include `id`, `recipient_number`, `recipient_name`, `status` ('dialing', 'connected', 'failed', 'completed'), `scheduled_time`, `call_log_id` (FK to `call_logs` once completed).
    -   `POST /api/v1/outbound-calls/initiate?orgId={orgId}&userId={userId}`: To start a new outbound call.
        -   Request Body: `{ recipient_number: string, caller_id_number?: string, context_info?: object }`
        -   This endpoint would likely trigger a call through a third-party telephony API.
    -   `GET /api/v1/outbound-calls/{callId}?orgId={orgId}`: Get details of a specific outbound call.

**4. Proposed Database Schema (Standardized: `snake_case`):**

-   **Table: `outbound_call_tasks` (or `scheduled_calls` if primarily for scheduling)**

    -   `id`: `UUID` (Primary Key)
    -   `org_id`: `UUID` (NOT NULL)
    -   `user_id`: `UUID` (User who initiated or is assigned the call)
    -   `recipient_name`: `TEXT`
    -   `recipient_number`: `TEXT` (NOT NULL)
    -   `caller_id_number`: `TEXT` (The number to display as caller ID)
    -   `status`: `TEXT` (e.g., 'pending', 'scheduled', 'dialing', 'in_progress', 'completed', 'failed', 'canceled') - Consider ENUM.
    -   `scheduled_at`: `TIMESTAMP WITH TIME ZONE` (If the call can be scheduled)
    -   `initiated_at`: `TIMESTAMP WITH TIME ZONE` (When dialing started)
    -   `completed_at`: `TIMESTAMP WITH TIME ZONE`
    -   `call_log_id`: `UUID` (FK to `call_logs.id` after the call is completed and logged)
    -   `telephony_provider_call_id`: `TEXT` (ID from the external telephony service)
    -   `failure_reason`: `TEXT`
    -   `context_data`: `JSONB` (Any additional data to associate with the outbound call task)
    -   `created_at`: `TIMESTAMP WITH TIME ZONE` (NOT NULL, `DEFAULT now()`)
    -   `updated_at`: `TIMESTAMP WITH TIME ZONE` (NOT NULL, `DEFAULT now()`)

-   Completed outbound calls should also result in an entry in the main `call_logs` table, with `call_type` perhaps set to 'outbound'. The `outbound_call_tasks.call_log_id` would link to this.

**5. Code Structure & Reuse (Target: `packages-answers/ui/src/OutboundCallsApp/`):**

-   **`OutboundCallsApp.Client.tsx`:**
    -   Main client component, renders `OutboundCalls`.
    -   Pass `user`, `accessToken`.
-   **`components/OutboundCalls.tsx`:**
    -   Core component, needs migration/re-implementation from `../components/calls/OutboundCalls`.
    -   UI for listing, initiating, and managing outbound calls.
    -   Integrate with new backend APIs.
-   **`components/OutboundCallForm.tsx`:** Form for initiating or scheduling an outbound call.
-   **`components/OutboundCallListItem.tsx`:** Component for an item in the outbound calls list.
-   **`services/outboundCallService.ts` (optional):** Client-side service for API calls.
-   **`types.ts`:**
    -   Define `OutboundCallTask` interface.

**6. Backend API Requirements (New or Adapted):**

-   CRUD operations for `outbound_call_tasks`.
-   API endpoint to trigger outbound calls via a telephony service (e.g., Twilio, Vonage). This service will handle the actual call placement.
    -   The backend will need credentials and SDK/API integration logic for the chosen telephony provider.
-   Webhook handler endpoint to receive status updates (e.g., call ringing, answered, completed, failed) from the telephony service. This webhook would update the `outbound_call_tasks` table and potentially create/update `call_logs`.
-   Controllers in `packages-answers/server/src/controllers/outboundCallController.ts`.
-   Services in `packages-answers/server/src/services/outboundCallService.ts` and `telephonyIntegrationService.ts`.

**7. Standardization Opportunities:**

-   **Telephony Integration:** If other parts of the app initiate calls or send SMS, the telephony integration service should be centralized.
-   **Call Statuses:** Standardize the set of statuses used for outbound calls across frontend and backend.
-   **Logging:** Ensure comprehensive logging of outbound call attempts, statuses, and outcomes in both `outbound_call_tasks` and the main `call_logs` table.

**8. DB Script Snippet (PostgreSQL - conceptual):**

```sql
CREATE TYPE outbound_call_status_enum AS ENUM (
    'pending', 'scheduled', 'dialing', 'in_progress', 'completed', 'failed', 'canceled', 'no_answer'
);

CREATE TABLE IF NOT EXISTS outbound_call_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL,
    user_id UUID, -- User who initiated or is assigned
    recipient_name TEXT,
    recipient_number TEXT NOT NULL,
    caller_id_number TEXT,
    status outbound_call_status_enum DEFAULT 'pending',
    scheduled_at TIMESTAMP WITH TIME ZONE,
    initiated_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    call_log_id UUID REFERENCES call_logs(id) ON DELETE SET NULL,
    telephony_provider_call_id TEXT, -- ID from Twilio, Vonage, etc.
    failure_reason TEXT,
    context_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_outbound_call_tasks_org_id ON outbound_call_tasks(org_id);
CREATE INDEX IF NOT EXISTS idx_outbound_call_tasks_user_id ON outbound_call_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_outbound_call_tasks_status ON outbound_call_tasks(status);
CREATE INDEX IF NOT EXISTS idx_outbound_call_tasks_scheduled_at ON outbound_call_tasks(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_outbound_call_tasks_call_log_id ON outbound_call_tasks(call_log_id);
```
