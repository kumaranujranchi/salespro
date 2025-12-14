/*
  # Secure Announcements RBAC

  1. Security Updates:
     - Revoke loose policies on `announcements`.
     - Implement strict Role-Based Access Control (RBAC).
     - Standard users (Sales Exec, Team Leader, etc.) are RESTRICTED to READ-ONLY.
     - Admins (super_admin, admin) retain full access.

  2. Audit Logging:
     - Attach the existing `process_audit_log` trigger to `announcements`.
*/

-- 1. ANNOUNCEMENTS TABLE SECURITY

-- Drop all existing policies to be safe
DROP POLICY IF EXISTS "Authenticated users can view announcements" ON announcements;
DROP POLICY IF EXISTS "Authenticated users can insert announcements" ON announcements;
DROP POLICY IF EXISTS "Authenticated users can update announcements" ON announcements;
DROP POLICY IF EXISTS "Authenticated users can delete announcements" ON announcements;
DROP POLICY IF EXISTS "Enable read access for all users" ON announcements;
DROP POLICY IF EXISTS "Enable insert for all users" ON announcements;
DROP POLICY IF EXISTS "Enable update for all users" ON announcements;
DROP POLICY IF EXISTS "Enable delete for all users" ON announcements;

-- Policy 1: READ (All authenticated users can view announcements)
CREATE POLICY "View announcements" ON announcements
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy 2: MANAGE (Only Admins)
CREATE POLICY "Manage announcements" ON announcements
  FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
  );

-- Attach Audit Trigger
DROP TRIGGER IF EXISTS announcements_audit_trigger ON announcements;
CREATE TRIGGER announcements_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON announcements
  FOR EACH ROW EXECUTE FUNCTION process_audit_log();
