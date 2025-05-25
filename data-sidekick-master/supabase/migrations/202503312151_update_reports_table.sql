-- Drop existing tables
DROP TABLE IF EXISTS public.analyzer_reports;
DROP TABLE IF EXISTS public.reports;

-- Create the new reports table with updated structure
CREATE TABLE public.reports (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    research_view_id uuid NOT NULL REFERENCES public.research_views(id) ON DELETE CASCADE,
    name text NOT NULL,
    content text,
    version integer DEFAULT 1,
    
    -- Store the user's original prompt and its variations
    original_prompt text,
    prompt_variations jsonb DEFAULT '[]'::jsonb, -- Array of alternative phrasings and keywords
    
    -- Store report configuration
    report_config jsonb DEFAULT '[]'::jsonb, -- Array of report sections and focus areas
    
    -- Store vector search results
    vector_search_results jsonb DEFAULT '[]'::jsonb, -- Array of document IDs and metadata from vector search
    
    -- Store document analysis
    documents_analyzed jsonb DEFAULT '[]'::jsonb, -- Array of document analysis objects
    /* Structure:
    {
        documentId: string,
        content_analyzed: string,
        reason_to_include: string,
        analysis: string
    }[]
    */
    
    custom_prompt text,
    status text DEFAULT 'configuring',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (id)
);

-- Add index for research_view_id for better query performance
CREATE INDEX idx_reports_research_id ON public.reports USING btree (research_view_id);

-- Add GIN indexes for efficient querying of JSONB fields
CREATE INDEX idx_reports_documents_analyzed ON public.reports USING gin (documents_analyzed);
CREATE INDEX idx_reports_vector_search_results ON public.reports USING gin (vector_search_results);
CREATE INDEX idx_reports_prompt_variations ON public.reports USING gin (prompt_variations);
CREATE INDEX idx_reports_report_config ON public.reports USING gin (report_config); 