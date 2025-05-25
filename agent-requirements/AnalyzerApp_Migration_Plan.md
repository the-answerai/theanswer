**AnalyzerHomePage Migration Plan (`AnalyzerApp`)**

**1. Current Functionality & UX:**

-   **Purpose:** Allows users to manage "Research Views". Users can create, view, edit, and delete these views.
-   **Main View:**
    -   Displays a list of existing research views as cards.
    -   Each card shows:
        -   Name
        -   Description (truncated)
        -   Number of Data Sources
        -   Number of Documents
        -   Number of Reports
        -   Creation Date
    -   Provides "Edit" and "Delete" actions on each card.
    -   A prominent "Create Research View" / "New Research View" card/button to add new views.
    -   If no views exist, it shows an empty state message with a "Create Research View" button.
-   **Navigation:**
    -   Clicking on a research view card navigates to a detailed view (`/analyzer/research-views/${view.id}`).
    -   Creating a new view also navigates to its detailed view upon successful creation.
-   **Dialogs:**
    -   **Create/Edit Dialog:** A modal dialog with fields for "Name" (required) and "Description" (multiline).
    -   **Delete Confirmation Dialog:** A modal to confirm deletion, warning about associated data loss.
-   **Error Handling:** Displays an alert for errors during API calls (fetching, saving, deleting).
-   **Loading State:** Shows a circular progress indicator while data is being fetched.

**2. UI Components (Material UI):**

-   `Box`, `Typography`, `Button`, `Card`, `CardContent`, `CardActions`, `Grid`, `Dialog`, `DialogTitle`, `DialogContent`, `DialogActions`, `TextField`, `Divider`, `IconButton`, `Tooltip`, `CircularProgress`, `Alert`
-   Icons: `AddIcon`, `EditIcon`, `DeleteIcon`

**3. Backend Interactions & APIs:**

-   The component uses `axios` for API calls.
-   **Endpoints (assuming a base path like `/api/analyzer/`):**
    -   `GET /research-views`: Fetches all research views.
        -   Response: `{ data: [{ id, name, description, data_sources: [], document_count, analyzer_reports: [], created_at }, ...] }`
    -   `POST /research-views`: Creates a new research view.
        -   Request Body: `{ name: string, description: string }`
        -   Response: `{ data: { id, ... } }` (returns the created view, including its ID)
    -   `PUT /research-views/{viewId}`: Updates an existing research view.
        -   Request Body: `{ name: string, description: string }`
    -   `DELETE /research-views/{viewId}`: Deletes a research view.
-   **Data Flow:**
    -   Component mounts -> fetches views.
    -   User actions (create, edit, delete) trigger corresponding API calls and then re-fetch the list.

**4. Proposed Database Schema (Standardized: `snake_case`):**

-   **Table: `research_views`**

    -   `id`: `UUID` (Primary Key, auto-generated, e.g., `uuid_generate_v4()`)
    -   `org_id`: `UUID` (Foreign Key to an `organizations` table, if multi-tenancy is required) - _Consider adding this for consistency with `ImageCreator`'s use of `user.org_id`._
    -   `user_id`: `UUID` (Foreign Key to a `users` table) - _Consider adding for ownership, if `user.id` is relevant._
    -   `name`: `TEXT` (NOT NULL)
    -   `description`: `TEXT`
    -   `created_at`: `TIMESTAMP WITH TIME ZONE` (NOT NULL, `DEFAULT now()`)
    -   `updated_at`: `TIMESTAMP WITH TIME ZONE` (NOT NULL, `DEFAULT now()`)

-   **Notes on Related Data (currently shown as counts/arrays in frontend):**

    -   `data_sources`: This suggests a related table, e.g., `research_view_data_sources` (`view_id`, `data_source_id`, `type`, etc.). The current frontend shows `data_sources?.length`.
    -   `documents`: Implies a `documents` table linked to research views, possibly through `research_view_documents` or a direct `view_id` on the `documents` table. The current frontend shows `document_count`.
    -   `analyzer_reports`: Suggests an `analyzer_reports` table linked to research views. The current frontend shows `analyzer_reports?.length`.

    _These related tables will need their own migration plans if their management UI is also being migrated._

