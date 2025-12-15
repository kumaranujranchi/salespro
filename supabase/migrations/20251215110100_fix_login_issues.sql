-- COMPREHENSIVE FIX for Login/Registration Issues

-- 1. Reset user 'ravi@gmail.com' to allow a fresh start
DO $$
DECLARE
    target_email text := 'ravi@gmail.com';
    user_id uuid;
BEGIN
    SELECT id INTO user_id FROM auth.users WHERE email = target_email;
    IF user_id IS NOT NULL THEN
        DELETE FROM public.profiles WHERE id = user_id; -- Ensure profile is gone
        DELETE FROM auth.users WHERE id = user_id;      -- Ensure auth user is gone
        RAISE NOTICE 'User % deleted for fresh start.', target_email;
    END IF;
END $$;

-- 2. Ensure Email Auto-Confirmation Trigger is ACTIVE
-- This is crucial so user does not get "Email not confirmed" error
CREATE OR REPLACE FUNCTION public.auto_confirm_email()
RETURNS TRIGGER AS $$
BEGIN
    NEW.email_confirmed_at := now(); -- Auto confirm
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_confirmation ON auth.users;
CREATE TRIGGER on_auth_user_created_confirmation
BEFORE INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.auto_confirm_email();


-- 3. Ensure Permissions are correct for Profiles (So Login works)
-- If a user cannot read their own profile, the app will log them out immediately.
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.tenants TO authenticated; 

-- 4. Enable RLS on profiles but ensure the policy allows SELF access
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles 
FOR SELECT USING ( auth.uid() = id );

SELECT 'All fixes applied successfully.' as status;
