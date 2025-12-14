-- ULTIMATE PERMISSION FIX for Self-Hosted Supabase (Coolify)
-- This fixes the "Database error querying schema" (500) by granting rights to the internal auth admin role.

BEGIN;

-- 1. Grant access to the specific role used by GoTrue (Auth Service)
-- In many self-hosted setups, this role is 'supabase_auth_admin' or just 'postgres'
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'supabase_auth_admin') THEN
    GRANT USAGE ON SCHEMA public, auth TO supabase_auth_admin;
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public, auth TO supabase_auth_admin;
    GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public, auth TO supabase_auth_admin;
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public, auth TO supabase_auth_admin;
    ALTER ROLE supabase_auth_admin SET search_path = public, auth, extensions;
  END IF;
END
$$;

-- 2. Grant access to 'postgres' and 'service_role' (Fallbacks)
GRANT USAGE ON SCHEMA public, auth TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public, auth TO postgres, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public, auth TO postgres, service_role;

-- 3. Ensure 'anon' (The browser) can actually see the API schema
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon;

-- 4. Fix search paths for everyone
ALTER ROLE postgres SET search_path = public, auth, extensions;
ALTER ROLE service_role SET search_path = public, auth, extensions;
ALTER ROLE anon SET search_path = public, auth, extensions;

-- 5. Re-run User Creation (Safe Mode) just in case the user state is corrupted
-- This ensures the admin user definitely exists and has a valid password
DELETE FROM auth.users WHERE email = 'admin@salespro.com';
DELETE FROM public.profiles WHERE email = 'admin@salespro.com';

INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@salespro.com',
    crypt('Anuj@2025', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"System Admin","role":"super_admin"}',
    now(),
    now(),
    '',
    ''
);

-- Note: The trigger on auth.users will automatically create the public.profile entry now
-- because we fixed the table schema in previous steps.

COMMIT;

-- Force config reload
NOTIFY pgrst, 'reload config';
