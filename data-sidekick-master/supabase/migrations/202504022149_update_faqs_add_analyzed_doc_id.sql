-- Modify faqs table to replace transcript_id with analyzed_doc_id
-- This makes faqs more flexible by allowing relationships to multiple source tables

-- First, add the new column to faqs table
ALTER TABLE public.faqs 
ADD COLUMN analyzed_doc_id uuid;

-- Create an index on the new column
CREATE INDEX IF NOT EXISTS idx_faqs_analyzed_doc_id ON public.faqs(analyzed_doc_id);

-- Comment on the new column
COMMENT ON COLUMN public.faqs.analyzed_doc_id IS 'Reference to the source document this FAQ was extracted from';

-- Migrate existing data
-- For call_log transcripts, we'll copy data to analyzed_doc_id
DO $$
BEGIN
    -- Update faqs to use analyzed_doc_id instead of transcript_id
    UPDATE public.faqs
    SET analyzed_doc_id = transcript_id
    WHERE transcript_id IS NOT NULL;
END $$;

-- Make analyzed_doc_id not null if all data has been migrated
-- Only do this if we have no null values
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.faqs WHERE analyzed_doc_id IS NULL AND transcript_id IS NOT NULL) THEN
        ALTER TABLE public.faqs ALTER COLUMN analyzed_doc_id SET NOT NULL;
    END IF;
END $$;

-- Finally, drop the transcript_id column
-- Uncomment after verifying the migration worked correctly
-- ALTER TABLE public.faqs DROP COLUMN transcript_id;

-- Update the relevant indexes
DROP INDEX IF EXISTS faqs_transcript_id_idx; 