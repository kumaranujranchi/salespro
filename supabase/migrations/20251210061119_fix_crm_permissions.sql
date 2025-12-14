/*
  # Fix CRM Permissions for Customer Management

  1. Changes:
     - Updates INSERT policy on customers table to include 'crm' and 'crm_staff' roles
     - Updates UPDATE policy on customers table to include 'crm' and 'crm_staff' roles
  
  2. Authorized Roles:
     - super_admin, admin, team_leader, sales_executive, crm, crm_staff, sales_head
  
  3. Purpose:
     - Ensures CRM staff can add and update customer records
     - Fixes permission issues preventing CRM users from managing customers
  
  4. Security:
     - Maintains RLS protection
     - Only authenticated users with authorized roles can modify customer data
     - Both USING and WITH CHECK clauses ensure proper authorization
*/

-- Fix permissions for CRM staff to manage customers

-- Drop existing policies to recreate them correctly
-- (Using the names from previous migrations)
DROP POLICY IF EXISTS "Sales executives and above can insert customers" ON customers;
DROP POLICY IF EXISTS "Sales executives and above can update customers" ON customers;

-- Recreate INSERT policy including 'crm' and 'crm_staff' to ensure compatibility
CREATE POLICY "Authorized users can insert customers"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin', 'team_leader', 'sales_executive', 'crm', 'crm_staff', 'sales_head')
    )
  );

-- Recreate UPDATE policy including 'crm' and 'crm_staff'
CREATE POLICY "Authorized users can update customers"
  ON customers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin', 'team_leader', 'sales_executive', 'crm', 'crm_staff', 'sales_head')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin', 'team_leader', 'sales_executive', 'crm', 'crm_staff', 'sales_head')
    )
  );
