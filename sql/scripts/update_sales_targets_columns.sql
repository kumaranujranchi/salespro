-- Add new columns for flexible target system directly to sales_targets table
DO $$
BEGIN
    -- Add target_units if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales_targets' AND column_name = 'target_units') THEN
        ALTER TABLE sales_targets ADD COLUMN target_units NUMERIC DEFAULT 0;
    END IF;

    -- Add target_amount if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales_targets' AND column_name = 'target_amount') THEN
        ALTER TABLE sales_targets ADD COLUMN target_amount NUMERIC DEFAULT 0;
    END IF;

    -- Ensure target_sqft defaults to 0 if null (optional clean up)
    ALTER TABLE sales_targets ALTER COLUMN target_sqft SET DEFAULT 0;

END $$;
