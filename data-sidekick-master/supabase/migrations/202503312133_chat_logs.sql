-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create chat_logs table
CREATE TABLE IF NOT EXISTS public.chat_logs (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    chatbot_name text NOT NULL,
    ai_model text NOT NULL,
    resolution_status text,
    summary text,
    coaching text,
    persona jsonb,
    sentiment_score numeric,
    tags_array text[],
    tools_used text[],
    chat_messages jsonb NOT NULL, -- Array of messages with timestamp, role, and content
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Add primary key constraint
ALTER TABLE public.chat_logs ADD CONSTRAINT chat_logs_pkey PRIMARY KEY (id);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_chat_logs_chatbot_name ON public.chat_logs USING btree (chatbot_name);
CREATE INDEX IF NOT EXISTS idx_chat_logs_ai_model ON public.chat_logs USING btree (ai_model);
CREATE INDEX IF NOT EXISTS idx_chat_logs_created_at ON public.chat_logs USING btree (created_at);
CREATE INDEX IF NOT EXISTS idx_chat_logs_persona ON public.chat_logs USING gin (persona);

-- Create the updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_chat_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating updated_at
CREATE TRIGGER trigger_update_chat_logs_timestamp
    BEFORE UPDATE ON chat_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_logs_updated_at();

-- Enable RLS
ALTER TABLE chat_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view chat logs"
    ON chat_logs
    FOR SELECT
    USING (true);

CREATE POLICY "Users can create chat logs"
    ON chat_logs
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can update chat logs"
    ON chat_logs
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Create a rollback function
CREATE OR REPLACE FUNCTION rollback_chat_logs_migration()
RETURNS void AS $$
BEGIN
    -- Drop policies
    DROP POLICY IF EXISTS "Users can view chat logs" ON chat_logs;
    DROP POLICY IF EXISTS "Users can create chat logs" ON chat_logs;
    DROP POLICY IF EXISTS "Users can update chat logs" ON chat_logs;
    
    -- Drop trigger
    DROP TRIGGER IF EXISTS trigger_update_chat_logs_timestamp ON chat_logs;
    
    -- Drop function
    DROP FUNCTION IF EXISTS update_chat_logs_updated_at();
    
    -- Drop indexes
    DROP INDEX IF EXISTS idx_chat_logs_chatbot_name;
    DROP INDEX IF EXISTS idx_chat_logs_ai_model;
    DROP INDEX IF EXISTS idx_chat_logs_created_at;
    DROP INDEX IF EXISTS idx_chat_logs_persona;
    
    -- Drop table
    DROP TABLE IF EXISTS chat_logs;
END;
$$ LANGUAGE plpgsql; 