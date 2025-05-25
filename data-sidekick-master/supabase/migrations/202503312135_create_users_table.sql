-- Create users table for Auth0 integration
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    auth0_id TEXT UNIQUE,
    picture TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    last_login TIMESTAMP WITH TIME ZONE DEFAULT now(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Add RLS policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own data
CREATE POLICY "Users can read their own data" 
    ON public.users 
    FOR SELECT 
    USING (auth.uid() = id);

-- Create policy to allow users to update their own data
CREATE POLICY "Users can update their own data" 
    ON public.users 
    FOR UPDATE 
    USING (auth.uid() = id);

-- Create policy to allow anyone to insert data (needed for Auth0 user creation)
CREATE POLICY "Anyone can insert users" 
    ON public.users 
    FOR INSERT 
    WITH CHECK (true);

-- Create policy to allow service role to manage all users
CREATE POLICY "Service role can manage all users" 
    ON public.users 
    USING (auth.role() = 'service_role');

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.users TO anon, authenticated, service_role; 