-- Function to get call_log entries with empty TAGS_ARRAY
CREATE OR REPLACE FUNCTION get_empty_tags_array_entries(limit_count integer DEFAULT NULL)
RETURNS TABLE (
  recording_url text,
  transcription text
) AS $$
BEGIN
  IF limit_count IS NULL THEN
    RETURN QUERY
    SELECT "RECORDING_URL" as recording_url, "TRANSCRIPTION" as transcription
    FROM call_log
    WHERE "TAGS_ARRAY" IS NULL OR "TAGS_ARRAY" = '{}' OR "TAGS_ARRAY" = '[]';
  ELSE
    RETURN QUERY
    SELECT "RECORDING_URL" as recording_url, "TRANSCRIPTION" as transcription
    FROM call_log
    WHERE "TAGS_ARRAY" IS NULL OR "TAGS_ARRAY" = '{}' OR "TAGS_ARRAY" = '[]'
    LIMIT limit_count;
  END IF;
END;
$$ LANGUAGE plpgsql; 