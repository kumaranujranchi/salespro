-- RESTORE MISSING NOTIFICATIONS TABLE
-- This script re-creates the missing 'notifications' table to ensure system health.

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

-- Enable Row Level Security (RLS)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own notifications (mark read/dismiss)
CREATE POLICY "Users can update/delete their own notifications"
  ON public.notifications FOR ALL
  USING (auth.uid() = user_id);

RAISE NOTICE 'Restored notifications table successfully.';
