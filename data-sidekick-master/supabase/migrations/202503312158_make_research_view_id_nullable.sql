-- Make research_view_id nullable in reports table
ALTER TABLE public.reports
    ALTER COLUMN research_view_id DROP NOT NULL; 