-- Grant Read-Only access to Directors for all modules

-- 1. Profiles (Users)
-- Note: Assuming standard profiles RLS might already allow reading, but this ensures Directors definitely can.
DROP POLICY IF EXISTS "Director view profiles" ON profiles;
CREATE POLICY "Director view profiles" ON profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'director')
  );

-- 2. Departments
DROP POLICY IF EXISTS "Director view departments" ON departments;
CREATE POLICY "Director view departments" ON departments
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'director')
  );

-- 3. Projects
DROP POLICY IF EXISTS "Director view projects" ON projects;
CREATE POLICY "Director view projects" ON projects
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'director')
  );

-- 4. Announcements
DROP POLICY IF EXISTS "Director view announcements" ON announcements;
CREATE POLICY "Director view announcements" ON announcements
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'director')
  );

-- 5. Sales Targets
DROP POLICY IF EXISTS "Director view sales_targets" ON sales_targets;
CREATE POLICY "Director view sales_targets" ON sales_targets
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'director')
  );

-- 6. Site Visits
DROP POLICY IF EXISTS "Director view site_visits" ON site_visits;
CREATE POLICY "Director view site_visits" ON site_visits
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'director')
  );

-- 7. Sales
DROP POLICY IF EXISTS "Director view sales" ON sales;
CREATE POLICY "Director view sales" ON sales
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'director')
  );

-- 8. Payments
DROP POLICY IF EXISTS "Director view payments" ON payments;
CREATE POLICY "Director view payments" ON payments
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'director')
  );

-- 9. Incentives
DROP POLICY IF EXISTS "Director view incentives" ON incentives;
CREATE POLICY "Director view incentives" ON incentives
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'director')
  );