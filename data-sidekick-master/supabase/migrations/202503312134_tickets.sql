-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tickets table
CREATE TABLE IF NOT EXISTS public.tickets (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    title text NOT NULL,
    description text,
    status text NOT NULL DEFAULT 'open',
    priority text NOT NULL DEFAULT 'medium',
    created_by text NOT NULL,
    assigned_to text,
    tags_array text[], -- Using the same pattern as call_log table
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    resolved_at timestamp with time zone,
    escalated boolean DEFAULT false,
    ticket_type text NOT NULL, -- email, call, slack, support_portal
    source_system text NOT NULL DEFAULT 'jira', -- jira, zendesk, etc.
    source_id text, -- ID from the source system
    sentiment_score numeric,
    resolution text,
    external_url text -- URL to the ticket in the source system
);

-- Add primary key constraint
ALTER TABLE public.tickets ADD CONSTRAINT tickets_pkey PRIMARY KEY (id);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets USING btree (status);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON public.tickets USING btree (assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON public.tickets USING btree (created_at);
CREATE INDEX IF NOT EXISTS idx_tickets_resolved_at ON public.tickets USING btree (resolved_at);
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_type ON public.tickets USING btree (ticket_type);
CREATE INDEX IF NOT EXISTS idx_tickets_source_system ON public.tickets USING btree (source_system);
CREATE INDEX IF NOT EXISTS idx_tickets_tags_array ON public.tickets USING gin (tags_array);

-- Create the updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_tickets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating updated_at
DROP TRIGGER IF EXISTS trigger_update_tickets_timestamp ON tickets;
CREATE TRIGGER trigger_update_tickets_timestamp
    BEFORE UPDATE ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_tickets_updated_at();

-- Enable RLS
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can view tickets" ON tickets;
DROP POLICY IF EXISTS "Users can create tickets" ON tickets;
DROP POLICY IF EXISTS "Users can update tickets" ON tickets;

CREATE POLICY "Users can view tickets"
    ON tickets
    FOR SELECT
    USING (true);

CREATE POLICY "Users can create tickets"
    ON tickets
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can update tickets"
    ON tickets
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Create a rollback function
CREATE OR REPLACE FUNCTION rollback_tickets_migration()
RETURNS void AS $$
BEGIN
    -- Drop policies
    DROP POLICY IF EXISTS "Users can view tickets" ON tickets;
    DROP POLICY IF EXISTS "Users can create tickets" ON tickets;
    DROP POLICY IF EXISTS "Users can update tickets" ON tickets;
    
    -- Drop trigger
    DROP TRIGGER IF EXISTS trigger_update_tickets_timestamp ON tickets;
    
    -- Drop function
    DROP FUNCTION IF EXISTS update_tickets_updated_at();
    
    -- Drop indexes
    DROP INDEX IF EXISTS idx_tickets_status;
    DROP INDEX IF EXISTS idx_tickets_assigned_to;
    DROP INDEX IF EXISTS idx_tickets_created_at;
    DROP INDEX IF EXISTS idx_tickets_resolved_at;
    DROP INDEX IF EXISTS idx_tickets_ticket_type;
    DROP INDEX IF EXISTS idx_tickets_source_system;
    DROP INDEX IF EXISTS idx_tickets_tags_array;
    
    -- Drop table
    DROP TABLE IF EXISTS tickets;
END;
$$ LANGUAGE plpgsql; 