/*
  # SalesSphere Database Schema
  
  ## Overview
  Complete database schema for SalesSphere - Corporate Sales Management Application
  
  ## New Tables
  
  ### 1. profiles
  Extended user profile information linked to auth.users
  - `id` (uuid, FK to auth.users)
  - `employee_id` (text, unique)
  - `full_name` (text)
  - `email` (text)
  - `phone` (text)
  - `role` (text) - super_admin, admin, team_leader, sales_executive, crm_staff, accountant
  - `department_id` (uuid, FK)
  - `reporting_manager_id` (uuid, FK to profiles)
  - `image_url` (text)
  - `is_active` (boolean)
  - `created_at`, `updated_at` (timestamptz)
  
  ### 2. departments
  Department master data
  - `id` (uuid, PK)
  - `name` (text)
  - `description` (text)
  - `is_active` (boolean)
  - `created_at`, `updated_at` (timestamptz)
  
  ### 3. projects
  Project/property listings
  - `id` (uuid, PK)
  - `name` (text)
  - `address` (text)
  - `location_lat` (decimal)
  - `location_lng` (decimal)
  - `google_maps_url` (text)
  - `site_photos` (jsonb array)
  - `metadata` (jsonb)
  - `is_active` (boolean)
  - `created_at`, `updated_at` (timestamptz)
  
  ### 4. announcements
  Company-wide announcements
  - `id` (uuid, PK)
  - `title` (text)
  - `content` (text)
  - `is_important` (boolean)
  - `is_published` (boolean)
  - `created_by` (uuid, FK)
  - `created_at`, `updated_at` (timestamptz)
  
  ### 5. targets
  Sales targets assigned to users
  - `id` (uuid, PK)
  - `user_id` (uuid, FK)
  - `target_type` (text) - monthly, quarterly, yearly
  - `target_amount` (decimal)
  - `target_units` (integer)
  - `period_start` (date)
  - `period_end` (date)
  - `created_by` (uuid, FK)
  - `created_at`, `updated_at` (timestamptz)
  
  ### 6. site_visits
  Site visit requests and approvals
  - `id` (uuid, PK)
  - `requested_by` (uuid, FK)
  - `customer_name` (text)
  - `customer_phone` (text)
  - `pickup_location` (text)
  - `project_ids` (jsonb array)
  - `visit_date` (date)
  - `visit_time` (time)
  - `status` (text) - pending, approved, completed, cancelled
  - `assigned_vehicle` (text)
  - `approved_by` (uuid, FK)
  - `approved_at` (timestamptz)
  - `is_public` (boolean)
  - `notes` (text)
  - `created_at`, `updated_at` (timestamptz)
  
  ### 7. customers
  Customer master data
  - `id` (uuid, PK)
  - `name` (text)
  - `email` (text)
  - `phone` (text)
  - `alternate_phone` (text)
  - `address` (text)
  - `metadata` (jsonb)
  - `created_by` (uuid, FK)
  - `created_at`, `updated_at` (timestamptz)
  
  ### 8. sales
  Main sales transaction records
  - `id` (uuid, PK)
  - `sale_number` (text, unique)
  - `customer_id` (uuid, FK)
  - `project_id` (uuid, FK)
  - `sales_executive_id` (uuid, FK)
  - `team_leader_id` (uuid, FK)
  - `sale_date` (date)
  - `property_type` (text)
  - `unit_number` (text)
  - `area_sqft` (decimal)
  - `rate_per_sqft` (decimal)
  - `base_price` (decimal)
  - `additional_charges` (decimal)
  - `discount` (decimal)
  - `total_revenue` (decimal)
  - `booking_amount` (decimal)
  - `registry_status` (text)
  - `possession_date` (date)
  - `legal_status` (text)
  - `payment_plan` (text)
  - `notes` (text)
  - `metadata` (jsonb)
  - `created_at`, `updated_at` (timestamptz)
  
  ### 9. payments
  Payment records linked to sales
  - `id` (uuid, PK)
  - `sale_id` (uuid, FK)
  - `payment_date` (date)
  - `amount` (decimal)
  - `payment_type` (text) - booking, installment, final, other
  - `payment_mode` (text) - cash, cheque, bank_transfer, upi, card
  - `transaction_reference` (text)
  - `remarks` (text)
  - `recorded_by` (uuid, FK)
  - `created_at`, `updated_at` (timestamptz)
  
  ### 10. incentives
  Incentive calculation and payout tracking
  - `id` (uuid, PK)
  - `sale_id` (uuid, FK)
  - `sales_executive_id` (uuid, FK)
  - `calculation_month` (text)
  - `calculation_year` (integer)
  - `total_incentive_amount` (decimal)
  - `installment_1_amount` (decimal)
  - `installment_1_paid` (boolean)
  - `installment_1_date` (date)
  - `installment_2_amount` (decimal)
  - `installment_2_paid` (boolean)
  - `installment_2_date` (date)
  - `installment_3_amount` (decimal)
  - `installment_3_paid` (boolean)
  - `installment_3_date` (date)
  - `installment_4_amount` (decimal)
  - `installment_4_paid` (boolean)
  - `installment_4_date` (date)
  - `is_locked` (boolean)
  - `created_at`, `updated_at` (timestamptz)
  
  ### 11. reports
  Report metadata and access control
  - `id` (uuid, PK)
  - `report_name` (text)
  - `report_type` (text)
  - `description` (text)
  - `allowed_roles` (jsonb array)
  - `is_downloadable` (boolean)
  - `created_at`, `updated_at` (timestamptz)
  
  ### 12. activity_log
  System activity tracking
  - `id` (uuid, PK)
  - `user_id` (uuid, FK)
  - `action` (text)
  - `entity_type` (text)
  - `entity_id` (uuid)
  - `details` (jsonb)
  - `created_at` (timestamptz)
  
  ## Security
  - RLS enabled on all tables
  - Role-based access policies for each table
  - Authenticated users only
*/

