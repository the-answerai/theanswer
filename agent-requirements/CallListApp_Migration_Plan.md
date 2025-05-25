**CallListPage Migration Plan (`CallListApp`)**

**1. Current Functionality & UX:**

-   **Purpose:** Displays a list of calls. The actual implementation details of `CallList` component are not in `CallListPage.jsx` but are imported.
-   **Main View:** A simple page that renders the `CallList` component.
-   **UX:** Depends entirely on the `CallList` component. We need to analyze `CallList` to understand its features (filtering, sorting, pagination, data displayed per call, actions per call, etc.).

**2. UI Components (Material UI):**

-   `Box` (from `CallListPage.jsx`)
-   The `CallList` component likely uses a suite of Material UI components for displaying the list/table, filters, pagination, etc. These need to be identified from the `CallList` component's source.
    -   Looking at `ReportsPage.jsx` (lines 1214-1997 in `repomix-output.xml`), there's an embedded `CallList` (lines 1746-1766) that takes `isEmbedded`, `onSelectionChange`, `selectedCalls`, `showSelection`, `hideFilters`, `filters`, `onFilterChange` props. This gives clues about `CallList`'s capabilities.
    -   `CallList` likely displays information like Employee Name, Caller Name, Call Type, Call Duration, and potentially allows selection and filtering.

**3. Backend Interactions & APIs (Inferred from common patterns and `CallList` usage in `ReportsPage`):**

-   The `CallList` component (or a service it uses) will fetch call data.
-   **Potential Endpoints:**
    -   `GET /api/v1/calls?orgId={orgId}&employeeId={employeeId}&callType={callType}&tags={tags}&sentimentMin={min}&sentimentMax={max}&resolutionStatus={status}&isEscalated={bool}&page={page}&limit={limit}&sortBy={field}&sortOrder={asc|desc}`
        -   Response should be paginated: `{ calls: [callObject1, ...], pagination: { page, limit, total, totalPages, hasMore } }`
        -   `callObject` should include: `RECORDING_URL` (as a unique ID), `EMPLOYEE_NAME`, `CALLER_NAME`, `CALL_TYPE`, `CALL_DURATION`, `TIMESTAMP`, `TAGS_ARRAY`, `SENTIMENT_SCORE`, `RESOLUTION_STATUS`, `ESCALATED`, etc. (Standardize to `snake_case` for new backend, e.g., `recording_url`, `employee_name`).
-   The actual fields fetched and displayed by `CallList` need to be confirmed by inspecting its source code.

**4. Proposed Database Schema (Standardized: `snake_case`):**

-   **Table: `call_logs`** (This table is likely already in use by other parts of the system like `ImageCreator` for `dalle-image/archive` and `FAQPage`).

    -   `id`: `UUID` (Primary Key, `DEFAULT uuid_generate_v4()`)
    -   `org_id`: `UUID` (NOT NULL)
    -   `user_id`: `UUID` (ID of the employee/agent)
    -   `employee_name`: `TEXT`
    -   `caller_name`: `TEXT`
    -   `call_number`: `TEXT`
    -   `call_type`: `TEXT`
    -   `call_duration`: `INTEGER` (in seconds)
    -   `recording_url`: `TEXT` (UNIQUE, this seems to be used as a primary identifier in some places)
    -   `filename`: `TEXT`
    -   `transcription`: `TEXT`
    -   `summary`: `TEXT`
    -   `coaching_feedback`: `TEXT`
    -   `sentiment_score`: `NUMERIC(3, 2)` (e.g., 1.00 to 10.00)
    -   `tags`: `TEXT[]` (Array of strings for tags)
    -   `resolution_status`: `TEXT` (e.g., 'resolved', 'dispatch', 'escalated', 'followup')
    -   `is_escalated`: `BOOLEAN`
    -   `word_timestamps`: `JSONB`
    -   `created_at`: `TIMESTAMP WITH TIME ZONE` (NOT NULL, `DEFAULT now()`)
    -   `updated_at`: `TIMESTAMP WITH TIME ZONE` (NOT NULL, `DEFAULT now()`)
    -   `answered_by`: `TEXT`

