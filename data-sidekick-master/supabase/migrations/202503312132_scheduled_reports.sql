-- Verify uuid-ossp extension is available (required for gen_random_uuid())
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_extension 
        WHERE extname = 'uuid-ossp'
    ) THEN
        CREATE EXTENSION "uuid-ossp";
    END IF;
END $$;

-- Create the scheduled reports table if it doesn't exist
CREATE TABLE IF NOT EXISTS scheduled_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    prompt TEXT NOT NULL,
    filters JSONB NOT NULL DEFAULT '{}',
    schedule VARCHAR(100) NOT NULL, -- Cron expression
    last_run_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'active' -- active, paused, error
);

-- Create index if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'idx_scheduled_reports_last_run'
        AND n.nspname = 'public'
    ) THEN
        CREATE INDEX idx_scheduled_reports_last_run ON scheduled_reports(last_run_at);
    END IF;
END $$;

-- Create the updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_scheduled_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists and recreate it
DROP TRIGGER IF EXISTS trigger_update_scheduled_reports_timestamp ON scheduled_reports;
CREATE TRIGGER trigger_update_scheduled_reports_timestamp
    BEFORE UPDATE ON scheduled_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_scheduled_reports_updated_at();

-- Enable RLS
ALTER TABLE scheduled_reports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own scheduled reports" ON scheduled_reports;
DROP POLICY IF EXISTS "Users can create their own scheduled reports" ON scheduled_reports;
DROP POLICY IF EXISTS "Users can update their own scheduled reports" ON scheduled_reports;
DROP POLICY IF EXISTS "Users can delete their own scheduled reports" ON scheduled_reports;

-- Create new policies
CREATE POLICY "Users can view their own scheduled reports"
    ON scheduled_reports
    FOR SELECT
    USING (true);

CREATE POLICY "Users can create their own scheduled reports"
    ON scheduled_reports
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can update their own scheduled reports"
    ON scheduled_reports
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Users can delete their own scheduled reports"
    ON scheduled_reports
    FOR DELETE
    USING (true);

-- Create a rollback function that can be called if needed
CREATE OR REPLACE FUNCTION rollback_scheduled_reports_migration()
RETURNS void AS $$
BEGIN
    -- Drop policies
    DROP POLICY IF EXISTS "Users can view their own scheduled reports" ON scheduled_reports;
    DROP POLICY IF EXISTS "Users can create their own scheduled reports" ON scheduled_reports;
    DROP POLICY IF EXISTS "Users can update their own scheduled reports" ON scheduled_reports;
    DROP POLICY IF EXISTS "Users can delete their own scheduled reports" ON scheduled_reports;
    
    -- Drop trigger
    DROP TRIGGER IF EXISTS trigger_update_scheduled_reports_timestamp ON scheduled_reports;
    
    -- Drop function
    DROP FUNCTION IF EXISTS update_scheduled_reports_updated_at();
    
    -- Drop index
    DROP INDEX IF EXISTS idx_scheduled_reports_last_run;
    
    -- Drop table
    DROP TABLE IF EXISTS scheduled_reports;
END;
$$ LANGUAGE plpgsql; 