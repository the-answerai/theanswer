**FAQPage Migration Plan (`FAQApp`)**

**1. Current Functionality & UX:**

-   **Purpose:** Displays and manages Frequently Asked Questions (FAQs). FAQs seem to be derived from support interactions and call logs.
-   **Main View:**
    -   Lists FAQs in an accordion style. Each FAQ has a question, answer, reasoning, original tags, and potentially an associated call recording with transcript.
    -   Includes internal notes for FAQs.
    -   **Filtering:**
        -   By "FAQ Status" (e.g., New, Approved, Ignored) with counts.
        -   By "Issue Type" (tags from a specific category `issue-type`) with counts.
    -   **Pagination:** Simple "Page X of Y" with next/previous buttons.
    -   **Actions:**
        -   Each FAQ has an "Edit" button.
-   **Audio Player:**
    -   For FAQs linked to a `recording_url`, it embeds an audio player.
    -   Fetches a signed URL for the audio from Supabase storage (`call-recordings` bucket).
    -   Displays the transcript if available and the audio is playing.
-   **Edit Dialog (`FAQEditDialog` component):**
    -   Allows editing: Question, Reasoning, Internal Notes, Status, Tags.
-   **Data Source:** Uses Supabase directly for fetching and updating FAQs (`supabase.from('faqs').select(...)`).

**2. UI Components (Material UI & Other):**

-   `Box`, `Typography`, `Accordion`, `AccordionSummary`, `AccordionDetails`, `Container`, `CircularProgress`, `Chip`, `Alert`, `Grid`, `Paper`, `IconButton`
-   Icons: `ExpandMoreIcon`, `KeyboardArrowDownIcon`, `KeyboardArrowUpIcon`, `EditIcon`
-   `FAQEditDialog`: A custom component for editing FAQs.
-   Audio Player: Custom implementation using HTML5 `<audio>` element.

**3. Backend Interactions & APIs:**

-   **Direct Supabase Interaction:** The frontend currently interacts directly with Supabase.
    -   Fetch FAQs: `supabase.from('faqs').select(...)` with filters for status, tags, and pagination.
    -   Fetch Status Counts: `supabase.from('faqs').select('status')` and aggregates counts.
    -   Fetch Tag Counts: `supabase.from('faqs').select('original_tags')` and aggregates counts.
    -   Update FAQ: `supabase.from('faqs').update(...)`.
    -   Fetch Signed URL for audio: `supabase.storage.from('call-recordings').createSignedUrl(...)`.
-   **API for Tag Categories:**
    -   `GET /api/tags`: Fetches tag categories (used for the "Issue Type" filter). The response structure is expected to be like: `{ "issue-type": { subcategories: { "tag-key": { label: "Tag Label", color: "#hex" } } } }`

**Migration Strategy for Backend:** Abstract Supabase calls into dedicated backend API endpoints.

**4. Proposed Database Schema (Standardized: `snake_case`):**