-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id text UNIQUE NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  role text NOT NULL CHECK (role IN ('super_admin', 'admin', 'team_leader', 'sales_executive', 'crm_staff', 'accountant')),
  department_id uuid REFERENCES departments(id),
  reporting_manager_id uuid REFERENCES profiles(id),
  image_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  location_lat decimal(10, 8),
  location_lng decimal(11, 8),
  google_maps_url text,
  site_photos jsonb DEFAULT '[]'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  is_important boolean DEFAULT false,
  is_published boolean DEFAULT false,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create targets table
CREATE TABLE IF NOT EXISTS targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) NOT NULL,
  target_type text NOT NULL CHECK (target_type IN ('monthly', 'quarterly', 'yearly')),
  target_amount decimal(15, 2) DEFAULT 0,
  target_units integer DEFAULT 0,
  period_start date NOT NULL,
  period_end date NOT NULL,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text NOT NULL,
  alternate_phone text,
  address text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create site_visits table
CREATE TABLE IF NOT EXISTS site_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_by uuid REFERENCES profiles(id) NOT NULL,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  pickup_location text,
  project_ids jsonb DEFAULT '[]'::jsonb,
  visit_date date NOT NULL,
  visit_time time NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'completed', 'cancelled')),
  assigned_vehicle text,
  approved_by uuid REFERENCES profiles(id),
  approved_at timestamptz,
  is_public boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create sales table
