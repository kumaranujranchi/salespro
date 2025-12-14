-- Database Error Querying Schema Fix
-- This error happens when ANON role cannot access the schema or PostgREST settings are strict.

BEGIN;

-- 1. Grant usage on schema public to anon and authenticated
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- 2. Grant access to all existing tables
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- 3. Ensure sequences are accessible (for auto-increment IDs if any)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- 4. Future tables permission
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO anon, authenticated;

-- 5. Fix for Auth Schema access (sometimes needed for checking users)
GRANT USAGE ON SCHEMA auth TO anon, authenticated;
GRANT SELECT ON TABLE auth.users TO anon, authenticated; -- Use with CAUTION, usually not needed if RLS is on, but testing here.

-- 6. Critical: Make sure profiles is accessible as it's fetched immediately after login
GRANT SELECT ON public.profiles TO anon, authenticated;

COMMIT;
