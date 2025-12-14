/*
  # Secure Sales RBAC and Audit Logging (Final)

  1. Security Updates:
     - Revoke loose policies on `sales` and `payments`.
     - Implement strict Role-Based Access Control (RBAC).
     - Sales Executives (and other standard users) are RESTRICTED to READ-ONLY.
     - Admins/CRM/Sales Head retain full access.

  2. Audit Logging:
     - Create `audit_logs` table to track all changes.
     - Add triggers to `sales` and `payments` to auto-log INSERT/UPDATE/DELETE.
*/

-- 1. Create Audit Log Infrastructure
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  operation text NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
  old_data jsonb,
  new_data jsonb,
  changed_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on Audit Logs (Admins only read)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs" ON audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
  );

-- Create Audit Trigger Function
CREATE OR REPLACE FUNCTION process_audit_log() RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    INSERT INTO audit_logs (table_name, record_id, operation, old_data, changed_by)
    VALUES (TG_TABLE_NAME, OLD.id, TG_OP, row_to_json(OLD), auth.uid());
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO audit_logs (table_name, record_id, operation, old_data, new_data, changed_by)
    VALUES (TG_TABLE_NAME, NEW.id, TG_OP, row_to_json(OLD), row_to_json(NEW), auth.uid());
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO audit_logs (table_name, record_id, operation, new_data, changed_by)
    VALUES (TG_TABLE_NAME, NEW.id, TG_OP, row_to_json(NEW), auth.uid());
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. SALES TABLE SECURITY

-- Drop all existing policies to be safe
DROP POLICY IF EXISTS "Authenticated users can view sales" ON sales;
DROP POLICY IF EXISTS "Authenticated users can insert sales" ON sales;
DROP POLICY IF EXISTS "Authenticated users can update sales" ON sales;
DROP POLICY IF EXISTS "Authenticated users can delete sales" ON sales;
-- Drop any loose policies from previous migrations
DROP POLICY IF EXISTS "Enable read access for all users" ON sales;
DROP POLICY IF EXISTS "Enable insert for all users" ON sales;
DROP POLICY IF EXISTS "Enable update for all users" ON sales;
DROP POLICY IF EXISTS "Enable delete for all users" ON sales;

-- Policy 1: READ (All authenticated users can view sales - needed for dashboard/reports)
CREATE POLICY "View sales" ON sales
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy 2: MANAGE (Only Admins, CRM, etc.)
CREATE POLICY "Manage sales" ON sales
  FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'crm', 'sales_head', 'team_leader'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'crm', 'sales_head', 'team_leader'))
  );

-- Attach Audit Trigger to Sales
DROP TRIGGER IF EXISTS sales_audit_trigger ON sales;
CREATE TRIGGER sales_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON sales
  FOR EACH ROW EXECUTE FUNCTION process_audit_log();


-- 3. PAYMENTS TABLE SECURITY

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can view payments" ON payments;
DROP POLICY IF EXISTS "Authenticated users can insert payments" ON payments;
DROP POLICY IF EXISTS "Authenticated users can update payments" ON payments;
DROP POLICY IF EXISTS "Authenticated users can delete payments" ON payments;

-- Policy 1: READ
CREATE POLICY "View payments" ON payments
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy 2: MANAGE (Only Admins, CRM, etc. AND potentially Accountants if that role exists)
-- Assuming 'accountant' role might exist or be added, otherwise sticking to admin set.
CREATE POLICY "Manage payments" ON payments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'crm', 'sales_head', 'accountant'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'crm', 'sales_head', 'accountant'))
  );

-- Attach Audit Trigger to Payments
DROP TRIGGER IF EXISTS payments_audit_trigger ON payments;
CREATE TRIGGER payments_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON payments
  FOR EACH ROW EXECUTE FUNCTION process_audit_log();
