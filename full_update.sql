/*
  # Enhance Site Visits and Add Notifications

  1. New Tables
    - `notifications`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `title` (text)
      - `message` (text)
      - `type` (text: 'info', 'success', 'warning', 'error')
      - `related_entity_type` (text, optional - e.g., 'site_visit')
      - `related_entity_id` (uuid, optional)
      - `is_read` (boolean)
      - `created_at` (timestamptz)

  2. Alter Tables
    - `site_visits` modification:
      - Add `driver_id` (uuid, references profiles)
      - Add `start_odometer` (decimal)
      - Add `end_odometer` (decimal)
      - Add `rejection_reason` (text)
      - Add `clarification_note` (text)
      - Update `status` check constraint to include new statuses

  3. Security
    - Enable RLS on `notifications`
    - Add policies for notifications
*/

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text CHECK (type IN ('info', 'success', 'warning', 'error')) DEFAULT 'info',
  related_entity_type text,
  related_entity_id uuid,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- We might need a policy for inserting system notifications (usually done by triggers or admin functions)
-- allowing all authenticated for now to simplify client-side creation if needed, 
-- but ideally should be protected.
CREATE POLICY "System/Users can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true); 


-- Update site_visits table
-- 1. Drop existing constraint
ALTER TABLE site_visits DROP CONSTRAINT IF EXISTS site_visits_status_check;

-- 2. Add new columns
ALTER TABLE site_visits 
ADD COLUMN IF NOT EXISTS driver_id uuid REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS start_odometer decimal(10, 2),
ADD COLUMN IF NOT EXISTS end_odometer decimal(10, 2),
ADD COLUMN IF NOT EXISTS rejection_reason text,
ADD COLUMN IF NOT EXISTS clarification_note text;

-- 3. Add new check constraint
ALTER TABLE site_visits 
ADD CONSTRAINT site_visits_status_check 
CHECK (status IN ('pending', 'approved', 'declined', 'pending_clarification', 'trip_started', 'completed', 'cancelled'));

-- Update RLS for driver
-- Drivers need to see visits assigned to them
CREATE POLICY "Drivers can view assigned visits"
  ON site_visits FOR SELECT
  TO authenticated
  USING (
    driver_id = auth.uid()
    OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'driver'
    )
  );

CREATE POLICY "Drivers can update assigned visits"
  ON site_visits FOR UPDATE
  TO authenticated
  USING (driver_id = auth.uid());
/*
  # Update Payment Constraints

  ## Changes Made
  
  ### Payments Table Constraint Updates
  
  #### Payment Type Constraint
  - Updated allowed values to: 'emi', 'advance', 'booking', 'token', 'loan_disbursement', 'other'
  - Removed: 'installment', 'full_payment'
  - Added: 'emi', 'advance'
  
  #### Payment Mode Constraint
  - Updated allowed values to: 'cash', 'cheque', 'account_transfer', 'upi', 'dd', 'other'
  - Changed: 'bank_transfer' to 'account_transfer'
*/

ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_type_check;
ALTER TABLE payments ADD CONSTRAINT payments_payment_type_check 
  CHECK (payment_type IN ('emi', 'advance', 'booking', 'token', 'loan_disbursement', 'other'));

ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_mode_check;
ALTER TABLE payments ADD CONSTRAINT payments_payment_mode_check 
  CHECK (payment_mode IN ('cash', 'cheque', 'account_transfer', 'upi', 'dd', 'other'));
/*
  # Create Sales Targets Management Table
  
  1. New Table `sales_targets`:
    - `id` (uuid, primary key)
    - `user_id` (uuid, references profiles, unique with period details)
    - `period_type` (text, e.g., 'monthly', 'quarterly', 'yearly')
    - `start_date` (date, first day of the period)
    - `end_date` (date, last day of the period)
    - `target_amount` (numeric, default 0)
    - `target_units` (integer, default 0)
    - `created_by` (uuid, references profiles)
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  2. Security:
    - Enable RLS
    - Policy: authenticated users can read.
    - Policy: admins/super_admins can insert/update/delete.
    - Policy: standard users can view their own targets.
*/

CREATE TABLE IF NOT EXISTS sales_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  period_type text CHECK (period_type IN ('monthly', 'quarterly', 'yearly')),
  start_date date NOT NULL,
  end_date date NOT NULL,
  target_amount decimal(15, 2) DEFAULT 0,
  target_units integer DEFAULT 0,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Ensure one target per user per period (defined by type and start date)
  UNIQUE(user_id, period_type, start_date)
);

