-- Fix user_referrals foreign key constraint to reference auth.users instead of profiles
-- This allows affiliates (who don't have profiles) to be referrers

-- 1. Drop the existing foreign key constraint
ALTER TABLE public.user_referrals
DROP CONSTRAINT IF EXISTS user_referrals_referrer_id_fkey;

-- 2. Add new foreign key constraint referencing auth.users
ALTER TABLE public.user_referrals
ADD CONSTRAINT user_referrals_referrer_id_fkey 
FOREIGN KEY (referrer_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- 3. Update the RLS policy to allow affiliates to view their referrals
DROP POLICY IF EXISTS "Referrers view their own referrals" ON user_referrals;

CREATE POLICY "Referrers view their own referrals" ON user_referrals
  FOR SELECT
  USING (referrer_id = auth.uid());
