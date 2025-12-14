/*
  # Critical Fix for Login/RLS Recursion
  
  This migration fixes the "Infinite Recursion" error often encountered during login when RLS policies refer to the same table.
  It ensures the helper function `get_my_role()` is correctly defined as SECURITY DEFINER to bypass RLS, and cleans up any conflicting policies.
*/

BEGIN;

-- 1. Redefine the function to be absolutely sure it breaks recursion (Security Definer)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;


-- 2. Ensure Users can ALWAYS view their own profile (Base Case for recursion safety)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);


-- 3. Re-apply Directory/Profile Access Policies
-- These policies rely on get_my_role(). If the function works, these work.

-- Director
DROP POLICY IF EXISTS "Director view profiles" ON profiles;
CREATE POLICY "Director view profiles" ON profiles
  FOR SELECT TO authenticated
  USING (get_my_role() = 'director');

-- Receptionist
DROP POLICY IF EXISTS "Receptionist view profiles" ON profiles;
CREATE POLICY "Receptionist view profiles" ON profiles
  FOR SELECT TO authenticated
  USING (get_my_role() = 'receptionist' AND is_active = true);

COMMIT;