-- Enable RLS
ALTER TABLE sales_targets ENABLE ROW LEVEL SECURITY;

-- Policies

-- 1. Read: Admins see all, Users see their own
DROP POLICY IF EXISTS "View targets" ON sales_targets;
CREATE POLICY "View targets" ON sales_targets
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'sales_head'))
  );

-- 2. Insert/Update/Delete: Only Admins/Managers
DROP POLICY IF EXISTS "Manage targets" ON sales_targets;
CREATE POLICY "Manage targets" ON sales_targets
  FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'sales_head', 'team_leader'))
  );
/*
  # Refactor Sales Targets for Sq Ft & Monthly Only
  
  1. Changes:
    - Add `target_sqft` (decimal) column.
    - Remove yearly/quarterly from allowed period_types (check constraint).
    - Make `period_type` default to 'monthly'.
*/

ALTER TABLE sales_targets 
  ADD COLUMN IF NOT EXISTS target_sqft decimal(10, 2) DEFAULT 0;

-- Update existing check constraint for period_type if possible, or just add a new one
ALTER TABLE sales_targets DROP CONSTRAINT IF EXISTS sales_targets_period_type_check;
ALTER TABLE sales_targets ADD CONSTRAINT sales_targets_period_type_check 
  CHECK (period_type IN ('monthly'));

-- We will largely ignore target_amount and target_units moving forward, 
-- or we could drop them. For safety, we keep them but nullable/unused.
-- Update RLS policies for profiles to allow admins to view inactive users

DROP POLICY IF EXISTS "Users can view all active profiles" ON profiles;

CREATE POLICY "Users can view profiles based on role and status"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    is_active = true
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'admin')
    )
  );

-- Ensure update policy allows updating inactive users (already covered by existing policy but checking correctness)
-- Existing: "Super admins and admins can update profiles" ... USING (EXISTS(... admin ...))
-- This seems fine as it doesn't restrict by target row's is_active status, only the user's role.

-- Add index on is_active for performance
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);
-- Add force_password_change column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS force_password_change boolean DEFAULT false;

-- Update RLS if needed, though existing policies usually cover all columns unless specified otherwise.
-- Just to be safe, ensuring authenticated users can view this field on their own profile
-- and admins can view/edit it on others.

-- Existing select policy "Users can view all active profiles" covers select *
-- or the new "Users can view profiles based on role and status" covers it.

-- Ensure admins can update this field (e.g. set it to true for password reset)
-- Existing update policy "Super admins and admins can update profiles" covers update.

-- Ensure users can update THEIR OWN profile to set it to false after change.
-- We might need a policy for users to update their own profile?
-- Currently: "Super admins and admins can update profiles"
-- We need: "Users can update their own profile" (specifically force_password_change, image_url, etc)

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
-- Function to handle new user creation automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    employee_id,
    role,
    department_id,
    reporting_manager_id,
    image_url,
    phone,
    is_active,
    force_password_change
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    -- We assume employee_id is passed in metadata. If not, we generate a temporary one to avoid constraint error, 
    -- but ideally this should be provided.
    COALESCE(new.raw_user_meta_data->>'employee_id', 'TEMP_' || floor(extract(epoch from now()))::text),
    COALESCE(new.raw_user_meta_data->>'role', 'sales_executive'),
    CASE 
      WHEN new.raw_user_meta_data->>'department_id' = '' THEN NULL 
      ELSE (new.raw_user_meta_data->>'department_id')::uuid 
    END,
    CASE 
      WHEN new.raw_user_meta_data->>'reporting_manager_id' = '' THEN NULL 
      ELSE (new.raw_user_meta_data->>'reporting_manager_id')::uuid 
    END,
    new.raw_user_meta_data->>'imageUrl', -- Note: frontend keys
    new.raw_user_meta_data->>'phone',
    true,
    true
  );
  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    -- If profile creation fails, we should ideally fail the auth creation too, 
    -- but triggers on AFTER INSERT might not rollback the transaction in all auth setups easily.
    -- However, raising exception here DOES abort the transaction for the user creation in Supabase Auth usually.
    RAISE EXCEPTION 'Failed to create user profile: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if trigger exists before creating to avoid errors in idempotent runs
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
/*
  # Enhance Site Visits and Add Notifications

  1. New Tables
    - `notifications`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `title` (text)
      - `message` (text)
      - `type` (text: 'info', 'success', 'warning', 'error')
      - `related_entity_type` (text, optional - e.g., 'site_visit')
      - `related_entity_id` (uuid, optional)
      - `is_read` (boolean)
      - `created_at` (timestamptz)

  2. Alter Tables
    - `site_visits` modification:
      - Add `driver_id` (uuid, references profiles)
      - Add `start_odometer` (decimal)
      - Add `end_odometer` (decimal)
      - Add `rejection_reason` (text)
      - Add `clarification_note` (text)
      - Update `status` check constraint to include new statuses

  3. Security
    - Enable RLS on `notifications`
    - Add policies for notifications
*/

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text CHECK (type IN ('info', 'success', 'warning', 'error')) DEFAULT 'info',
  related_entity_type text,
  related_entity_id uuid,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- We might need a policy for inserting system notifications (usually done by triggers or admin functions)