-   **Table: `faqs`** (Likely exists, needs schema review/standardization)

    -   `id`: `UUID` (Primary Key)
    -   `org_id`: `UUID` (NOT NULL - _to be added for multi-tenancy_)
    -   `question`: `TEXT` (NOT NULL)
    -   `answer`: `TEXT` (NOT NULL)
    -   `reasoning`: `TEXT`
    -   `tags`: `TEXT[]` (This seems to be the "refined" tags, maybe AI generated)
    -   `original_tags`: `TEXT[]` (Tags used for filtering, e.g., from `issue-type`)
    -   `transcript_id`: `UUID` (FK to `call_logs.id` or `call_logs.recording_url` if that's the key - needs clarification. The current schema links to `call_logs:transcript_id (TRANSCRIPTION)`) - _This implies `transcript_id` is a foreign key to a table aliased or actually named `call_logs` and it's trying to join on a field that might be the primary key of that call_logs table._
    -   `recording_url`: `TEXT` (Likely corresponds to `call_logs.recording_url`)
    -   `internal_notes`: `TEXT`
    -   `status`: `TEXT` (e.g., 'new', 'approved', 'ignored' - consider an ENUM type)
    -   `created_at`: `TIMESTAMP WITH TIME ZONE` (NOT NULL, `DEFAULT now()`)
    -   `updated_at`: `TIMESTAMP WITH TIME ZONE` (NOT NULL, `DEFAULT now()`)

-   **Table: `tag_categories` (or similar for managing tag structure if `/api/tags` is dynamic)**

    -   If tag categories are managed via the application, a schema would be needed. If static, configuration is fine.

-   **Table: `call_logs`** (Referenced by `faqs.transcript_id` or `faqs.recording_url`)
    -   Ensure this table has `recording_url` (as TEXT, potentially UNIQUE) and `transcription` (TEXT). (Schema discussed in `CallListApp` plan).

**Standardization Note:**

-   Clarify the link between `faqs` and `call_logs`. If `faqs.transcript_id` is the FK, what field in `call_logs` does it point to? If `faqs.recording_url` is the link, ensure it reliably matches `call_logs.recording_url`.
-   The query `call_logs:transcript_id (TRANSCRIPTION)` in Supabase suggests `transcript_id` on the `faqs` table is a foreign key to the `call_logs` table, and `TRANSCRIPTION` is a field being pulled from `call_logs`.

**5. Code Structure & Reuse (Target: `packages-answers/ui/src/FAQApp/`):**

-   **`FAQApp.Client.tsx`:**
    -   Main client component.
    -   Replicate logic from `FAQPage.jsx`.
    -   Replace direct Supabase calls with `fetch` calls to new backend APIs.
    -   Pass `user` and `accessToken`.
-   **`components/FAQListItem.tsx`:** For rendering each accordion item.
-   **`components/AudioPlayer.tsx`:**
    -   Migrate the existing audio player logic.
    -   The signed URL generation for audio should now be handled by a backend API endpoint to avoid exposing Supabase keys/logic to the client if that's a security goal.
-   **`components/FAQEditDialog.tsx`:** Migrate or reimplement.
-   **`components/FAQFilters.tsx`:** To encapsulate the status and tag filter UI and logic.
-   **`services/faqService.ts` (optional):** Client-side service for API calls.
-   **`types.ts`:**
    -   Define `FAQ`, `TagCategory`, `CallLogTranscript` (if needed for audio player) interfaces.

**6. Backend API Requirements (New or Adapted):**

-   Base path like `/api/v1/faqs`
-   `GET /faqs?orgId={orgId}&status={status}&tag={tag}&page={page}&limit={limit}`: Fetch FAQs.
-   `PUT /faqs/{faqId}`: Update an FAQ. Request body includes fields to update and `orgId`.
-   `GET /faqs/stats?orgId={orgId}`: Fetch status counts and tag counts for filters.
-   `GET /tags/categories?orgId={orgId}`: (If `/api/tags` needs to be org-specific or managed via new backend). Currently, `/api/tags` seems to be a general endpoint.
-   `GET /files/signed-url?orgId={orgId}&bucket={bucketName}&filePath={filePath}`: New endpoint to get a signed URL for files (e.g., audio recordings from Supabase storage), abstracting direct Supabase storage calls.
-   Controllers in `packages-answers/server/src/controllers/faqController.ts` (and potentially `fileController.ts`).
-   Services in `packages-answers/server/src/services/faqService.ts`.

**7. Standardization Opportunities:**

-   **Backend Abstraction:** Move all Supabase logic to the backend. The frontend should only call your application's APIs.
-   **Audio Player:** If audio playback is needed elsewhere, `AudioPlayer.tsx` could be made more generic.
-   **Filtering UI:** `FAQFilters.tsx` might be adaptable if similar filter patterns are used.

**8. DB Script Snippet (PostgreSQL - conceptual for `faqs`):**

```sql
CREATE TYPE faq_status_enum AS ENUM ('new', 'approved', 'ignored', 'pending_review');

CREATE TABLE IF NOT EXISTS faqs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    reasoning TEXT,
    tags TEXT[],
    original_tags TEXT[],
    -- Assuming call_log_id links to the primary key of call_logs table
    call_log_id UUID REFERENCES call_logs(id) ON DELETE SET NULL,
    -- recording_url can be stored if it's a direct link or derived,
    -- but if call_log_id is present, it might be redundant here.
    -- recording_url TEXT,
    internal_notes TEXT,
    status faq_status_enum DEFAULT 'new',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_faqs_org_id ON faqs(org_id);
CREATE INDEX IF NOT EXISTS idx_faqs_status ON faqs(status);
CREATE INDEX IF NOT EXISTS idx_faqs_original_tags ON faqs USING GIN(original_tags);
CREATE INDEX IF NOT EXISTS idx_faqs_call_log_id ON faqs(call_log_id);
```
