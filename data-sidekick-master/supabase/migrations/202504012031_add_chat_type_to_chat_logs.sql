-- Create chat_type enum type
CREATE TYPE chat_type AS ENUM ('live', 'ai');

-- Make ai_model nullable since live chats won't have an AI model
ALTER TABLE chat_logs
ALTER COLUMN ai_model DROP NOT NULL;

-- Add chat_type column to chat_logs table with default value 'ai'
ALTER TABLE chat_logs
ADD COLUMN chat_type chat_type NOT NULL DEFAULT 'ai';

-- Add index for better query performance
CREATE INDEX idx_chat_logs_chat_type ON chat_logs(chat_type);

-- Add a check constraint to ensure ai_model is not null when chat_type is 'ai'
ALTER TABLE chat_logs
ADD CONSTRAINT chk_ai_model_not_null_for_ai_chats 
CHECK (
    (chat_type = 'live' AND ai_model IS NULL) OR 
    (chat_type = 'ai' AND ai_model IS NOT NULL)
); 