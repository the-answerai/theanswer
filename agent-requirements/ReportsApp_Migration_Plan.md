**Reports (`ReportDetail.jsx`, `ReportsPage.jsx`) Migration Plan (`ReportsApp`)**

**1. Current Functionality & UX:**

-   **`ReportsPage.jsx` (Main Reports View):**
    -   **Tabs:** "Create Report", "Report List", "Scheduled Reports".
    -   **Create Report Tab:**
        -   **Report Settings:** Filter settings (Resolution, Escalation, Call Type, Employee, Tags, Sentiment Range), Report Type (dropdown with predefined types like Performance, custom), Report Name, Analysis Instructions (multiline text field with AI prompt suggestion).
        -   **Schedule Settings:** Toggle to schedule, frequency dropdown (daily, weekly, etc.).
        -   **Call Selection:** If not scheduled, embeds a `CallList` component to select calls for the report (demo limit of 10 calls).
        -   **Action:** "Create Report" or "Save Scheduled Report" button.
        -   **Loading Overlay:** Shows progress and messages during report generation.
    -   **Report List Tab:**
        -   Displays a list of generated one-time reports.
        -   Each item shows report name and creation date.
        -   Actions: Edit name, Delete report.
        -   Clicking a report navigates to `ReportDetail`.
    -   **Scheduled Reports Tab:**
        -   Lists scheduled reports with name, schedule (cron format translated to human-readable), last run time, status (Active/Paused with a toggle).
        -   Actions: Edit scheduled report (opens `EditScheduledReportModal`), Delete.
        -   Empty state with "Create New" button.
        -   `EditScheduledReportModal` and `EmptyScheduledReports` are separate components.
-   **`ReportDetail.jsx` (Report Viewing/Editing View):**
    -   Displays the content of a single report.
    -   **Navigation:** Back button to `/reports`.
    -   **Layout:**
        -   Left Panel: Lists calls included in the report (Name, Type, Duration). Clicking a call opens `CallPanel`.
        -   Right Panel: MDX Editor (`@mdxeditor/editor`) to view/edit the report content. Auto-saves content changes.
    -   `CallPanel` component to display details of a selected call from the report.
-   **Key Features:**
    -   Report generation based on selected calls and a custom prompt.
    -   Scheduled report generation based on filters and prompt.
    -   MDX editor for rich text report content.
    -   Linking reports to the specific calls they analyzed.

**2. UI Components (Material UI & Other):**

-   Extensive use of MUI: `Box`, `Typography`, `Paper`, `List`, `ListItem`, `IconButton`, `Dialog`, `Button`, `TextField`, `Tabs`, `Tab`, `FormControl`, `Select`, `Switch`, `Tooltip`, `Slider`, `LinearProgress`, `Backdrop`, `Alert`, `Grid`, `Breadcrumbs`, `Chip`.
-   Icons: `EditIcon`, `DeleteIcon`, `AutoFixHighIcon`, `LockIcon`, `ArrowBackIcon`.
-   `@mdxeditor/editor` and its various plugins for the rich text editor.
-   Custom components: `CallList`, `CallPanel`, `EditScheduledReportModal`, `EmptyScheduledReports`, `CallFilters`.
-   `useTheme` for dark/light mode considerations.

**3. Backend Interactions & APIs (from `ReportsPage.jsx` and `ReportDetail.jsx`):**

-   Uses `fetch` with `getApiUrl()`.
-   **Endpoints for `ReportsPage.jsx`:**
    -   `GET api/reports`: Fetch list of one-time reports.
    -   `PUT api/reports/{reportId}`: Update report name.
    -   `DELETE api/reports/{reportId}`: Delete a one-time report.
    -   `GET api/scheduled-reports`: Fetch list of scheduled reports.
    -   `POST api/scheduled-reports`: Create a new scheduled report.
        -   Body: `{ name, prompt, frequency, filters }`
    -   `PUT api/scheduled-reports/{reportId}`: Update a scheduled report (e.g., status).
    -   `DELETE api/scheduled-reports/{reportId}`: Delete a scheduled report.
    -   `POST api/reports/generate-report`: Generate a one-time report.
        -   Body: `{ name, customPrompt, calls: [{id, ...callData}] }` (calls are fetched first via `GET api/calls?recording_urls=[...]`)
    -   `POST api/answerai/analyze`: For prompt suggestion.
        -   Body: `{ text: context, systemPrompt, schema }`
