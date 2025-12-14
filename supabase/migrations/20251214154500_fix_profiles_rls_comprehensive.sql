/*
  # Comprehensive Fix for Login/RLS Recursion
  
  This migration performs a complete reset of the RLS policies on the `profiles` table to eliminate any "infinite recursion" bugs causing login failures.
  
  Steps:
  1. Defines a recursion-proof `get_my_role()` function.
  2. DROPS ALL existing policies on the `profiles` table (cleaning up any old/conflicting ones).
  3. Re-creates a clean, simplified set of policies for all roles.
*/

BEGIN;

-- 1. Secure Role Check Function
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;


-- 2. Drop ALL existing policies on profiles to ensure a clean slate
-- We use a DO block to dynamically drop all policies for the table
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', pol.policyname);
  END LOOP;
END $$;


-- 3. Create Clean Policies

-- A. Self Access (Always allowed, Base Case)
CREATE POLICY "Users can manage own profile" ON profiles
  FOR ALL
  USING (auth.uid() = id);

-- B. Admin Level Access (Super Admin & Admin) - Full Control
CREATE POLICY "Admins full access to profiles" ON profiles
  FOR ALL
  USING (get_my_role() IN ('super_admin', 'admin'));

-- C. Readers (Director, Receptionist) - View All (Active & Inactive)
CREATE POLICY "Privileged readers view all profiles" ON profiles
  FOR SELECT
  USING (get_my_role() IN ('director', 'receptionist'));

-- D. Standard Users (Sales Exec, Team Leader, etc) - View Active Only (Directory)
CREATE POLICY "Standard users view active profiles" ON profiles
  FOR SELECT
  USING (is_active = true);


COMMIT;
