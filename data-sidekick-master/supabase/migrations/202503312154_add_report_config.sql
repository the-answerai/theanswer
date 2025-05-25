-- Add report_config column to store report structure
ALTER TABLE public.reports
ADD COLUMN IF NOT EXISTS report_config jsonb DEFAULT '[]'::jsonb;

-- Add GIN index for efficient querying of report_config
CREATE INDEX IF NOT EXISTS idx_reports_report_config ON public.reports USING gin (report_config);

-- Add comment to describe the structure
COMMENT ON COLUMN public.reports.report_config IS 'Array of report sections and focus areas. Structure: [{id: string, title: string, description: string, focus_areas: string[]}]'; 