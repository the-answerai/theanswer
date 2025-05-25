-- Update the data_sources table to allow additional source types
ALTER TABLE public.data_sources 
DROP CONSTRAINT data_sources_source_type_check,
ADD CONSTRAINT data_sources_source_type_check 
CHECK (source_type IN ('website', 'file', 'audio', 'video', 'calls', 'chat', 'ticket', 'meeting')); 