-- Drop the existing foreign key constraint
ALTER TABLE public.research_views DROP CONSTRAINT IF EXISTS research_views_user_id_fkey;

-- Modify the user_id column to reference public.users instead of auth.users
ALTER TABLE public.research_views
ADD CONSTRAINT research_views_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.users(id); 