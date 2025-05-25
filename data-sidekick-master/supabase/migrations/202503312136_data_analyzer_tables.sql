-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Research Views table (projects for research)
CREATE TABLE IF NOT EXISTS public.research_views (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    description text,
    user_id uuid REFERENCES auth.users(id),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (id)
);

-- Data Sources table (websites, files, etc.)
CREATE TABLE IF NOT EXISTS public.data_sources (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    research_view_id uuid NOT NULL REFERENCES public.research_views(id) ON DELETE CASCADE,
    source_type text NOT NULL CHECK (source_type IN ('website', 'file', 'audio', 'video')), -- expandable in future
    url text, -- for website sources
    file_path text, -- for file sources
    filter_date_start timestamp with time zone,
    filter_date_end timestamp with time zone,
    filter_paths text[], -- array of subpaths to include
    last_fetched_at timestamp with time zone,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'fetching', 'completed', 'error')),
    error_message text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (id)
);

-- Documents table (fetched content)
CREATE TABLE IF NOT EXISTS public.documents (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    source_id uuid NOT NULL REFERENCES public.data_sources(id) ON DELETE CASCADE,
    title text,
    url text, -- original URL for web pages
    author text,
    publication_date timestamp with time zone,
    content text NOT NULL,
    content_summary text,
    token_count integer,
    word_count integer,
    file_type text NOT NULL DEFAULT 'html',
    category_ai text, -- AI-suggested category
    category_user text, -- User-defined category
    status text NOT NULL DEFAULT 'processed' CHECK (status IN ('processing', 'processed', 'error')),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (id)
);

-- Document Metadata table (custom fields)
CREATE TABLE IF NOT EXISTS public.document_metadata (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    field_name text NOT NULL,
    field_prompt text, -- The AI prompt used to generate this field
    field_value text,
    is_predefined boolean DEFAULT false, -- Whether this is a system field or user-created
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (id)
);

-- Categories table (taxonomy)
CREATE TABLE IF NOT EXISTS public.analyzer_categories (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    research_view_id uuid NOT NULL REFERENCES public.research_views(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    parent_id uuid REFERENCES public.analyzer_categories(id),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (id)
);

-- Document Categories table (many-to-many)
CREATE TABLE IF NOT EXISTS public.document_categories (
    document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    category_id uuid NOT NULL REFERENCES public.analyzer_categories(id) ON DELETE CASCADE,
    assigned_by text NOT NULL CHECK (assigned_by IN ('ai', 'user')),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (document_id, category_id)
);

-- Document Chunks table (for large documents)
CREATE TABLE IF NOT EXISTS public.document_chunks (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    chunk_index integer NOT NULL,
    chunk_text text NOT NULL,
    embedding vector(1536), -- OpenAI embedding dimension
    token_count integer,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (id)
);

-- Analyzer Reports table
CREATE TABLE IF NOT EXISTS public.analyzer_reports (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    research_view_id uuid NOT NULL REFERENCES public.research_views(id) ON DELETE CASCADE,
    name text NOT NULL,
    content text NOT NULL,
    version integer DEFAULT 1,
    document_ids jsonb DEFAULT '[]'::jsonb, -- Array of document IDs included in report
    custom_prompt text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (id)
);

-- Usage Logs table (token tracking)
CREATE TABLE IF NOT EXISTS public.usage_logs (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id),
    research_view_id uuid REFERENCES public.research_views(id) ON DELETE SET NULL,
    operation_type text NOT NULL, -- 'embedding', 'summarization', 'analysis', etc.
    tokens_input integer NOT NULL DEFAULT 0,
    tokens_output integer NOT NULL DEFAULT 0,
    estimated_cost decimal(10, 6) NOT NULL DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_documents_source_id ON public.documents USING btree (source_id);
CREATE INDEX IF NOT EXISTS idx_document_metadata_doc_id ON public.document_metadata USING btree (document_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_doc_id ON public.document_chunks USING btree (document_id);
CREATE INDEX IF NOT EXISTS idx_document_categories_doc_id ON public.document_categories USING btree (document_id);
CREATE INDEX IF NOT EXISTS idx_document_categories_cat_id ON public.document_categories USING btree (category_id);
CREATE INDEX IF NOT EXISTS idx_analyzer_categories_research_id ON public.analyzer_categories USING btree (research_view_id);
CREATE INDEX IF NOT EXISTS idx_analyzer_reports_research_id ON public.analyzer_reports USING btree (research_view_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON public.usage_logs USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_research_id ON public.usage_logs USING btree (research_view_id);
CREATE INDEX IF NOT EXISTS idx_data_sources_research_id ON public.data_sources USING btree (research_view_id);

-- Create vector index for document chunks embeddings
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding ON public.document_chunks USING ivfflat (embedding vector_cosine_ops); 