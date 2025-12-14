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
