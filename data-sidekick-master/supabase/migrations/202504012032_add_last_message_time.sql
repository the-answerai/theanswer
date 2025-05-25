-- Add last_message_time column to chat_logs table
ALTER TABLE chat_logs
ADD COLUMN last_message_time timestamp with time zone;

-- Create an index for better query performance
CREATE INDEX idx_chat_logs_last_message_time ON chat_logs(last_message_time);

-- Add a comment to explain the column's purpose
COMMENT ON COLUMN chat_logs.last_message_time IS 'Timestamp of the most recent message in chat_messages';

-- Update existing rows to set last_message_time
UPDATE chat_logs
SET last_message_time = (
    SELECT MAX((msg->>'timestamp')::timestamp with time zone)
    FROM jsonb_array_elements(chat_messages) msg
    WHERE msg->>'timestamp' IS NOT NULL
);

-- Create a function to update last_message_time
CREATE OR REPLACE FUNCTION update_chat_last_message_time()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_message_time := (
        SELECT MAX((msg->>'timestamp')::timestamp with time zone)
        FROM jsonb_array_elements(NEW.chat_messages) msg
        WHERE msg->>'timestamp' IS NOT NULL
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update last_message_time
DROP TRIGGER IF EXISTS trigger_update_chat_last_message_time ON chat_logs;
CREATE TRIGGER trigger_update_chat_last_message_time
    BEFORE INSERT OR UPDATE OF chat_messages
    ON chat_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_last_message_time(); 