-- allowing all authenticated for now to simplify client-side creation if needed, 
-- but ideally should be protected.
CREATE POLICY "System/Users can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true); 


-- Update site_visits table
-- 1. Drop existing constraint
ALTER TABLE site_visits DROP CONSTRAINT IF EXISTS site_visits_status_check;

-- 2. Add new columns
ALTER TABLE site_visits 
ADD COLUMN IF NOT EXISTS driver_id uuid REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS start_odometer decimal(10, 2),
ADD COLUMN IF NOT EXISTS end_odometer decimal(10, 2),
ADD COLUMN IF NOT EXISTS rejection_reason text,
ADD COLUMN IF NOT EXISTS clarification_note text;

-- 3. Add new check constraint
ALTER TABLE site_visits 
ADD CONSTRAINT site_visits_status_check 
CHECK (status IN ('pending', 'approved', 'declined', 'pending_clarification', 'trip_started', 'completed', 'cancelled'));

-- Update RLS for driver
-- Drivers need to see visits assigned to them
CREATE POLICY "Drivers can view assigned visits"
  ON site_visits FOR SELECT
  TO authenticated
  USING (
    driver_id = auth.uid()
    OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'driver'
    )
  );

CREATE POLICY "Drivers can update assigned visits"
  ON site_visits FOR UPDATE
  TO authenticated
  USING (driver_id = auth.uid());
/*
  # Add Driver Role
  
  1. Changes
    - Update `profiles` table `role` check constraint to include 'driver'.
*/

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('super_admin', 'admin', 'team_leader', 'sales_executive', 'crm_staff', 'accountant', 'driver'));
/*
  # Enhance Sales Table with Detailed Pricing and Legal Fields

  1. New Columns for `sales` table:
    - `plot_no` -> We use existing `unit_number` column.
    - `plc` (decimal) - Preferred Location Charge
    - `dev_charges` (decimal) - Development Charges
    - `is_agreement_done` (boolean)
    - `agreement_date` (date)
    - `is_registry_done` (boolean)
    - `registry_date` (date)

  2. Payments Table:
    - Ensure existence and policies.
*/

