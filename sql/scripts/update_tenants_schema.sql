-- Add missing columns to tenants table for SaaS Dashboard

DO $$
BEGIN
    -- is_active
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'is_active') THEN
        ALTER TABLE tenants ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;

    -- plan_tier
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'plan_tier') THEN
        ALTER TABLE tenants ADD COLUMN plan_tier TEXT DEFAULT 'starter';
    END IF;

    -- billing_cycle
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'billing_cycle') THEN
        ALTER TABLE tenants ADD COLUMN billing_cycle TEXT DEFAULT 'monthly';
    END IF;

    -- contact_email
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'contact_email') THEN
        ALTER TABLE tenants ADD COLUMN contact_email TEXT;
    END IF;

    -- contact_phone
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'contact_phone') THEN
        ALTER TABLE tenants ADD COLUMN contact_phone TEXT;
    END IF;

    -- address
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'address') THEN
        ALTER TABLE tenants ADD COLUMN address TEXT;
    END IF;

    -- city
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'city') THEN
        ALTER TABLE tenants ADD COLUMN city TEXT;
    END IF;

    -- state
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'state') THEN
        ALTER TABLE tenants ADD COLUMN state TEXT;
    END IF;

    -- owner_id (link to profiles)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'owner_id') THEN
        ALTER TABLE tenants ADD COLUMN owner_id UUID REFERENCES profiles(id);
    END IF;

    -- trial_ends_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'trial_ends_at') THEN
        ALTER TABLE tenants ADD COLUMN trial_ends_at TIMESTAMPTZ;
    END IF;

END $$;
