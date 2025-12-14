/*
  # Add Receptionist Role and Permissions
  
  1. Changes
    - Update `profiles` table `role` check constraint to include 'receptionist'.
    - Create RLS policies for receptionist role:
      - Read-only access to profiles (all)
      - Read-only access to announcements (published)
      - Read-only access to sales (all, for dashboard stats)
      - Read-only access to departments, projects, targets (for context)
      - Read-only access to site_visits, incentives, payments (for context/dashboard)
*/

-- 1. Update Check Constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('super_admin', 'admin', 'director', 'team_leader', 'sales_executive', 'crm_staff', 'accountant', 'driver', 'receptionist'));

-- 2. Define Secure Helper Function (Reuse existing or ensure it exists)
-- (Assuming get_my_role() exists from previous migration, but safe to redefine/replace)

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- 3. RLS Policies for Receptionist

-- Profiles: Can view all active profiles (for Directory)
DROP POLICY IF EXISTS "Receptionist view profiles" ON profiles;
CREATE POLICY "Receptionist view profiles" ON profiles
  FOR SELECT TO authenticated
  USING (get_my_role() = 'receptionist' AND is_active = true);

-- Announcements: Can view published (already covered by "All authenticated users can view published announcements")
-- But if they need to see *all* announcements (even internal/important), the default policy might be enough.
-- Let's ensure they have explicit access if needed, or rely on existing public policies.
-- Existing: "All authenticated users can view published announcements" -> is_published = true. Good.

-- Departments: Can view all (Existing: "All authenticated users can view departments"). Good.

-- Projects: Can view active (Existing: "All authenticated users can view active projects"). Good.

-- Sales: Receptionist needs to see ALL sales for the "Global" dashboard stats (Total Sales, Revenue)
-- Previously, restricted to Admin/CRM/Owners.
DROP POLICY IF EXISTS "Receptionist view sales" ON sales;
CREATE POLICY "Receptionist view sales" ON sales
  FOR SELECT TO authenticated
  USING (get_my_role() = 'receptionist');

-- Incentives: View all (for Leaderboard - technically leaderboard calculates from Sales, but if incentives table is needed)
-- SalesOverview uses incentives table for totalIncentives.
DROP POLICY IF EXISTS "Receptionist view incentives" ON incentives;
CREATE POLICY "Receptionist view incentives" ON incentives
  FOR SELECT TO authenticated
  USING (get_my_role() = 'receptionist');

-- Targets: View all (for Leaderboard context or potential future use)
DROP POLICY IF EXISTS "Receptionist view targets" ON targets;
CREATE POLICY "Receptionist view targets" ON targets
  FOR SELECT TO authenticated
  USING (get_my_role() = 'receptionist');

-- Site Visits: View all (Why not?)
DROP POLICY IF EXISTS "Receptionist view site_visits" ON site_visits;
CREATE POLICY "Receptionist view site_visits" ON site_visits
  FOR SELECT TO authenticated
  USING (get_my_role() = 'receptionist');

-- Payments: View all (for Revenue visuals potentially)
DROP POLICY IF EXISTS "Receptionist view payments" ON payments;
CREATE POLICY "Receptionist view payments" ON payments
  FOR SELECT TO authenticated
  USING (get_my_role() = 'receptionist');
