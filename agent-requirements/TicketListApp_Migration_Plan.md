**TicketListPage Migration Plan (`TicketListApp`)**

**1. Current Functionality & UX:**

-   **Purpose:** Displays a list of tickets. The actual implementation is within the `TicketList` component.
-   **Main View:** Renders the `TicketList` component.
-   **UX:** Dependent on `TicketList` (`../components/tickets/TicketList`). Analysis of this component is needed to understand:
    -   How tickets are listed (e.g., columns displayed: ID, subject, status, assignee, date).
    -   Filtering, sorting, and pagination capabilities.
    -   Actions available (e.g., view ticket details, create new ticket, update status).
    -   Integration with a ticketing system (e.g., Zendesk, Jira, or an internal system).

**2. UI Components (Material UI):**

-   `Box` (from `TicketListPage.jsx`).
-   `TicketList` will use MUI components: `Table`, `TableHead`, `TableBody`, `TableRow`, `TableCell`, `TablePagination`, `Button`, `TextField` (for search/filters), etc.

**3. Backend Interactions & APIs (Inferred):**

-   `TicketList` will interact with a backend to manage ticket data. This might be your own backend that then talks to a third-party ticketing system, or direct interaction if the ticketing system has a client-side SDK.
-   **Potential Endpoints (if using an intermediary backend):**
    -   `GET /api/v1/tickets?orgId={orgId}&status={status}&assigneeId={id}&page={p}&limit={l}&query={search}`: List tickets.
        -   Response: `{ tickets: [ticketObject1, ...], pagination: { ... } }`
        -   `ticketObject` might include: `id`, `external_ticket_id`, `subject`, `status`, `priority`, `assignee_name`, `requester_name`, `created_at`, `updated_at`, `source_channel`.
    -   `GET /api/v1/tickets/{ticketId}?orgId={orgId}`: Get single ticket details.
    -   `POST /api/v1/tickets?orgId={orgId}`: Create a new ticket.
    -   `PUT /api/v1/tickets/{ticketId}?orgId={orgId}`: Update a ticket (status, assignee, add comment).
    -   If integrating with a third-party system like Zendesk, the backend would use the Zendesk API.

**4. Proposed Database Schema (Standardized: `snake_case`):**

-   This depends heavily on whether you are building your own ticketing system or integrating with a third-party one.
-   **Option A: Own Ticketing System**
    -   **Table: `tickets`**
        -   `id`: `UUID` (Primary Key)
        -   `org_id`: `UUID` (NOT NULL)
        -   `subject`: `TEXT` (NOT NULL)
        -   `description`: `TEXT`
        -   `status`: `TEXT` (e.g., 'open', 'pending', 'resolved', 'closed' - ENUM)
        -   `priority`: `TEXT` (e.g., 'low', 'medium', 'high', 'urgent' - ENUM)
        -   `requester_user_id`: `UUID` (FK to users, or store email/name if external)
        -   `assignee_user_id`: `UUID` (FK to users, nullable)
        -   `source_channel`: `TEXT` (e.g., 'email', 'chat', 'phone_call', 'web_form')
        -   `call_log_id`: `UUID` (FK to `call_logs.id`, if ticket originated from a call)
        -   `chat_session_id`: `UUID` (FK to `chat_sessions.id`, if from a chat)
        -   `created_at`: `TIMESTAMP WITH TIME ZONE`
        -   `updated_at`: `TIMESTAMP WITH TIME ZONE`
        -   `closed_at`: `TIMESTAMP WITH TIME ZONE`
    -   **Table: `ticket_comments`**
        -   `id`: `UUID`
        -   `ticket_id`: `UUID` (FK to `tickets.id`)
        -   `user_id`: `UUID` (Author of the comment)
        -   `comment_text`: `TEXT`
        -   `created_at`: `TIMESTAMP WITH TIME ZONE`
        -   `is_internal_note`: `BOOLEAN`
