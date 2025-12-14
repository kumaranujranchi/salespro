-- Add missing columns to the sales table to match frontend interface
-- using IF NOT EXISTS to avoid errors if some columns are already present

DO $$
BEGIN
    -- Agreement & Registry Dates
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'agreement_date') THEN
        ALTER TABLE public.sales ADD COLUMN agreement_date date;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'registry_date') THEN
        ALTER TABLE public.sales ADD COLUMN registry_date date;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'possession_date') THEN
        ALTER TABLE public.sales ADD COLUMN possession_date date;
    END IF;

    -- Property Details
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'property_type') THEN
        ALTER TABLE public.sales ADD COLUMN property_type text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'unit_number') THEN
        ALTER TABLE public.sales ADD COLUMN unit_number text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'area_sqft') THEN
        ALTER TABLE public.sales ADD COLUMN area_sqft numeric;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'rate_per_sqft') THEN
        ALTER TABLE public.sales ADD COLUMN rate_per_sqft numeric;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'base_price') THEN
        ALTER TABLE public.sales ADD COLUMN base_price numeric;
    END IF;

    -- Financials
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'additional_charges') THEN
        ALTER TABLE public.sales ADD COLUMN additional_charges numeric DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'discount') THEN
        ALTER TABLE public.sales ADD COLUMN discount numeric DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'plc') THEN
        ALTER TABLE public.sales ADD COLUMN plc numeric DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'dev_charges') THEN
        ALTER TABLE public.sales ADD COLUMN dev_charges numeric DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'booking_amount') THEN
        ALTER TABLE public.sales ADD COLUMN booking_amount numeric DEFAULT 0;
    END IF;

    -- Status Flags
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'is_agreement_done') THEN
        ALTER TABLE public.sales ADD COLUMN is_agreement_done boolean DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'is_registry_done') THEN
        ALTER TABLE public.sales ADD COLUMN is_registry_done boolean DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'registry_status') THEN
        ALTER TABLE public.sales ADD COLUMN registry_status text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'legal_status') THEN
        ALTER TABLE public.sales ADD COLUMN legal_status text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'payment_plan') THEN
        ALTER TABLE public.sales ADD COLUMN payment_plan text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'notes') THEN
        ALTER TABLE public.sales ADD COLUMN notes text;
    END IF;

    -- Co-Owners (missing field reported by user)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'co_owners') THEN
        ALTER TABLE public.sales ADD COLUMN co_owners jsonb DEFAULT '[]'::jsonb;
    END IF;

END $$;

-- Force schema cache reload
NOTIFY pgrst, 'reload schema';