ALTER TABLE sales
ADD COLUMN IF NOT EXISTS plc decimal(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS dev_charges decimal(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_agreement_done boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS agreement_date date,
ADD COLUMN IF NOT EXISTS is_registry_done boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS registry_date date;

-- Ensure payment table exists
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid REFERENCES sales(id) ON DELETE CASCADE,
  payment_date date NOT NULL,
  amount decimal(12, 2) NOT NULL,
  payment_type text CHECK (payment_type IN ('booking', 'installment', 'full_payment', 'token', 'loan_disbursement', 'other')),
  payment_mode text CHECK (payment_mode IN ('cash', 'cheque', 'bank_transfer', 'upi', 'dd', 'other')),
  transaction_reference text,
  remarks text,
  recorded_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on payments if not already
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Policies for payments
DROP POLICY IF EXISTS "Authenticated users can view payments" ON payments;
CREATE POLICY "Authenticated users can view payments"
  ON payments FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert payments" ON payments;
CREATE POLICY "Authenticated users can insert payments"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update payments" ON payments;
CREATE POLICY "Authenticated users can update payments"
  ON payments FOR UPDATE
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can delete payments" ON payments;
CREATE POLICY "Authenticated users can delete payments"
  ON payments FOR DELETE
  TO authenticated
  USING (true);
/*
  # Update Payment Constraints
  
  Update allowed values for payment_type and payment_mode to match the specific user requirements.
  
  New Payment Types: 'emi', 'advance', 'booking', 'token', 'loan_disbursement'
  New Payment Modes: 'cash', 'cheque', 'account_transfer', 'upi', 'dd'
*/

ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_type_check;
ALTER TABLE payments ADD CONSTRAINT payments_payment_type_check 
  CHECK (payment_type IN ('emi', 'advance', 'booking', 'token', 'loan_disbursement', 'other'));

ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_mode_check;
ALTER TABLE payments ADD CONSTRAINT payments_payment_mode_check 
  CHECK (payment_mode IN ('cash', 'cheque', 'account_transfer', 'upi', 'dd', 'other'));
/*
  # Create Sales Targets Management Table
  
  1. New Table `sales_targets`:
    - `id` (uuid, primary key)
    - `user_id` (uuid, references profiles, unique with period details)
    - `period_type` (text, e.g., 'monthly', 'quarterly', 'yearly')
    - `start_date` (date, first day of the period)
    - `end_date` (date, last day of the period)
    - `target_amount` (numeric, default 0)
    - `target_units` (integer, default 0)
    - `created_by` (uuid, references profiles)
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  2. Security:
    - Enable RLS
    - Policy: authenticated users can read.
    - Policy: admins/super_admins can insert/update/delete.
    - Policy: standard users can view their own targets.
*/

CREATE TABLE IF NOT EXISTS sales_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  period_type text CHECK (period_type IN ('monthly', 'quarterly', 'yearly')),
  start_date date NOT NULL,
  end_date date NOT NULL,
  target_amount decimal(15, 2) DEFAULT 0,
  target_units integer DEFAULT 0,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Ensure one target per user per period (defined by type and start date)
  UNIQUE(user_id, period_type, start_date)
);

-- Enable RLS
ALTER TABLE sales_targets ENABLE ROW LEVEL SECURITY;

-- Policies

-- 1. Read: Admins see all, Users see their own
DROP POLICY IF EXISTS "View targets" ON sales_targets;
CREATE POLICY "View targets" ON sales_targets
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'sales_head'))
  );

-- 2. Insert/Update/Delete: Only Admins/Managers
DROP POLICY IF EXISTS "Manage targets" ON sales_targets;
CREATE POLICY "Manage targets" ON sales_targets
  FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'sales_head', 'team_leader'))
  );
/*
  # Refactor Sales Targets for Sq Ft & Monthly Only
  
  1. Changes:
    - Add `target_sqft` (decimal) column.
    - Remove yearly/quarterly from allowed period_types (check constraint).
    - Make `period_type` default to 'monthly'.
*/

ALTER TABLE sales_targets 
  ADD COLUMN IF NOT EXISTS target_sqft decimal(10, 2) DEFAULT 0;

-- Update existing check constraint for period_type if possible, or just add a new one
ALTER TABLE sales_targets DROP CONSTRAINT IF EXISTS sales_targets_period_type_check;
ALTER TABLE sales_targets ADD CONSTRAINT sales_targets_period_type_check 
  CHECK (period_type IN ('monthly'));

-- We will largely ignore target_amount and target_units moving forward, 
-- or we could drop them. For safety, we keep them but nullable/unused.
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
-- Add date fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS dob DATE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS marriage_anniversary DATE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS joining_date DATE DEFAULT NULL;

-- Comment on columns
COMMENT ON COLUMN profiles.dob IS 'Date of Birth of the employee';
COMMENT ON COLUMN profiles.marriage_anniversary IS 'Marriage Anniversary Date';
COMMENT ON COLUMN profiles.joining_date IS 'Date of Joining the company';
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
-- Create a function to automatically generate notifications for all active users when an announcement is posted
CREATE OR REPLACE FUNCTION public.handle_new_announcement()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert a notification for every active user
    INSERT INTO public.notifications (user_id, title, message, type, related_entity_type, related_entity_id, is_read)
    SELECT 
        id as user_id,
        'New Announcement: ' || NEW.title as title,
        substring(NEW.content from 1 for 50) || '...' as message,
        'info' as type,
        'announcement' as related_entity_type,
        NEW.id as related_entity_id,
        false as is_read
    FROM public.profiles
    WHERE is_active = true;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function after an announcement is inserted
