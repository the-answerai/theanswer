-- Add answerai_chatflow_id column to research_views table
ALTER TABLE research_views ADD COLUMN IF NOT EXISTS answerai_chatflow_id UUID;

-- Add comment for the new column
COMMENT ON COLUMN research_views.answerai_chatflow_id IS 'ID of the associated chatflow in AnswerAI';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_research_views_chatflow_id ON research_views(answerai_chatflow_id); 