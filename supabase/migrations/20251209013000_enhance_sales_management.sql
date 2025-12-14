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