-   **Option B: Third-Party Integration (e.g., Zendesk)**
    -   Your database might only store a reference:
    -   **Table: `external_tickets_references`**
        -   `id`: `UUID` (Primary Key)
        -   `org_id`: `UUID`
        -   `external_system_name`: `TEXT` (e.g., 'zendesk', 'jira')
        -   `external_ticket_id`: `TEXT` (The ID in the third-party system)
        -   `internal_context_id`: `UUID` (e.g., FK to `call_logs.id` if linked)
        -   `last_synced_at`: `TIMESTAMP WITH TIME ZONE`
        -   `cached_data`: `JSONB` (Optional: cache some basic ticket info like status/subject)
    -   Most data would be fetched live from the third-party API via your backend.

**5. Code Structure & Reuse (Target: `packages-answers/ui/src/TicketListApp/`):**

-   **`TicketListApp.Client.tsx`:**
    -   Main client component, renders `TicketList`.
    -   Pass `user`, `accessToken`.
-   **`components/TicketList.tsx`:**
    -   Core component from `../components/tickets/TicketList`, needs migration/refactoring.
    -   Handles display, filtering, pagination, and actions for tickets.
    -   Interacts with new backend APIs.
-   **`components/TicketDetailView.tsx` (If applicable):** For viewing full ticket details, possibly in a modal or separate page.
-   **`components/TicketCreateForm.tsx` (If applicable):** For creating new tickets.
-   **`services/ticketService.ts`:** Client-side service for API calls related to tickets.
-   **`types.ts`:** Define `Ticket`, `TicketComment` interfaces.

**6. Backend API Requirements (New or Adapted):**

-   If building an internal system: Full CRUD APIs for tickets and comments.
-   If integrating with third-party:
    -   Wrapper APIs in your backend that translate requests to the third-party ticketing system's API (e.g., Zendesk API).
    -   This backend layer would handle authentication with the third-party service, data transformation, and potentially caching.
    -   Webhook handlers might be needed to receive real-time updates from the third-party system.
-   Controllers in `packages-answers/server/src/controllers/ticketController.ts`.
-   Services in `packages-answers/server/src/services/ticketService.ts` (which might then call `zendeskService.ts` or similar).

**7. Standardization Opportunities:**

-   **Third-Party Service Integration:** If multiple third-party services are used, establish a standard pattern for backend wrappers, authentication, and error handling.
-   **Status/Priority Fields:** Standardize the values used for ticket status and priority across the application.
-   **Linking to other entities:** Define how tickets link to calls (`call_logs`) or chats (`chat_sessions`).

**8. DB Script Snippet (PostgreSQL - conceptual, for Option A - Internal System):**

```sql
CREATE TYPE ticket_status_enum AS ENUM ('open', 'pending_customer', 'pending_agent', 'on_hold', 'resolved', 'closed');
CREATE TYPE ticket_priority_enum AS ENUM ('low', 'medium', 'high', 'urgent');

CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL,
    subject TEXT NOT NULL,
    description TEXT,
    status ticket_status_enum DEFAULT 'open',
    priority ticket_priority_enum DEFAULT 'medium',
    requester_user_id UUID, -- FK to your users table
    requester_email TEXT, -- If requester can be external
    assignee_user_id UUID, -- FK to your users table (agent)
    source_channel TEXT, -- e.g., 'email', 'chat', 'phone_call', 'web_form'
    call_log_id UUID REFERENCES call_logs(id) ON DELETE SET NULL,
    chat_session_id UUID REFERENCES chat_sessions(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX IF NOT EXISTS idx_tickets_org_id ON tickets(org_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_assignee_user_id ON tickets(assignee_user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_requester_user_id ON tickets(requester_user_id);

CREATE TABLE IF NOT EXISTS ticket_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    user_id UUID, -- Author (agent or customer if they can comment)
    comment_text TEXT NOT NULL,
    is_internal_note BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket_id ON ticket_comments(ticket_id);
```
