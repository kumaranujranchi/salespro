DO $$
DECLARE
    found_constraint_name text;
BEGIN
    -- 1. Ensure clarification_note column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_visits' AND column_name = 'clarification_note') THEN
        ALTER TABLE public.site_visits ADD COLUMN clarification_note TEXT;
    END IF;

    -- 2. Ensure rejection_reason column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_visits' AND column_name = 'rejection_reason') THEN
        ALTER TABLE public.site_visits ADD COLUMN rejection_reason TEXT;
    END IF;

    -- 3. Drop known constraint name if valid
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'site_visits_status_check' 
        AND conrelid = 'public.site_visits'::regclass
    ) THEN
        ALTER TABLE public.site_visits DROP CONSTRAINT site_visits_status_check;
    END IF;

    -- 4. Try to find any other constraint on status and drop it (in case it was named differently)
    -- This looks for check constraints on site_visits that mention 'status' in their definition
    FOR found_constraint_name IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'public.site_visits'::regclass 
        AND contype = 'c' 
        AND pg_get_constraintdef(oid) LIKE '%status%'
        AND conname != 'site_visits_status_check' -- Already handled
    LOOP
        EXECUTE 'ALTER TABLE public.site_visits DROP CONSTRAINT ' || found_constraint_name;
    END LOOP;

    -- 5. Add the constraint with all allowed values INCLUDING 'pending_clarification'
    ALTER TABLE public.site_visits ADD CONSTRAINT site_visits_status_check 
    CHECK (status IN ('pending', 'approved', 'declined', 'pending_clarification', 'trip_started', 'completed', 'cancelled'));

END $$;
