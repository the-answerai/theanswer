-- Check if chat_status column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'chat_logs'
        AND column_name = 'chat_status'
    ) THEN
        -- Add chat_status column to chat_logs table
        ALTER TABLE chat_logs
        ADD COLUMN chat_status text DEFAULT 'new';

        -- Create an index for better query performance
        CREATE INDEX IF NOT EXISTS idx_chat_logs_chat_status ON chat_logs(chat_status);

        -- Add a comment to explain the column's purpose
        COMMENT ON COLUMN chat_logs.chat_status IS 'Current status of the chat (new, waiting_on_reply, needs_response, resolved)';

        -- Update existing rows to set chat_status to 'new' if null
        UPDATE chat_logs
        SET chat_status = 'new'
        WHERE chat_status IS NULL;
    END IF;
END $$;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema'; 