CREATE TABLE IF NOT EXISTS sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_number text UNIQUE NOT NULL,
  customer_id uuid REFERENCES customers(id) NOT NULL,
  project_id uuid REFERENCES projects(id) NOT NULL,
  sales_executive_id uuid REFERENCES profiles(id) NOT NULL,
  team_leader_id uuid REFERENCES profiles(id),
  sale_date date NOT NULL DEFAULT CURRENT_DATE,
  property_type text,
  unit_number text,
  area_sqft decimal(10, 2),
  rate_per_sqft decimal(10, 2),
  base_price decimal(15, 2),
  additional_charges decimal(15, 2) DEFAULT 0,
  discount decimal(15, 2) DEFAULT 0,
  total_revenue decimal(15, 2) NOT NULL,
  booking_amount decimal(15, 2) DEFAULT 0,
  registry_status text,
  possession_date date,
  legal_status text,
  payment_plan text,
  notes text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid REFERENCES sales(id) ON DELETE CASCADE NOT NULL,
  payment_date date NOT NULL,
  amount decimal(15, 2) NOT NULL,
  payment_type text NOT NULL CHECK (payment_type IN ('booking', 'installment', 'final', 'other')),
  payment_mode text NOT NULL CHECK (payment_mode IN ('cash', 'cheque', 'bank_transfer', 'upi', 'card')),
  transaction_reference text,
  remarks text,
  recorded_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create incentives table
CREATE TABLE IF NOT EXISTS incentives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid REFERENCES sales(id) NOT NULL,
  sales_executive_id uuid REFERENCES profiles(id) NOT NULL,
  calculation_month text NOT NULL,
  calculation_year integer NOT NULL,
  total_incentive_amount decimal(15, 2) NOT NULL,
  installment_1_amount decimal(15, 2) DEFAULT 0,
  installment_1_paid boolean DEFAULT false,
  installment_1_date date,
  installment_2_amount decimal(15, 2) DEFAULT 0,
  installment_2_paid boolean DEFAULT false,
  installment_2_date date,
  installment_3_amount decimal(15, 2) DEFAULT 0,
  installment_3_paid boolean DEFAULT false,
  installment_3_date date,
  installment_4_amount decimal(15, 2) DEFAULT 0,
  installment_4_paid boolean DEFAULT false,
  installment_4_date date,
  is_locked boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_name text NOT NULL,
  report_type text NOT NULL,
  description text,
  allowed_roles jsonb DEFAULT '[]'::jsonb,
  is_downloadable boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create activity_log table
CREATE TABLE IF NOT EXISTS activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE incentives ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all active profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Super admins and admins can insert profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Super admins and admins can update profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Super admins can delete profiles"
  ON profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- RLS Policies for departments
CREATE POLICY "All authenticated users can view departments"
  ON departments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert departments"
  ON departments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Admins can update departments"
  ON departments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Admins can delete departments"
  ON departments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

-- RLS Policies for projects
CREATE POLICY "All authenticated users can view active projects"
  ON projects FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can insert projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Admins can update projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Admins can delete projects"
  ON projects FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

-- RLS Policies for announcements
CREATE POLICY "All authenticated users can view published announcements"
  ON announcements FOR SELECT
  TO authenticated
  USING (is_published = true);

CREATE POLICY "Admins can manage announcements"
  ON announcements FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

-- RLS Policies for targets
CREATE POLICY "Users can view their own targets and team targets"
  ON targets FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin', 'team_leader')
    )
  );

CREATE POLICY "Admins and team leaders can insert targets"
  ON targets FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin', 'team_leader')
    )
  );

CREATE POLICY "Admins and team leaders can update targets"
  ON targets FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin', 'team_leader')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin', 'team_leader')
    )
  );

CREATE POLICY "Admins can delete targets"
  ON targets FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

-- RLS Policies for customers
CREATE POLICY "All authenticated users can view customers"
  ON customers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Sales executives and above can insert customers"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin', 'team_leader', 'sales_executive')
    )
  );

CREATE POLICY "Sales executives and above can update customers"
  ON customers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin', 'team_leader', 'sales_executive')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin', 'team_leader', 'sales_executive')
    )
  );

CREATE POLICY "Admins can delete customers"
  ON customers FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

-- RLS Policies for site_visits
CREATE POLICY "Users can view public site visits and their own"
  ON site_visits FOR SELECT
  TO authenticated
  USING (
    is_public = true
    OR requested_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin', 'team_leader')
    )
  );

