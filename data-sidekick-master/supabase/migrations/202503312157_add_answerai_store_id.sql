-- Add answerai_store_id column to research_views table
ALTER TABLE research_views
ADD COLUMN IF NOT EXISTS answerai_store_id UUID DEFAULT NULL;

-- Add comment to the column
COMMENT ON COLUMN research_views.answerai_store_id IS 'UUID of the document store in AnswerAI'; 