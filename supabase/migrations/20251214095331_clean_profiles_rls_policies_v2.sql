/*
  # Clean and Restructure Profiles RLS Policies

  1. Changes Made
    - Redefine `get_my_role()` function with proper security settings
    - Drop all existing policies on profiles table to start fresh
    - Create new hierarchical policy structure

  2. New Policy Structure
    - **Self Access**: Users can manage their own profile (always allowed)
    - **Admin Access**: Super admin and admin have full access to all profiles
    - **Privileged Readers**: Director and receptionist can view all profiles
    - **Standard Users**: Can view only active profiles (for directory)

  3. Security
    - Base policy ensures users can manage their own profile
    - Role-based policies provide appropriate access levels
    - Standard users restricted to viewing active profiles only
*/

-- 1. Secure Role Check Function (Recursive-safe)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;

-- 2. Drop ALL existing policies on profiles
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', pol.policyname);
  END LOOP;
END $$;

-- 3. Create Clean Policies

-- A. Self Access (Always allowed)
CREATE POLICY "Users can manage own profile" ON profiles
  FOR ALL
  USING (auth.uid() = id);

-- B. Admin Level Access (Super Admin & Admin)
CREATE POLICY "Admins full access to profiles" ON profiles
  FOR ALL
  USING (get_my_role() IN ('super_admin', 'admin'));

-- C. Readers (Director, Receptionist) - View All
CREATE POLICY "Privileged readers view all profiles" ON profiles
  FOR SELECT
  USING (get_my_role() IN ('director', 'receptionist'));

-- D. Standard Users - View Active Only (Directory)
CREATE POLICY "Standard users view active profiles" ON profiles
  FOR SELECT
  USING (is_active = true);
