-- Create Call Status Enum
DO $$ BEGIN
    CREATE TYPE call_status_type AS ENUM ('Connected', 'Ringing', 'Disconnected', 'Busy', 'Not Responding', 'Asked to call later');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add column to lead_followups
ALTER TABLE public.lead_followups 
ADD COLUMN IF NOT EXISTS call_status call_status_type DEFAULT 'Connected';
