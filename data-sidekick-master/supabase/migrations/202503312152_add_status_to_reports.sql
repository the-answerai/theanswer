-- Add status field to reports table
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'configuring' CHECK (status IN ('configuring', 'generating', 'completed', 'failed')),
ADD COLUMN IF NOT EXISTS error_message text; 