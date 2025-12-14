/*
  # Add Receptionist Role

  1. Changes
    - Add 'receptionist' to the profiles role constraint
    - Create RLS policies to grant read-only access to receptionist role
  
  2. Receptionist Permissions (Read-Only)
    - View profiles and user directory
    - View announcements
    - View sales data
    - View site visits
    - View targets
    - View projects
    - View departments
    - Update own notifications (mark as read)
    - NO write, update, or delete permissions on core tables
  
  3. Security
    - All policies enforce read-only access for receptionist
    - No elevation of privilege possible
    - Server-side validation enforced through RLS
*/

-- Add receptionist role to profiles constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('super_admin', 'admin', 'team_leader', 'sales_executive', 'crm_staff', 'accountant', 'driver', 'director', 'receptionist'));

-- Drop existing receptionist policies if they exist
DROP POLICY IF EXISTS "Receptionist can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Receptionist can view all announcements" ON announcements;
DROP POLICY IF EXISTS "Receptionist can view all sales" ON sales;
DROP POLICY IF EXISTS "Receptionist can view all payments" ON payments;
DROP POLICY IF EXISTS "Receptionist can view all site visits" ON site_visits;
DROP POLICY IF EXISTS "Receptionist can view all targets" ON sales_targets;
DROP POLICY IF EXISTS "Receptionist can view all projects" ON projects;
DROP POLICY IF EXISTS "Receptionist can view all departments" ON departments;
DROP POLICY IF EXISTS "Receptionist can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Receptionist can update own notifications" ON notifications;

-- Grant read-only access to profiles for receptionist
CREATE POLICY "Receptionist can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'receptionist'
    )
  );

-- Grant read-only access to announcements for receptionist
CREATE POLICY "Receptionist can view all announcements"
  ON announcements FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'receptionist'
    )
  );

-- Grant read-only access to sales for receptionist
CREATE POLICY "Receptionist can view all sales"
  ON sales FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'receptionist'
    )
  );

-- Grant read-only access to payments for receptionist
CREATE POLICY "Receptionist can view all payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'receptionist'
    )
  );

-- Grant read-only access to site_visits for receptionist
CREATE POLICY "Receptionist can view all site visits"
  ON site_visits FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'receptionist'
    )
  );

-- Grant read-only access to sales_targets for receptionist
CREATE POLICY "Receptionist can view all targets"
  ON sales_targets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'receptionist'
    )
  );

-- Grant read-only access to projects for receptionist
CREATE POLICY "Receptionist can view all projects"
  ON projects FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'receptionist'
    )
  );

-- Grant read-only access to departments for receptionist
CREATE POLICY "Receptionist can view all departments"
  ON departments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'receptionist'
    )
  );

-- Grant read-only access to notifications for receptionist
CREATE POLICY "Receptionist can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'receptionist'
    )
  );

-- Allow receptionist to mark their own notifications as read
CREATE POLICY "Receptionist can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'receptionist'
    )
  )
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'receptionist'
    )
  );