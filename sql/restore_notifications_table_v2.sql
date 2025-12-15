-- RESTORE MISSING NOTIFICATIONS TABLE (FIXED SYNTAX)
-- RAISE NOTICE cannot be run directly in SQL, it must be inside a DO block or function.
-- This version fixes that error.

DO $$
BEGIN
  -- 1. Create Table if missing
  CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    title text NOT NULL,
    message text NOT NULL,
    type text CHECK (type IN ('info', 'success', 'warning', 'error')),
    related_entity_type text,
    related_entity_id uuid,
    is_read boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
  );

  -- 2. Enable Row Level Security (RLS)
  ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

  -- 3. Create Policies (Drop first to avoid errors if they exist)
  DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
  CREATE POLICY "Users can view their own notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);

  DROP POLICY IF EXISTS "Users can update/delete their own notifications" ON public.notifications;
  CREATE POLICY "Users can update/delete their own notifications"
    ON public.notifications FOR ALL
    USING (auth.uid() = user_id);

  RAISE NOTICE 'Restored notifications table successfully.';
END;
$$;
