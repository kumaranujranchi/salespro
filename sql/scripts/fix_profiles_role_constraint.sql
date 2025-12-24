-- Fix profiles table role constraint to allow custom roles
-- This script drops the hardcoded constraint and replaces it with a more flexible one
-- or simply removes it to allow dynamic roles from the tenant_roles table.

ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

-- If you still want some basic validation, you can add a relaxed one or just leave it open
-- since foreign key role_id already ensures valid role mapping where available.
-- For now, we leave it open to support any custom roles created in the UI.
