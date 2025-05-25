-- Drop the existing foreign key constraint
ALTER TABLE public.usage_logs DROP CONSTRAINT IF EXISTS usage_logs_user_id_fkey;

-- Modify the user_id column to reference public.users instead of auth.users
ALTER TABLE public.usage_logs
ADD CONSTRAINT usage_logs_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.users(id); 