-- Create a storage bucket for meetings
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'meetings',
    'Meetings',
    true,
    2147483648, -- 2GB
    ARRAY[
        'text/plain', 
        'text/csv', 
        'text/markdown',
        'application/pdf', 
        'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
        'application/vnd.ms-excel', 
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/json',
        'audio/mpeg', 
        'audio/mp4', 
        'audio/wav', 
        'audio/webm',
        'audio/ogg',
        'video/mp4', 
        'video/webm', 
        'video/quicktime',
        'video/x-msvideo',
        'image/jpeg', 
        'image/png', 
        'image/gif',
        'image/webp'
    ]
)
ON CONFLICT (id) DO NOTHING;

-- Create a storage bucket for JIRA attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'jira_attachments',
    'JIRA Attachments',
    true,
    2147483648, -- 2GB
    ARRAY[
        'text/plain', 
        'text/csv', 
        'text/markdown',
        'application/pdf', 
        'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
        'application/vnd.ms-excel', 
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/json',
        'audio/mpeg', 
        'audio/mp4', 
        'audio/wav', 
        'audio/webm',
        'audio/ogg',
        'video/mp4', 
        'video/webm', 
        'video/quicktime',
        'video/x-msvideo',
        'image/jpeg', 
        'image/png', 
        'image/gif',
        'image/webp'
    ]
)
ON CONFLICT (id) DO NOTHING;

-- Since these buckets are public, we don't need RLS policies
-- However, we still need to grant access to the service role for management operations
GRANT ALL ON storage.objects TO service_role; 