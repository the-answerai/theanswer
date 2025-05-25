-- Add documents_cited and suggested_response columns to chat_logs
ALTER TABLE public.chat_logs
ADD COLUMN IF NOT EXISTS documents_cited jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS suggested_response text;

-- Add a foreign key constraint to ensure document IDs exist
CREATE OR REPLACE FUNCTION validate_document_ids() RETURNS trigger AS $$
BEGIN
  IF NEW.documents_cited IS NOT NULL THEN
    -- Check if all document IDs in the array exist in the documents table
    IF EXISTS (
      SELECT 1
      FROM jsonb_array_elements(NEW.documents_cited) AS doc
      LEFT JOIN public.documents ON documents.id = (doc->>'id')::uuid
      WHERE documents.id IS NULL
    ) THEN
      RAISE EXCEPTION 'Invalid document ID referenced in documents_cited';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate document IDs
DROP TRIGGER IF EXISTS validate_document_ids_trigger ON public.chat_logs;
CREATE TRIGGER validate_document_ids_trigger
  BEFORE INSERT OR UPDATE ON public.chat_logs
  FOR EACH ROW
  EXECUTE FUNCTION validate_document_ids();

-- Add comment explaining the columns
COMMENT ON COLUMN public.chat_logs.documents_cited IS 'Array of documents referenced in the chat, with their metadata';
COMMENT ON COLUMN public.chat_logs.suggested_response IS 'AI-suggested response for the agent'; 