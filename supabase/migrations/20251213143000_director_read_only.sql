-- Fix for RLS Recursion: Create a secure function to check roles
-- This function runs with the privileges of the creator (Definer), bypassing RLS on the profiles table
-- to prevent infinite recursion when checking roles inside a profiles policy.

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;

-- Grant Read-Only access to Directors for all modules using the secure function

-- 1. Profiles (Users)
DROP POLICY IF EXISTS "Director view profiles" ON profiles;
CREATE POLICY "Director view profiles" ON profiles
  FOR SELECT TO authenticated
  USING (get_my_role() = 'director');

-- 2. Departments
DROP POLICY IF EXISTS "Director view departments" ON departments;
CREATE POLICY "Director view departments" ON departments
  FOR SELECT TO authenticated
  USING (get_my_role() = 'director');

-- 3. Projects
DROP POLICY IF EXISTS "Director view projects" ON projects;
CREATE POLICY "Director view projects" ON projects
  FOR SELECT TO authenticated
  USING (get_my_role() = 'director');

-- 4. Announcements
DROP POLICY IF EXISTS "Director view announcements" ON announcements;
CREATE POLICY "Director view announcements" ON announcements
  FOR SELECT TO authenticated
  USING (get_my_role() = 'director');

-- 5. Sales Targets
DROP POLICY IF EXISTS "Director view sales_targets" ON sales_targets;
CREATE POLICY "Director view sales_targets" ON sales_targets
  FOR SELECT TO authenticated
  USING (get_my_role() = 'director');

-- 6. Site Visits
DROP POLICY IF EXISTS "Director view site_visits" ON site_visits;
CREATE POLICY "Director view site_visits" ON site_visits
  FOR SELECT TO authenticated
  USING (get_my_role() = 'director');

-- 7. Sales
DROP POLICY IF EXISTS "Director view sales" ON sales;
CREATE POLICY "Director view sales" ON sales
  FOR SELECT TO authenticated
  USING (get_my_role() = 'director');

-- 8. Payments
DROP POLICY IF EXISTS "Director view payments" ON payments;
CREATE POLICY "Director view payments" ON payments
  FOR SELECT TO authenticated
  USING (get_my_role() = 'director');

-- 9. Incentives
DROP POLICY IF EXISTS "Director view incentives" ON incentives;
CREATE POLICY "Director view incentives" ON incentives
  FOR SELECT TO authenticated
  USING (get_my_role() = 'director');
