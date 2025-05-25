-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create sequences first
CREATE SEQUENCE IF NOT EXISTS tags_id_seq;

-- Create tables in order of dependencies
-- Tags table (no foreign key dependencies)
CREATE TABLE IF NOT EXISTS public.tags (
    color character varying(7),
    id integer NOT NULL DEFAULT nextval('tags_id_seq'::regclass),
    slug character varying(255) NOT NULL,
    description text,
    label character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    shade character varying(7),
    parent_id integer
);

-- Call Log table (no foreign key dependencies)
CREATE TABLE IF NOT EXISTS public.call_log (
    resolution_status text,
    summary text,
    "EMPLOYEE_NAME" text,
    "EMPLOYEE_ID" bigint,
    "TAGS_ARRAY" text[],
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    persona jsonb,
    sentiment_score numeric,
    "ANSWERED_BY" text,
    escalated boolean DEFAULT false,
    "CALLER_NAME" text,
    "TRANSCRIPTION" text,
    coaching text,
    "FILENAME" text,
    "CALL_TYPE" text,
    "RECORDING_URL" text NOT NULL,
    "CALL_DURATION" double precision,
    "CALL_NUMBER" text,
    "WORD_TIMESTAMPS" jsonb,
    "TAGS" text
);

-- Reports table (no foreign key dependencies)
CREATE TABLE IF NOT EXISTS public.reports (
    call_count integer,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    recording_ids jsonb DEFAULT '[]'::jsonb,
    custom_prompt text,
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    name text NOT NULL
);

-- Add primary key constraints
ALTER TABLE public.tags ADD CONSTRAINT tags_pkey PRIMARY KEY (id);
ALTER TABLE public.call_log ADD CONSTRAINT call_log_pkey PRIMARY KEY (id);
ALTER TABLE public.reports ADD CONSTRAINT reports_new_pkey1 PRIMARY KEY (id);

-- Add foreign key constraints
ALTER TABLE public.tags ADD CONSTRAINT fk_parent_id FOREIGN KEY (parent_id) REFERENCES public.tags (id);

-- Add indexes
CREATE UNIQUE INDEX IF NOT EXISTS call_log_recording_url_key ON public.call_log USING btree ("RECORDING_URL");
CREATE INDEX IF NOT EXISTS idx_call_log_recording_url ON public.call_log USING btree ("RECORDING_URL");
CREATE INDEX IF NOT EXISTS idx_call_log_persona ON public.call_log USING gin (persona);
CREATE INDEX IF NOT EXISTS idx_tags_parent_id ON public.tags USING btree (parent_id);
CREATE UNIQUE INDEX IF NOT EXISTS tags_slug_key ON public.tags USING btree (slug);
CREATE INDEX IF NOT EXISTS idx_tags_slug ON public.tags USING btree (slug);
CREATE UNIQUE INDEX IF NOT EXISTS reports_new_pkey1 ON public.reports USING btree (id);