CREATE POLICY "Sales executives can insert site visits"
  ON site_visits FOR INSERT
  TO authenticated
  WITH CHECK (
    requested_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('sales_executive', 'team_leader')
    )
  );

CREATE POLICY "Users can update their own site visits or admins can update any"
  ON site_visits FOR UPDATE
  TO authenticated
  USING (
    requested_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin', 'team_leader')
    )
  )
  WITH CHECK (
    requested_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin', 'team_leader')
    )
  );

CREATE POLICY "Admins can delete site visits"
  ON site_visits FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

-- RLS Policies for sales
CREATE POLICY "Users can view sales based on role"
  ON sales FOR SELECT
  TO authenticated
  USING (
    sales_executive_id = auth.uid()
    OR team_leader_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin', 'crm_staff', 'accountant')
    )
  );

CREATE POLICY "Sales executives and above can insert sales"
  ON sales FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin', 'team_leader', 'sales_executive')
    )
  );

CREATE POLICY "Sales executives can update their sales or admins can update any"
  ON sales FOR UPDATE
  TO authenticated
  USING (
    sales_executive_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin', 'team_leader', 'accountant')
    )
  )
  WITH CHECK (
    sales_executive_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin', 'team_leader', 'accountant')
    )
  );

CREATE POLICY "Admins can delete sales"
  ON sales FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

-- RLS Policies for payments
CREATE POLICY "Users can view payments based on role"
  ON payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sales
      WHERE sales.id = payments.sale_id
      AND (
        sales.sales_executive_id = auth.uid()
        OR sales.team_leader_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role IN ('super_admin', 'admin', 'crm_staff', 'accountant')
        )
      )
    )
  );

CREATE POLICY "Accountants and admins can insert payments"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin', 'accountant')
    )
  );

CREATE POLICY "Accountants and admins can update payments"
  ON payments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin', 'accountant')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin', 'accountant')
    )
  );

CREATE POLICY "Admins can delete payments"
  ON payments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

-- RLS Policies for incentives
CREATE POLICY "Users can view their own incentives or admins can view all"
  ON incentives FOR SELECT
  TO authenticated
  USING (
    sales_executive_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin', 'accountant')
    )
  );

CREATE POLICY "Admins and accountants can manage incentives"
  ON incentives FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin', 'accountant')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin', 'accountant')
    )
  );

-- RLS Policies for reports
CREATE POLICY "Users can view reports based on allowed roles"
  ON reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role::text = ANY(
        SELECT jsonb_array_elements_text(reports.allowed_roles)
      )
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Admins can manage reports"
  ON reports FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

-- RLS Policies for activity_log
CREATE POLICY "Users can view their own activity"
  ON activity_log FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "All authenticated users can insert activity logs"
  ON activity_log FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_department ON profiles(department_id);
CREATE INDEX IF NOT EXISTS idx_profiles_manager ON profiles(reporting_manager_id);
CREATE INDEX IF NOT EXISTS idx_targets_user ON targets(user_id);
CREATE INDEX IF NOT EXISTS idx_targets_period ON targets(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_site_visits_requested ON site_visits(requested_by);
CREATE INDEX IF NOT EXISTS idx_site_visits_date ON site_visits(visit_date);
CREATE INDEX IF NOT EXISTS idx_site_visits_status ON site_visits(status);
CREATE INDEX IF NOT EXISTS idx_sales_executive ON sales(sales_executive_id);
CREATE INDEX IF NOT EXISTS idx_sales_team_leader ON sales(team_leader_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_project ON sales(project_id);
CREATE INDEX IF NOT EXISTS idx_payments_sale ON payments(sale_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_incentives_executive ON incentives(sales_executive_id);
CREATE INDEX IF NOT EXISTS idx_incentives_period ON incentives(calculation_year, calculation_month);
CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_log(created_at DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_targets_updated_at BEFORE UPDATE ON targets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_site_visits_updated_at BEFORE UPDATE ON site_visits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_incentives_updated_at BEFORE UPDATE ON incentives
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();