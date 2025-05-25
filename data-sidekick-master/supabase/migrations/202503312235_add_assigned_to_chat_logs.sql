-- Add assigned_to column to chat_logs
ALTER TABLE public.chat_logs
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES public.users(id);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS chat_logs_assigned_to_idx ON public.chat_logs(assigned_to);

-- Update RLS policies
ALTER TABLE public.chat_logs ENABLE ROW LEVEL SECURITY;

-- Allow users to view chats assigned to them
CREATE POLICY "Users can view assigned chats"
    ON public.chat_logs
    FOR SELECT
    USING (
        auth.role() = 'service_role' OR
        assigned_to = auth.uid() OR
        assigned_to IS NULL
    );

-- Allow users to update chats assigned to them
CREATE POLICY "Users can update assigned chats"
    ON public.chat_logs
    FOR UPDATE
    USING (
        auth.role() = 'service_role' OR
        assigned_to = auth.uid()
    );

-- Grant permissions
GRANT SELECT, UPDATE ON public.chat_logs TO authenticated; 