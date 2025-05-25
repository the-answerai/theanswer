**DashboardPage Migration Plan (`DashboardApp`)**

**1. Current Functionality & UX:**

-   **Purpose:** Displays a dashboard. The actual implementation is within the `Dashboard` component.
-   **Main View:** Renders the `Dashboard` component.
-   **UX:** Dependent on the `Dashboard` component. Analysis of `../components/Dashboard/Dashboard` is needed to understand:
    -   What key metrics or data visualizations are displayed.
    -   If it's customizable or user-specific.
    -   Interactivity (e.g., date range filters, drill-downs).
    -   How data is aggregated and presented.

**2. UI Components (Material UI):**

-   The `Dashboard` component likely uses various MUI components for layout (`Grid`, `Paper`, `Box`), typography (`Typography`), charts (potentially a charting library integrated with MUI or custom SVG visualizations), and data display elements (`Card`, `List`, tables).

**3. Backend Interactions & APIs (Inferred):**

-   The `Dashboard` component will fetch aggregated data from multiple sources.
-   **Potential Endpoints:**
    -   `GET /api/v1/dashboard/summary?orgId={orgId}&userId={userId}&dateRange={range}`
    -   `GET /api/v1/dashboard/call-metrics?orgId={orgId}&...`
    -   `GET /api/v1/dashboard/chat-activity?orgId={orgId}&...`
    -   `GET /api/v1/dashboard/ticket-stats?orgId={orgId}&...`
-   Each endpoint would return structured data suitable for display (e.g., counts, averages, time series data for charts).
-   The backend services for these endpoints would need to perform potentially complex queries and aggregations across tables like `call_logs`, `chat_sessions`, `tickets`, etc.

**4. Proposed Database Schema (Standardized: `snake_case`):**

-   The dashboard primarily reads from existing tables. No new tables are directly implied by `DashboardPage.jsx` itself, but the `Dashboard` component's data needs will dictate which tables are queried.
-   Relevant tables could include:
    -   `call_logs`
    -   `chat_sessions`, `chat_messages`
    -   `tickets` (if a ticketing system is integrated)
    -   `users`, `organizations`
    -   `research_views` (if dashboard shows stats about these)
    -   Any other data source that feeds into the dashboard.
-   **Consideration for Performance:** For complex dashboards, pre-aggregated data or materialized views might be necessary in the database to ensure fast load times. For example, a `daily_metrics` table that is updated periodically.

**5. Code Structure & Reuse (Target: `packages-answers/ui/src/DashboardApp/`):**

-   **`DashboardApp.Client.tsx`:**
    -   Main client component, rendering the `Dashboard` component.
    -   Pass `user`, `accessToken`.
-   **`components/Dashboard.tsx`:**
    -   The core component, needs migration/re-implementation from `../components/Dashboard/Dashboard`.
    -   Fetch data from new backend APIs.
    -   Structure the layout of dashboard widgets.
-   **`components/widgets/` (within `DashboardApp/components/`):**
    -   Break down the dashboard into reusable widget components (e.g., `MetricCard.tsx`, `ActivityChart.tsx`, `RecentItemsList.tsx`).
-   **`services/dashboardService.ts` (optional):** Client-side service for dashboard API calls.
-   **`types.ts`:**
    -   Define interfaces for dashboard data structures and API responses.

**6. Backend API Requirements (New or Adapted):**

-   Create new backend endpoints specifically for providing aggregated dashboard data.
-   These APIs should be optimized for read-heavy loads.
-   Services will need to query and aggregate data from various underlying tables.
-   Controllers in `packages-answers/server/src/controllers/dashboardController.ts`.
-   Services in `packages-answers/server/src/services/dashboardService.ts`.

**7. Standardization Opportunities:**

-   **Dashboard Widgets:** If similar metrics or charts are needed elsewhere, the widget components could be made more generic.
-   **Charting Library:** If a charting library is used, standardize its usage and configuration.
-   **Data Fetching for Dashboards:** Establish a pattern for how dashboard components fetch and display potentially large or complex datasets efficiently.

**8. DB Script Snippet (PostgreSQL - conceptual, for a materialized view example):**

```sql
-- Example: A materialized view for daily call log counts per organization
-- This is illustrative; actual dashboard needs will vary.

-- CREATE MATERIALIZED VIEW IF NOT EXISTS daily_org_call_summary AS
-- SELECT
--     org_id,
--     DATE(call_timestamp) AS call_date,
--     COUNT(*) AS total_calls,
--     AVG(call_duration_seconds) AS avg_duration_seconds,
--     SUM(CASE WHEN resolution_status = 'resolved' THEN 1 ELSE 0 END) AS resolved_calls
-- FROM
--     call_logs
-- GROUP BY
--     org_id,
--     DATE(call_timestamp)
-- ORDER BY
--     org_id,
--     call_date DESC;

-- CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_org_call_summary_org_date ON daily_org_call_summary(org_id, call_date);

-- Periodically refresh the materialized view:
-- REFRESH MATERIALIZED VIEW daily_org_call_summary;
```