-   **Standardization Note for `call_logs`:**
    -   The `ImageCreator.Client.tsx`'s `ArchivedImage` interface has `sessionId`, `imageUrl`, `jsonUrl`, `timestamp`, `fileName`.
    -   `ReportDetail.jsx` transforms `documents_analyzed` (where `type === 'call_log'`) into a call format with `RECORDING_URL`, `EMPLOYEE_NAME`, `CALLER_NAME`, `CALL_TYPE`, `CALL_DURATION`.
    -   The `mcp_answerai-mcp_create_call_log` tool uses fields like `CALLER_NAME`, `CALL_DURATION`, `CALL_NUMBER`, `CALL_TYPE`, `EMPLOYEE_ID`, `EMPLOYEE_NAME`, `FILENAME`, `RECORDING_URL`, `TAGS`, `TAGS_ARRAY`, `TRANSCRIPTION`, `WORD_TIMESTAMPS`, `coaching`, `resolution_status`, `sentiment_score`, `summary`, `ANSWERED_BY`, `escalated`.
    -   **Action:** Consolidate these into a single, `snake_case` schema for `call_logs`. The list above is a good starting point. Ensure `recording_url` is treated as a reliable unique key if it's used as such. If `sessionId` from `ImageCreator` is also a call identifier, clarify its relationship to `recording_url`.

**5. Code Structure & Reuse (Target: `packages-answers/ui/src/CallListApp/`):**

-   **`CallListApp.Client.tsx`:**
    -   Main client component.
    -   Will render the `CallList` component, passing necessary props like `user`, `accessToken`, and any initial filter/display configurations.
-   **`components/CallList.tsx`:**
    -   **This is the key component.** It needs to be migrated or re-implemented.
    -   If `../components/calls/CallList` from the `repomix-output.xml` is a self-contained and well-structured React component, it could be moved to `packages-answers/ui/src/CallListApp/components/CallList.tsx` or even a more shared location like `packages-answers/ui/src/components/CallList.tsx` if it's intended for use by multiple "apps" (like `ReportsApp`).
    -   **Refactor `CallList`:**
        -   Adapt to use `fetch` and new standardized API endpoints.
        -   Ensure it handles `user` and `accessToken` for authenticated requests.
        -   Standardize props and state management within `CallList`.
        -   Consider if its internal filtering/sorting logic should be moved to backend API query parameters for efficiency.
-   **`types.ts`:**
    -   Define `CallLog` interface based on the standardized `call_logs` table schema.
    -   Define API response types.

**6. Backend API Requirements (New or Adapted):**

-   `GET /api/v1/call-logs` (or a more descriptive name like `/api/v1/calls/list`)
    -   Parameters: `orgId`, pagination (`page`, `limit`), sorting (`sortBy`, `sortOrder`), and various filter parameters (see point 3).
    -   Response: `{ items: [CallLog], pagination: { ... } }`
    -   Controller in `packages-answers/server/src/controllers/callLogController.ts`.
    -   Service in `packages-answers/server/src/services/callLogService.ts`.
-   The service should interact with the `call_logs` table using the standardized schema.

**7. Standardization Opportunities:**

-   **`CallList` Component:** If this component is used in multiple places (e.g., `CallListPage`, `ReportsPage`), it should be a prime candidate for standardization and placement in a shared components directory.
-   **API for `call_logs`:** Provide a robust, filterable, and paginated API for fetching call logs that can be used by any part of the application needing this data.
-   **Database Naming:** Strictly enforce `snake_case` for all fields in `call_logs` table. Update any existing backend logic that interacts with this table if it currently uses mixed case.

**8. DB Script Snippet (PostgreSQL - for `call_logs` table, if creating anew or standardizing):**

```sql
CREATE TABLE IF NOT EXISTS call_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL,
    user_id UUID, -- Employee/Agent ID
    employee_name TEXT,
    caller_name TEXT,
    call_number TEXT,
    call_type TEXT,
    call_duration_seconds INTEGER,
    recording_url TEXT UNIQUE, -- Important for linking and uniqueness
    filename TEXT,
    transcription TEXT,
    summary TEXT,
    coaching_feedback TEXT,
    sentiment_score NUMERIC(4, 2), -- e.g., 1.00 to 10.00
    tags TEXT[],
    resolution_status TEXT,
    is_escalated BOOLEAN DEFAULT FALSE,
    word_timestamps JSONB,
    answered_by TEXT,
    call_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- To store the actual time of the call
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_call_logs_org_id ON call_logs(org_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_user_id ON call_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_call_timestamp ON call_logs(call_timestamp);
CREATE INDEX IF NOT EXISTS idx_call_logs_tags ON call_logs USING GIN(tags); -- For array searching
```
