DO $$ 
BEGIN 
    -- 1. Add trip_start_time
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_visits' AND column_name = 'trip_start_time') THEN
        ALTER TABLE public.site_visits ADD COLUMN trip_start_time TIMESTAMPTZ;
    END IF;

    -- 2. Add trip_end_time
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_visits' AND column_name = 'trip_end_time') THEN
        ALTER TABLE public.site_visits ADD COLUMN trip_end_time TIMESTAMPTZ;
    END IF;
END $$;
