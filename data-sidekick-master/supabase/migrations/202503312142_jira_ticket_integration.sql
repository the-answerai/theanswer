-- Migration file for Jira Ticket Indexing System
-- This migration drops existing tables and recreates the schema for the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (in reverse order of dependencies)
DROP TABLE IF EXISTS jira_ticket_attachments CASCADE;
DROP TABLE IF EXISTS jira_tickets CASCADE;
DROP TABLE IF EXISTS jira_projects CASCADE;

-- Create jira_tickets table
CREATE TABLE IF NOT EXISTS jira_tickets (
    ticket_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    project_key TEXT NOT NULL,
    summary TEXT,
    description TEXT,
    status TEXT,
    priority TEXT,
    reporter TEXT,
    assignee TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    labels TEXT[] DEFAULT '{}',
    attachments TEXT[] DEFAULT '{}',
    comments JSONB DEFAULT '[]',
    metadata JSONB,
    concise_ticket_details TEXT,
    ai_summary TEXT,
    created TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create jira_ticket_attachments table
CREATE TABLE IF NOT EXISTS jira_ticket_attachments (
    attachment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL,
    ticket_key TEXT,
    file_name TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    content_type TEXT,
    size_bytes INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT,
    storage_url TEXT,
    CONSTRAINT fk_jira_ticket FOREIGN KEY (ticket_id) REFERENCES jira_tickets(ticket_id) ON DELETE CASCADE,
    CONSTRAINT unique_file_per_ticket UNIQUE (ticket_id, file_name)
);

-- Create jira_projects table
CREATE TABLE IF NOT EXISTS jira_projects (
    project_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    lead TEXT,
    url TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_jira_tickets_project_key ON jira_tickets(project_key);
CREATE INDEX IF NOT EXISTS idx_jira_tickets_status ON jira_tickets(status);
CREATE INDEX IF NOT EXISTS idx_jira_tickets_created_at ON jira_tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_jira_tickets_updated_at ON jira_tickets(updated_at);
CREATE INDEX IF NOT EXISTS idx_jira_ticket_attachments_ticket_id ON jira_ticket_attachments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_jira_ticket_attachments_ticket_key ON jira_ticket_attachments(ticket_key);

-- Create storage bucket for attachments
-- Note: This is a Supabase-specific command and may need to be executed separately
-- through the Supabase dashboard or API if not supported in migrations
INSERT INTO storage.buckets (id, name, public) 
VALUES ('Jira_issue_attachments', 'Jira_issue_attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS (Row Level Security) policies
-- These are examples and should be adjusted based on your security requirements
ALTER TABLE jira_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE jira_ticket_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE jira_projects ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Authenticated users can read all tickets"
ON jira_tickets FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can read all attachments"
ON jira_ticket_attachments FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can read all projects"
ON jira_projects FOR SELECT
TO authenticated
USING (true);

-- Create policies for service role (for your backend service)
CREATE POLICY "Service role can manage tickets"
ON jira_tickets FOR ALL
TO service_role
USING (true);

CREATE POLICY "Service role can manage attachments"
ON jira_ticket_attachments FOR ALL
TO service_role
USING (true);

CREATE POLICY "Service role can manage projects"
ON jira_projects FOR ALL
TO service_role
USING (true); 