-- Create a storage bucket for research files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'research_files',
    'Research Files',
    false,
    52428800, -- 50MB
    ARRAY[
        'text/plain', 
        'text/csv', 
        'text/markdown',
        'application/pdf', 
        'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
        'application/vnd.ms-excel', 
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/json',
        'audio/mpeg', 
        'audio/mp4', 
        'audio/wav', 
        'audio/webm',
        'audio/ogg',
        'video/mp4', 
        'video/webm', 
        'video/quicktime',
        'video/x-msvideo',
        'image/jpeg', 
        'image/png', 
        'image/gif',
        'image/webp'
    ]
)
ON CONFLICT (id) DO NOTHING;

-- Create storage access policies

-- Policy to allow users to read their own files
CREATE POLICY "Users can view their own research files"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'research_files' AND 
    (storage.foldername(name))[1] IN (
        SELECT id::text FROM research_views WHERE user_id = auth.uid()
    )
);

-- Policy to allow users to upload to their research views
CREATE POLICY "Users can upload to their own research views"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'research_files' AND 
    (storage.foldername(name))[1] IN (
        SELECT id::text FROM research_views WHERE user_id = auth.uid()
    )
);

-- Policy to allow users to update their files
CREATE POLICY "Users can update their own research files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'research_files' AND 
    (storage.foldername(name))[1] IN (
        SELECT id::text FROM research_views WHERE user_id = auth.uid()
    )
);

-- Policy to allow users to delete their files
CREATE POLICY "Users can delete their own research files"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'research_files' AND 
    (storage.foldername(name))[1] IN (
        SELECT id::text FROM research_views WHERE user_id = auth.uid()
    )
);

-- Create the table to track uploaded files
CREATE TABLE IF NOT EXISTS public.research_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    research_view_id UUID NOT NULL REFERENCES public.research_views(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    filename TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'unprocessed' CHECK (status IN ('unprocessed', 'processing', 'processed', 'error')),
    processing_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    processed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- RLS for research_files
ALTER TABLE public.research_files ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to read their own research files
CREATE POLICY "Users can view their own research files data"
ON public.research_files FOR SELECT
TO authenticated
USING (
    research_view_id IN (
        SELECT id FROM research_views WHERE user_id = auth.uid()
    )
);

-- Policy to allow users to insert their own research files data
CREATE POLICY "Users can insert their own research files data"
ON public.research_files FOR INSERT
TO authenticated
WITH CHECK (
    research_view_id IN (
        SELECT id FROM research_views WHERE user_id = auth.uid()
    )
);

-- Policy to allow users to update their own research files data
CREATE POLICY "Users can update their own research files data"
ON public.research_files FOR UPDATE
TO authenticated
USING (
    research_view_id IN (
        SELECT id FROM research_views WHERE user_id = auth.uid()
    )
);

-- Policy to allow users to delete their own research files data
CREATE POLICY "Users can delete their own research files data"
ON public.research_files FOR DELETE
TO authenticated
USING (
    research_view_id IN (
        SELECT id FROM research_views WHERE user_id = auth.uid()
    )
);

-- Grant permissions
GRANT ALL ON public.research_files TO anon, authenticated, service_role; 