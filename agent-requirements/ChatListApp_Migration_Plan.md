**ChatListPage Migration Plan (`ChatListApp`)**

**1. Current Functionality & UX:**

-   **Purpose:** Manages and displays a list of chats. The actual implementation is within the `ChatManager` component.
-   **Main View:** Renders the `ChatManager` component.
-   **UX:** Dependent on `ChatManager`. We need to analyze `ChatManager` to understand its features:
    -   How chats are listed (e.g., recent chats, user's chats).
    -   Information displayed per chat (e.g., participants, last message, timestamp).
    -   Actions available (e.g., opening a chat, starting a new chat, deleting a chat).
    -   Filtering or search capabilities.

**2. UI Components (Material UI):**

-   `Box` (from `ChatListPage.jsx`).
-   `ChatManager` component will use various MUI components for layout, lists, input fields, buttons, etc. These must be identified from the `ChatManager` source.

**3. Backend Interactions & APIs (Inferred):**

-   `ChatManager` will interact with a backend to fetch chat sessions, messages, and potentially manage chat creation/deletion.
-   **Potential Endpoints:**
    -   `GET /api/v1/chats?orgId={orgId}&userId={userId}&page={page}&limit={limit}`: To list chat sessions for a user/org.
        -   Response: `{ chats: [chatSession1, ...], pagination: { ... } }`
        -   `chatSession` might include: `id`, `participants`, `last_message_snippet`, `last_message_timestamp`, `unread_count`.
    -   `GET /api/v1/chats/{chatId}/messages?orgId={orgId}&page={page}&limit={limit}`: To fetch messages for a specific chat.
    -   `POST /api/v1/chats`: To create a new chat session.
    -   `POST /api/v1/chats/{chatId}/messages`: To send a new message.
    -   Backend might use WebSockets for real-time chat updates.

**4. Proposed Database Schema (Standardized: `snake_case`):**

-   **Table: `chat_sessions`**

    -   `id`: `UUID` (Primary Key)
    -   `org_id`: `UUID` (NOT NULL)
    -   `created_at`: `TIMESTAMP WITH TIME ZONE` (NOT NULL, `DEFAULT now()`)
    -   `updated_at`: `TIMESTAMP WITH TIME ZONE` (NOT NULL, `DEFAULT now()`)
    -   `last_message_at`: `TIMESTAMP WITH TIME ZONE` (For sorting)
    -   `metadata`: `JSONB` (e.g., chat title, specific context)

-   **Table: `chat_participants`** (Junction table for many-to-many between users and chat_sessions)

    -   `id`: `UUID` (Primary Key)
    -   `chat_session_id`: `UUID` (FK to `chat_sessions.id`)
    -   `user_id`: `UUID` (FK to `users.id`)
    -   `joined_at`: `TIMESTAMP WITH TIME ZONE` (NOT NULL, `DEFAULT now()`)
    -   `last_read_at`: `TIMESTAMP WITH TIME ZONE` (To track unread messages)
    -   UNIQUE (`chat_session_id`, `user_id`)

-   **Table: `chat_messages`**
    -   `id`: `UUID` (Primary Key)
    -   `chat_session_id`: `UUID` (FK to `chat_sessions.id`)
    -   `sender_user_id`: `UUID` (FK to `users.id`)
    -   `content`: `TEXT` (NOT NULL)
    -   `message_type`: `TEXT` (e.g., 'text', 'image', 'file', 'system')
    -   `created_at`: `TIMESTAMP WITH TIME ZONE` (NOT NULL, `DEFAULT now()`)
    -   `metadata`: `JSONB` (e.g., for attachments, reactions)

**5. Code Structure & Reuse (Target: `packages-answers/ui/src/ChatListApp/`):**

-   **`ChatListApp.Client.tsx`:**
    -   Main client component, will render `ChatManager`.
    -   Pass `user`, `accessToken`.
-   **`components/ChatManager.tsx`:**
    -   The core component, needs migration/re-implementation from `../components/chats/ChatManager`.
    -   Will handle:
        -   Listing chat sessions.
        -   Displaying individual chat views (or navigating to them).
        -   Sending/receiving messages.
    -   Integrate with new backend APIs and WebSocket connections if applicable.
-   **`components/ChatListItem.tsx`:** Component for rendering a single item in the chat list.
-   **`components/ChatMessage.tsx`:** Component for rendering a single message within a chat.
-   **`services/chatService.ts` (optional):** Client-side service to encapsulate API calls and WebSocket logic for chats.
-   **`types.ts`:**
    -   Define `ChatSession`, `ChatMessage`, `ChatParticipant` interfaces.

**6. Backend API Requirements (New or Adapted):**

-   CRUD operations for `chat_sessions`, `chat_messages`.
-   Logic for managing `chat_participants`.
-   API endpoints as outlined in point 3, secured and using `orgId` and `userId` for context.
-   WebSocket server/handler for real-time message delivery.
-   Controllers in `packages-answers/server/src/controllers/chatController.ts`.
-   Services in `packages-answers/server/src/services/chatService.ts`.

**7. Standardization Opportunities:**

-   **Real-time Communication:** If WebSockets are used, standardize the connection management, message format, and event handling.
-   **Chat UI Components:** `ChatListItem` and `ChatMessage` could be designed for reusability if chat functionality appears elsewhere.
-   **API for Chats:** A well-defined API for chat operations.

**8. DB Script Snippet (PostgreSQL - conceptual):**

```sql
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_message_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_org_id ON chat_sessions(org_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_last_message_at ON chat_sessions(last_message_at DESC);

CREATE TABLE IF NOT EXISTS chat_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL, -- Assuming a users table exists and user_id is FK to it
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_read_at TIMESTAMP WITH TIME ZONE,
    UNIQUE (chat_session_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_participants_chat_session_id ON chat_participants(chat_session_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_user_id ON chat_participants(user_id);

CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    sender_user_id UUID NOT NULL, -- Assuming a users table exists
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text', -- e.g., 'text', 'image', 'file', 'system'
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_session_id_created_at ON chat_messages(chat_session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_user_id ON chat_messages(sender_user_id);

-- Function to update chat_sessions.updated_at and last_message_at when a new message is inserted
CREATE OR REPLACE FUNCTION update_chat_session_on_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chat_sessions
    SET updated_at = NEW.created_at,
        last_message_at = NEW.created_at
    WHERE id = NEW.chat_session_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_chat_session
AFTER INSERT ON chat_messages
FOR EACH ROW
EXECUTE FUNCTION update_chat_session_on_message();
```