DROP TRIGGER IF EXISTS on_announcement_created ON public.announcements;
CREATE TRIGGER on_announcement_created
    AFTER INSERT ON public.announcements
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_announcement();
/*
  # Auto-Notify Users on New Announcements

  1. New Function:
     - `handle_new_announcement()` - Automatically creates notifications for all active users when an announcement is posted
  
  2. Details:
     - Notification includes announcement title prefixed with "New Announcement: "
     - Message contains first 50 characters of announcement content
     - Only active users (is_active = true) receive notifications
     - Notifications are marked as unread by default
     - Links notification to the announcement via related_entity_id
  
  3. Trigger:
     - `on_announcement_created` - Fires AFTER INSERT on announcements table
     - Automatically invokes the notification function for each new announcement
  
  4. Security:
     - Function uses SECURITY DEFINER to ensure it can insert notifications regardless of RLS
     - Inherits existing RLS policies on notifications table for read access
*/

-- Create a function to automatically generate notifications for all active users when an announcement is posted
CREATE OR REPLACE FUNCTION public.handle_new_announcement()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert a notification for every active user
    INSERT INTO public.notifications (user_id, title, message, type, related_entity_type, related_entity_id, is_read)
    SELECT 
        id as user_id,
        'New Announcement: ' || NEW.title as title,
        substring(NEW.content from 1 for 50) || '...' as message,
        'info' as type,
        'announcement' as related_entity_type,
        NEW.id as related_entity_id,
        false as is_read
    FROM public.profiles
    WHERE is_active = true;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function after an announcement is inserted
DROP TRIGGER IF EXISTS on_announcement_created ON public.announcements;
CREATE TRIGGER on_announcement_created
    AFTER INSERT ON public.announcements
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_announcement();
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
/*
  # Add Co-Owners Support to Sales Table

  1. Changes:
     - Adds co_owners column to sales table
     - Column type: JSONB (stores array of co-owner/co-applicant data)
     - Default value: empty array
  
  2. Purpose:
     - Enables tracking of multiple owners/co-applicants for a single sale
     - Stores co-owner information in flexible JSON format
     - Supports complex ownership scenarios
  
  3. Security:
     - Inherits existing RLS policies from sales table
     - No additional permissions changes needed
*/

-- Add co_owners column to sales table to support multiple owners
ALTER TABLE sales
ADD COLUMN IF NOT EXISTS co_owners JSONB DEFAULT '[]'::jsonb;

-- Comment
COMMENT ON COLUMN sales.co_owners IS 'List of additional owners/co-applicants for the sale';
-- Add co_owners column to sales table to support multiple owners
ALTER TABLE sales
ADD COLUMN IF NOT EXISTS co_owners JSONB DEFAULT '[]'::jsonb;

-- Comment
COMMENT ON COLUMN sales.co_owners IS 'List of additional owners/co-applicants for the sale';
-- Add cancellation fields to sales table
ALTER TABLE sales
ADD COLUMN IF NOT EXISTS booking_status text DEFAULT 'booked' CHECK (booking_status IN ('booked', 'cancelled')),
ADD COLUMN IF NOT EXISTS cancellation_reason text,
ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
ADD COLUMN IF NOT EXISTS cancelled_by uuid REFERENCES profiles(id);

COMMENT ON COLUMN sales.booking_status IS 'Status of the booking: booked or cancelled';
COMMENT ON COLUMN sales.cancellation_reason IS 'Reason provided for cancellation';
COMMENT ON COLUMN sales.cancelled_at IS 'Timestamp when the sale was cancelled';
COMMENT ON COLUMN sales.cancelled_by IS 'User who performed the cancellation';
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
/*
  # Add Director Role
  
  1. Changes
    - Update `profiles` table `role` check constraint to include 'director'.
*/

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('super_admin', 'admin', 'team_leader', 'sales_executive', 'crm_staff', 'accountant', 'driver', 'director'));
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
/*
  # Clean and Restructure Profiles RLS Policies

  1. Changes Made
    - Redefine `get_my_role()` function with proper security settings
    - Drop all existing policies on profiles table to start fresh
    - Create new hierarchical policy structure

  2. New Policy Structure
    - **Self Access**: Users can manage their own profile (always allowed)
    - **Admin Access**: Super admin and admin have full access to all profiles
    - **Privileged Readers**: Director and receptionist can view all profiles
    - **Standard Users**: Can view only active profiles (for directory)

  3. Security
    - Base policy ensures users can manage their own profile
    - Role-based policies provide appropriate access levels
    - Standard users restricted to viewing active profiles only
*/

