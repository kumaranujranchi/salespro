/*
  # Fix CRM Permissions for Sales and Payments Management

  1. Changes:
     - Updates sales table policies to include 'crm' and 'crm_staff' roles
     - Updates payments table policies to include 'crm' and 'crm_staff' roles
  
  2. Sales Table Authorized Roles:
     - super_admin, admin, crm, crm_staff, sales_head, team_leader
  
  3. Payments Table Authorized Roles:
     - super_admin, admin, crm, crm_staff, sales_head, accountant
  
  4. Purpose:
     - Ensures CRM staff can manage sales records
     - Ensures CRM staff can manage payment records
     - Fixes permission issues preventing CRM users from managing sales and payments
  
  5. Security:
     - Maintains RLS protection
     - Only authenticated users with authorized roles can modify data
     - Both USING and WITH CHECK clauses ensure proper authorization
*/

-- Fix permissions for CRM staff to manage sales and payments

-- 1. Fix Sales Permissions
DROP POLICY IF EXISTS "Manage sales" ON sales;

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

-- 2. Fix Payments Permissions
DROP POLICY IF EXISTS "Manage payments" ON payments;

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
