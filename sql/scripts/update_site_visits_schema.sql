-- Add missing columns to site_visits table if they don't exist
DO $$ 
BEGIN 
    -- 1. Add driver_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_visits' AND column_name = 'driver_id') THEN
        ALTER TABLE public.site_visits ADD COLUMN driver_id UUID REFERENCES public.profiles(id);
    END IF;

    -- 2. Add project_ids (Array of UUIDs)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_visits' AND column_name = 'project_ids') THEN
        ALTER TABLE public.site_visits ADD COLUMN project_ids UUID[] DEFAULT '{}';
    END IF;

    -- 3. Add approved_by
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_visits' AND column_name = 'approved_by') THEN
        ALTER TABLE public.site_visits ADD COLUMN approved_by UUID REFERENCES public.profiles(id);
    END IF;

     -- 4. Add rejection_reason
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_visits' AND column_name = 'rejection_reason') THEN
        ALTER TABLE public.site_visits ADD COLUMN rejection_reason TEXT;
    END IF;

    -- 5. Add clarification_note
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_visits' AND column_name = 'clarification_note') THEN
        ALTER TABLE public.site_visits ADD COLUMN clarification_note TEXT;
    END IF;

    -- 6. Add odometer readings
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_visits' AND column_name = 'start_odometer') THEN
        ALTER TABLE public.site_visits ADD COLUMN start_odometer NUMERIC;
    END IF;
     IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_visits' AND column_name = 'end_odometer') THEN
        ALTER TABLE public.site_visits ADD COLUMN end_odometer NUMERIC;
    END IF;

END $$;
