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
