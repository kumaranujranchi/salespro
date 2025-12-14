/*
  # Fix get_my_role() Function Recursion Issue

  1. Changes Made
    - Redefine `get_my_role()` function with SECURITY DEFINER to break recursion
    - Add base case policy: Users can always view their own profile
    - Re-apply director and receptionist role-based policies

  2. Security
    - Base policy ensures users can read their own profile (prevents recursion)
    - Director can view all profiles
    - Receptionist can view only active profiles
*/

-- 1. Redefine the function to be absolutely sure it breaks recursion
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;

-- 2. Ensure Users can ALWAYS view their own profile (Base Case)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- 3. Re-apply Role Policies
DROP POLICY IF EXISTS "Director view profiles" ON profiles;
CREATE POLICY "Director view profiles" ON profiles
  FOR SELECT TO authenticated
  USING (get_my_role() = 'director');

DROP POLICY IF EXISTS "Receptionist view profiles" ON profiles;
CREATE POLICY "Receptionist view profiles" ON profiles
  FOR SELECT TO authenticated
  USING (get_my_role() = 'receptionist' AND is_active = true);