-   **Endpoints for `ReportDetail.jsx`:**
    -   `GET api/reports/{reportId}`: Fetch single report details (including `content` and `documents_analyzed`).
    -   `PUT api/reports/{reportId}`: Update report content (auto-save). Body: `{ name, content }`.
    -   `GET api/calls?recording_urls=[...]&fields=TRANSCRIPTION,WORD_TIMESTAMPS`: Fetches full call details for calls listed in the report.
    -   `GET api/tags`: Fetch tag categories (for `CallPanel`).

**4. Proposed Database Schema (Standardized: `snake_case`):**

-   **Table: `reports`** (For one-time generated reports)

    -   `id`: `UUID` (Primary Key)
    -   `org_id`: `UUID` (NOT NULL)
    -   `user_id`: `UUID` (User who created the report)
    -   `name`: `TEXT` (NOT NULL)
    -   `content`: `TEXT` (MDX content)
    -   `prompt_used`: `TEXT`
    -   `report_type`: `TEXT` (e.g., 'performance', 'custom')
    -   `created_at`: `TIMESTAMP WITH TIME ZONE` (NOT NULL, `DEFAULT now()`)
    -   `updated_at`: `TIMESTAMP WITH TIME ZONE` (NOT NULL, `DEFAULT now()`)

-   **Table: `report_analyzed_calls`** (Junction table: many-to-many between `reports` and `call_logs`)

    -   `id`: `UUID` (Primary Key)
    -   `report_id`: `UUID` (FK to `reports.id`)
    -   `call_log_id`: `UUID` (FK to `call_logs.id`)
    -   `metadata_from_analysis`: `JSONB` (e.g., summary/coaching specific to this call in the context of this report, if `ReportDetail.jsx`'s transformation of `documents_analyzed` implies this)
    -   UNIQUE (`report_id`, `call_log_id`)

-   **Table: `scheduled_reports`**

    -   `id`: `UUID` (Primary Key)
    -   `org_id`: `UUID` (NOT NULL)
    -   `user_id`: `UUID` (User who created it)
    -   `name`: `TEXT` (NOT NULL)
    -   `prompt`: `TEXT` (NOT NULL)
    -   `report_type`: `TEXT`
    -   `frequency`: `TEXT` (e.g., 'daily', 'weekly') or `cron_expression`: `TEXT`
    -   `filters`: `JSONB` (Store the filter criteria: callType, employeeId, tags, sentiment, etc.)
    -   `status`: `TEXT` (e.g., 'active', 'paused' - Consider ENUM)
    -   `last_run_at`: `TIMESTAMP WITH TIME ZONE`
    -   `next_run_at`: `TIMESTAMP WITH TIME ZONE`
    -   `created_at`: `TIMESTAMP WITH TIME ZONE` (NOT NULL, `DEFAULT now()`)
    -   `updated_at`: `TIMESTAMP WITH TIME ZONE` (NOT NULL, `DEFAULT now()`)

-   **Table: `scheduled_report_runs`** (To log instances of scheduled report executions and link to the generated `reports.id`)

    -   `id`: `UUID` (Primary Key)
    -   `scheduled_report_id`: `UUID` (FK to `scheduled_reports.id`)
    -   `report_id`: `UUID` (FK to `reports.id` - the actual generated report)
    -   `run_at`: `TIMESTAMP WITH TIME ZONE`
    -   `status`: `TEXT` (e.g., 'success', 'failure')
    -   `details`: `TEXT` (e.g., error message if failed)

-   **`call_logs` table:** Referenced extensively. Schema from `CallListApp` plan.

**5. Code Structure & Reuse (Target: `packages-answers/ui/src/ReportsApp/`):**

-   **`ReportsApp.Client.tsx`:**
    -   Main client component, handling routing between the list/create/detail views or managing tab state.
    -   Pass `user`, `accessToken`.
-   **`components/ReportsPageContainer.tsx`:** Manages the tabbed view from original `ReportsPage.jsx`.
-   **`components/ReportCreateForm.tsx`:** Encapsulates the "Create Report" tab's form.
-   **`components/ReportList.tsx`:** Displays one-time reports.
-   **`components/ScheduledReportList.tsx`:** Displays scheduled reports.
-   **`components/ReportDetailView.tsx`:** The content of original `ReportDetail.jsx`.
-   **`components/MdxReportEditor.tsx`:** Wrapper around `@mdxeditor/editor` with plugins, theming.
-   **Shared Components:**
    -   `CallList.tsx`: If migrated and placed in a shared location.
    -   `CallPanel.tsx`: Needs migration.
    -   `CallFilters.tsx`: Needs migration.
    -   `EditScheduledReportModal.tsx`, `EmptyScheduledReports.tsx`: Need migration.
-   **`services/reportService.ts`:** For all report and scheduled report related API calls.
-   **`types.ts`:** `Report`, `ScheduledReport`, `CallLog` etc.

**6. Backend API Requirements (New or Adapted):**

-   All existing APIs need to be adapted for `orgId` scoping and standardized auth.
-   **Report Generation Service:**
    -   A robust backend service to handle both one-time and scheduled report generation.
    -   This service would:
        1.  Fetch relevant `call_logs` based on IDs (for one-time) or filters (for scheduled).
        2.  Pass call data and user prompt to an AI service (e.g., OpenAI, or an internal "AnswerAI" service) for analysis and content generation.
        3.  Store the generated MDX content in the `reports` table.
        4.  Link the report to the analyzed calls in `report_analyzed_calls`.
-   **Scheduling Service:** A job scheduler (e.g., node-cron, or a dedicated queuing system like BullMQ with workers) to run scheduled reports.
    -   Scheduler checks `scheduled_reports` for `next_run_at`.
    -   Triggers the report generation service.
    -   Updates `last_run_at`, `next_run_at` in `scheduled_reports`.
    -   Logs the run in `scheduled_report_runs`.
-   `/api/answerai/analyze` for prompt suggestions should be a general utility.
-   Controllers: `reportController.ts`, `scheduledReportController.ts`.
-   Services: `reportService.ts`, `scheduledReportService.ts`, `reportGenerationService.ts`, `aiAnalysisService.ts`.

**7. Standardization Opportunities:**

-   **MDX Editor:** Standardize the MDX editor setup and plugins if used elsewhere.
-   **Report Types and Prompts:** `REPORT_TYPES` and `PROMPT_SUGGESTION_PROMPT` utils should be part of the backend or a shared config if they drive backend logic.
-   **Filter Components:** `CallFilters` could be reused if other apps need similar call filtering.
-   **API for `call_logs`:** Crucial for fetching data for reports.

**8. DB Script Snippet (PostgreSQL - conceptual for new tables):**

```sql
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL,
    user_id UUID,
    name TEXT NOT NULL,
    content TEXT, -- MDX
    prompt_used TEXT,
    report_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reports_org_id ON reports(org_id);

CREATE TABLE IF NOT EXISTS report_analyzed_calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    call_log_id UUID NOT NULL REFERENCES call_logs(id) ON DELETE CASCADE,
    metadata_from_analysis JSONB,
    UNIQUE (report_id, call_log_id)
);
CREATE INDEX IF NOT EXISTS idx_report_analyzed_calls_report_id ON report_analyzed_calls(report_id);
CREATE INDEX IF NOT EXISTS idx_report_analyzed_calls_call_log_id ON report_analyzed_calls(call_log_id);

CREATE TYPE scheduled_report_status_enum AS ENUM ('active', 'paused', 'error');
CREATE TABLE IF NOT EXISTS scheduled_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL,
    user_id UUID,
    name TEXT NOT NULL,
    prompt TEXT NOT NULL,
    report_type TEXT,
    frequency TEXT, -- e.g., 'daily', 'weekly'
    cron_expression TEXT, -- Alternative for more complex schedules
    filters JSONB,
    status scheduled_report_status_enum DEFAULT 'active',
    last_run_at TIMESTAMP WITH TIME ZONE,
    next_run_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_org_id ON scheduled_reports(org_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_status_next_run_at ON scheduled_reports(status, next_run_at);

CREATE TABLE IF NOT EXISTS scheduled_report_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scheduled_report_id UUID NOT NULL REFERENCES scheduled_reports(id) ON DELETE CASCADE,
    report_id UUID REFERENCES reports(id) ON DELETE SET NULL, -- Link to the generated report
    run_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL, -- 'success', 'failure'
    details TEXT
);
CREATE INDEX IF NOT EXISTS idx_scheduled_report_runs_scheduled_report_id ON scheduled_report_runs(scheduled_report_id);
```
