-- Allow null values in content field for reports in configuration
ALTER TABLE reports 
ALTER COLUMN content DROP NOT NULL,
ALTER COLUMN documents_analyzed DROP NOT NULL; 