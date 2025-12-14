-- COMPREHENSIVE FIX for "Database error querying schema" (500 Error)
-- This script fixes permissions for the Auth service and API roles.

BEGIN;

-- 1. Grant usage on schemas to the authenticator role (the API gateway)
GRANT USAGE ON SCHEMA public, auth TO postgres, anon, authenticated, service_role;

-- 2. Grant table permissions in AUTH schema (Critical for logging in)
GRANT SELECT ON ALL TABLES IN SCHEMA auth TO postgres, service_role;
GRANT SELECT ON TABLE auth.users TO anon, authenticated;
GRANT SELECT ON TABLE auth.schema_migrations TO postgres, service_role;

-- 3. Grant table permissions in PUBLIC schema
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;

-- 4. Fix Sequence permissions (for ID generation)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA auth TO postgres, service_role;

-- 5. Fix Function permissions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA auth TO postgres, anon, authenticated, service_role;

-- 6. Ensure the 'authenticator' role (which PostgREST uses) has correct search path
ALTER ROLE authenticator SET search_path = public, auth, extensions;
ALTER ROLE anon SET search_path = public, auth, extensions;
ALTER ROLE authenticated SET search_path = public, auth, extensions;

-- 7. Grant PostgREST web user permissions
GRANT anon TO authenticator;
GRANT authenticated TO authenticator;
GRANT service_role TO authenticator;

-- 8. Important: If triggers were failing, it causes 500 error.
-- We check if extensions are enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

COMMIT;

-- Force schema cache reload
NOTIFY pgrst, 'reload config';
