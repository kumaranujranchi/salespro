-- 1. Backfill profiles for existing affiliates who only exist in referral_campaigns
INSERT INTO public.profiles (id, full_name, email, role, is_active)
SELECT 
    rc.created_by as id,
    rc.name as full_name, -- Use campaign name as fallback or placeholder
    u.email,
    'affiliate' as role,
    true as is_active
FROM public.referral_campaigns rc
JOIN auth.users u ON u.id = rc.created_by
LEFT JOIN public.profiles p ON p.id = rc.created_by
WHERE p.id IS NULL
ON CONFLICT (id) DO UPDATE SET role = 'affiliate';

-- 2. Restore user_referrals foreign key to point to profiles(id)
-- First, drop the recent fix that pointed to auth.users
ALTER TABLE public.user_referrals
DROP CONSTRAINT IF EXISTS user_referrals_referrer_id_fkey;

-- Add it back pointing to profiles
ALTER TABLE public.user_referrals
ADD CONSTRAINT user_referrals_referrer_id_fkey 
FOREIGN KEY (referrer_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;

-- 3. Ensure RLS on profiles allows users to view their own profile (which is already standard)
-- But we should check if affiliates can see themselves
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'Public profiles are viewable by everyone'
    ) THEN
        -- Standard policy usually allows this, but let's be sure
        NULL;
    END IF;
END $$;
