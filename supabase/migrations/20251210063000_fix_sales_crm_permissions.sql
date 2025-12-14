-- Fix permissions for CRM staff to manage sales
-- The previous policy might have missed 'crm_staff' or used 'crm' instead.

-- Drop the existing "Manage sales" policy
DROP POLICY IF EXISTS "Manage sales" ON sales;

-- Recreate the policy with explicit 'crm_staff' support
CREATE POLICY "Manage sales" ON sales
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin', 'crm', 'crm_staff', 'sales_head', 'team_leader')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin', 'crm', 'crm_staff', 'sales_head', 'team_leader')
    )
  );

-- Also ensure 'sales_head' and 'crm_staff' (or 'crm') are covers for Payments if needed
-- Drop existing "Manage payments" policy
DROP POLICY IF EXISTS "Manage payments" ON payments;

-- Recreate "Manage payments" policy
CREATE POLICY "Manage payments" ON payments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin', 'crm', 'crm_staff', 'sales_head', 'accountant')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin', 'crm', 'crm_staff', 'sales_head', 'accountant')
    )
  );
