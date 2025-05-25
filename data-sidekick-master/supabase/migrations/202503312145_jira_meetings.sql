-- Enable required extensions if not already installed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";  -- for uuid_generate_v4()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- for gen_random_uuid()

-- Sequence for jira_ticket_attachments.id, if it does not already exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relkind = 'S'
          AND c.relname = 'jira_ticket_attachments_id_seq'
          AND n.nspname = 'public'
    )
    THEN
        CREATE SEQUENCE public.jira_ticket_attachments_id_seq
            START WITH 1
            INCREMENT BY 1
            NO MINVALUE
            NO MAXVALUE
            CACHE 1;
    END IF;
END$$;

--------------------------------------------------------------------------------
-- jira_ticket_attachments
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.jira_ticket_attachments (
    id            BIGINT NOT NULL 
                  DEFAULT nextval('jira_ticket_attachments_id_seq'::regclass),
    ticket_key    TEXT   NOT NULL,
    file_name     TEXT   NOT NULL,
    storage_path  TEXT   NOT NULL,
    content_type  TEXT,
    size_bytes    BIGINT,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by    TEXT,
    storage_url   TEXT,
    last_updated  TIMESTAMP WITH TIME ZONE DEFAULT now(),
    ticket_id     UUID   NOT NULL,

    -- Optional: designate a primary key
    CONSTRAINT jira_ticket_attachments_pk PRIMARY KEY (id)
);

--------------------------------------------------------------------------------
-- jira_tickets
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.jira_tickets (
    ticket_id              UUID NOT NULL DEFAULT uuid_generate_v4(),
    key                    TEXT NOT NULL,
    summary                TEXT NOT NULL,
    description            TEXT,
    status                 TEXT NOT NULL DEFAULT 'open',
    priority               TEXT NOT NULL DEFAULT 'medium',
    assignee               TEXT,
    reporter               TEXT,
    created_at             TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at             TIMESTAMP WITH TIME ZONE DEFAULT now(),
    resolved_at            TIMESTAMP WITH TIME ZONE,
    labels                 TEXT[] DEFAULT ARRAY[]::TEXT[],
    comments               JSONB[] DEFAULT ARRAY[]::JSONB[],
    metadata               JSONB  DEFAULT '{}'::JSONB,
    attachments            JSONB,
    concise_ticket_details TEXT,
    ai_summary             TEXT,
    project_key            TEXT,

    -- Optional: designate a primary key
    CONSTRAINT jira_tickets_pk PRIMARY KEY (ticket_id)
);

--------------------------------------------------------------------------------
-- meetings
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.meetings (
    id             UUID NOT NULL DEFAULT gen_random_uuid(),
    meeting_date   DATE,
    meeting_title  TEXT NOT NULL DEFAULT ''::TEXT,
    meeting_type   TEXT,
    participants   JSONB,
    transcript_id  TEXT,
    audio_id       TEXT,
    video_id       TEXT,
    host_email     TEXT,
    meeting_summary TEXT,
    timeline_json  JSON,

    -- Optional: designate a primary key
    CONSTRAINT meetings_pk PRIMARY KEY (id)
);

--------------------------------------------------------------------------------
-- meetings_files
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.meetings_files (
    id         UUID NOT NULL DEFAULT uuid_generate_v4(),
    meeting_id UUID,
    file_name  TEXT,
    file_path  TEXT,
    file_type  TEXT,
    file_size  BIGINT,
    storage_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

    -- Optional: designate a primary key
    CONSTRAINT meetings_files_pk PRIMARY KEY (id)

    -- If you want to reference the meetings table:
    -- CONSTRAINT meetings_files_meeting_fk
    --     FOREIGN KEY (meeting_id)
    --     REFERENCES public.meetings(id)
    --     ON DELETE SET NULL
);