**5. Code Structure & Reuse (Target: `packages-answers/ui/src/AnalyzerApp/`):**

-   **`AnalyzerApp.Client.tsx`:**
    -   Main client component, similar to `ImageCreator.Client.tsx`.
    -   Will contain the primary logic from `AnalyzerHomePage.jsx`.
    -   Adapt to use `fetch` API instead of `axios` for consistency with `ImageCreator` and `CsvTransformer` if that's the preferred pattern in the new location.
    -   Pass `user` and `accessToken` props.
    -   Modify API calls to include `organizationId` (e.g., `user.org_id`) and potentially `userId` if the new backend requires them for tenancy/ownership.
-   **`components/` (within `AnalyzerApp`):**
    -   `ResearchViewCard.tsx`: A new component to represent a single research view card, encapsulating its display logic and actions (edit, delete buttons).
    -   `ResearchViewDialog.tsx`: A component for the create/edit research view dialog.
    -   `DeleteConfirmDialog.tsx`: A reusable confirmation dialog (could potentially be moved to a shared components directory if used elsewhere).
-   **`types.ts` (or similar within `AnalyzerApp` or a shared types directory):**
    -   Define `ResearchView` interface.
    -   Define interfaces for API request/response payloads if needed.
-   **Styling:**
    -   Leverage Material UI as currently used.
    -   Ensure consistency with the styling of `ImageCreator` and `CsvTransformer`.

**6. Backend API Requirements (New or Adapted):**

-   Assume backend services will be located in a path like `packages-answers/server/src/services/analyzerService.ts` or similar.
-   Controllers would be in `packages-answers/server/src/controllers/analyzerController.ts`.
-   **Endpoints needed:**
    -   `GET /api/v1/analyzer/research-views?orgId={orgId}`
        -   Should be protected, requiring `accessToken`.
        -   Filter by `orgId`.
    -   `POST /api/v1/analyzer/research-views`
        -   Request Body: `{ name: string, description?: string, orgId: string, userId: string }`
        -   Should be protected.
    -   `PUT /api/v1/analyzer/research-views/{viewId}`
        -   Request Body: `{ name?: string, description?: string, orgId: string }` (Ensure user has permission for this `viewId` and `orgId`).
        -   Should be protected.
    -   `DELETE /api/v1/analyzer/research-views/{viewId}?orgId={orgId}`
        -   Ensure user has permission.
        -   Should be protected.
-   **Service Logic:**
    -   Implement CRUD operations for `research_views`.
    -   Handle database interactions.
    -   Validate user permissions and organization context.

**7. Standardization Opportunities:**

-   **API Client:** Standardize on using `fetch` with `Authorization: Bearer ${accessToken}` header, similar to `ImageCreator.Client.tsx`.
-   **State Management:** Use `useState` and `useEffect` as demonstrated. If complexity grows, consider a shared state management solution if one is established for other "apps".
-   **Error Handling & Loading States:** Adopt consistent patterns for displaying loading spinners and error messages (e.g., using `Alert` components).
-   **User and Org Info:** Consistently pass `user` prop and use `user.org_id`, `user.id`, `user.email` as needed for API requests and display. `ImageCreator.Client.tsx` uses `user.organizationId || user.org_id`. Standardize which `user` object property to use for organization ID.
-   **Domain for API calls:** Use `user.chatflowDomain || process.env.NEXT_PUBLIC_FLOWISE_DOMAIN || 'http://localhost:4000'` pattern from `ImageCreator` for constructing API URLs.

**8. DB Script Snippet (PostgreSQL - conceptual):**

```sql
CREATE TABLE IF NOT EXISTS research_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL, -- Assuming an organizations table exists
    user_id UUID,        -- Assuming a users table exists
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Optional: Add foreign key constraints if org_id and user_id tables exist
-- ALTER TABLE research_views ADD CONSTRAINT fk_org FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
-- ALTER TABLE research_views ADD CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_research_views_org_id ON research_views(org_id);
```

_(Note: `uuid_generate_v4()` requires the `uuid-ossp` extension in PostgreSQL, or use `gen_random_uuid()` for PG13+)_