-- 1. Secure Role Check Function (Recursive-safe)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;

-- 2. Drop ALL existing policies on profiles
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', pol.policyname);
  END LOOP;
END $$;

-- 3. Create Clean Policies

-- A. Self Access (Always allowed)
CREATE POLICY "Users can manage own profile" ON profiles
  FOR ALL
  USING (auth.uid() = id);

-- B. Admin Level Access (Super Admin & Admin)
CREATE POLICY "Admins full access to profiles" ON profiles
  FOR ALL
  USING (get_my_role() IN ('super_admin', 'admin'));

-- C. Readers (Director, Receptionist) - View All
CREATE POLICY "Privileged readers view all profiles" ON profiles
  FOR SELECT
  USING (get_my_role() IN ('director', 'receptionist'));

-- D. Standard Users - View Active Only (Directory)
CREATE POLICY "Standard users view active profiles" ON profiles
  FOR SELECT
  USING (is_active = true);
/*
  # Critical Fix for Login/RLS Recursion
  
  This migration fixes the "Infinite Recursion" error often encountered during login when RLS policies refer to the same table.
  It ensures the helper function `get_my_role()` is correctly defined as SECURITY DEFINER to bypass RLS, and cleans up any conflicting policies.
*/

BEGIN;

-- 1. Redefine the function to be absolutely sure it breaks recursion (Security Definer)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;


-- 2. Ensure Users can ALWAYS view their own profile (Base Case for recursion safety)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);


-- 3. Re-apply Directory/Profile Access Policies
-- These policies rely on get_my_role(). If the function works, these work.

-- Director
DROP POLICY IF EXISTS "Director view profiles" ON profiles;
CREATE POLICY "Director view profiles" ON profiles
  FOR SELECT TO authenticated
  USING (get_my_role() = 'director');

-- Receptionist
DROP POLICY IF EXISTS "Receptionist view profiles" ON profiles;
CREATE POLICY "Receptionist view profiles" ON profiles
  FOR SELECT TO authenticated
  USING (get_my_role() = 'receptionist' AND is_active = true);

COMMIT;
/*
  # Comprehensive Fix for Login/RLS Recursion
  
  This migration performs a complete reset of the RLS policies on the `profiles` table to eliminate any "infinite recursion" bugs causing login failures.
  
  Steps:
  1. Defines a recursion-proof `get_my_role()` function.
  2. DROPS ALL existing policies on the `profiles` table (cleaning up any old/conflicting ones).
  3. Re-creates a clean, simplified set of policies for all roles.
*/

BEGIN;

-- 1. Secure Role Check Function
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;


-- 2. Drop ALL existing policies on profiles to ensure a clean slate
-- We use a DO block to dynamically drop all policies for the table
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', pol.policyname);
  END LOOP;
END $$;


-- 3. Create Clean Policies

-- A. Self Access (Always allowed, Base Case)
CREATE POLICY "Users can manage own profile" ON profiles
  FOR ALL
  USING (auth.uid() = id);

-- B. Admin Level Access (Super Admin & Admin) - Full Control
CREATE POLICY "Admins full access to profiles" ON profiles
  FOR ALL
  USING (get_my_role() IN ('super_admin', 'admin'));

-- C. Readers (Director, Receptionist) - View All (Active & Inactive)
CREATE POLICY "Privileged readers view all profiles" ON profiles
  FOR SELECT
  USING (get_my_role() IN ('director', 'receptionist'));

-- D. Standard Users (Sales Exec, Team Leader, etc) - View Active Only (Directory)
CREATE POLICY "Standard users view active profiles" ON profiles
  FOR SELECT
  USING (is_active = true);


COMMIT;
/*
  # EMERGENCY: Reset All User Passwords
  
  This script will reset the password for ALL users in the system to '123456'.
  
  WARNING: This is a destructive operation. All existing passwords will be overwritten.
  Ensure you really want to do this before running.
*/

-- 1. Enable pgcrypto extension to generate secure hashes
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Update the encrypted_password for ALL users in auth.users
UPDATE auth.users
SET encrypted_password = crypt('123456', gen_salt('bf'));

-- 3. Optional: Clear any recovery tokens to prevent confusion
UPDATE auth.users
SET recovery_token = NULL,
    confirmation_token = NULL;
