-- Create enum type for FAQ status
CREATE TYPE public.faq_status AS ENUM ('new', 'ignored', 'approved');

-- Add internal_notes and status columns to faqs table
ALTER TABLE public.faqs
ADD COLUMN internal_notes text,
ADD COLUMN status public.faq_status NOT NULL DEFAULT 'new';

-- Backfill existing rows with empty internal notes
UPDATE public.faqs
SET internal_notes = ''
WHERE internal_notes IS NULL;

-- Make internal_notes not nullable after backfill
ALTER TABLE public.faqs
ALTER COLUMN internal_notes SET NOT NULL;

-- Add column comments
COMMENT ON COLUMN public.faqs.internal_notes IS 'Internal support notes, employee names, and context not shown to customers';
COMMENT ON COLUMN public.faqs.status IS 'Current status of the FAQ: new (newly created), ignored (not useful), approved (verified and useful)';

-- Create index for status field
CREATE INDEX IF NOT EXISTS faqs_status_idx ON public.faqs(status);

-- Create function to check if a user is an admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.users
        WHERE id = user_id
        AND (metadata->>'is_admin')::boolean = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add status to existing RLS policies
DROP POLICY IF EXISTS "Allow read access to authenticated users" ON public.faqs;
CREATE POLICY "Allow read access to authenticated users"
    ON public.faqs
    FOR SELECT
    TO authenticated
    USING (status = 'approved' OR public.is_admin(auth.uid()));

-- Create policy for admin write access
CREATE POLICY "Allow write access to admins"
    ON public.faqs
    FOR ALL
    TO authenticated
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid())); 