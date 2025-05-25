-- Drop existing RLS policies
drop policy if exists "Allow read access to authenticated users" on public.faqs;
drop policy if exists "Allow insert/update access to service_role" on public.faqs;

-- Disable RLS on the table
alter table public.faqs disable row level security; 