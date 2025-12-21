-- Fix Support Tickets Foreign Key to Profiles
-- This adds the missing relationship for Supabase queries

-- First, remove the old constraint if exists
ALTER TABLE public.support_tickets 
DROP CONSTRAINT IF EXISTS support_tickets_created_by_fkey;

-- Add foreign key to profiles instead of auth.users
ALTER TABLE public.support_tickets
ADD CONSTRAINT support_tickets_created_by_fkey
FOREIGN KEY (created_by) 
REFERENCES public.profiles(id) 
ON DELETE SET NULL;

-- Verify the relationship
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name='support_tickets' 
  AND tc.constraint_type = 'FOREIGN KEY';
