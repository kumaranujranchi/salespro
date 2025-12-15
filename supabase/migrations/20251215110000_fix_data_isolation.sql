-- FIX SCRIPT: Enforce Isolation and Move 'mani@mk.com' to new Tenant

-- 1. Ensure RLS is STRICTLY enabled on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Explicitly recreate the Tenant Isolation Policy for Profiles if it's not working
DROP POLICY IF EXISTS "View Own and Co-Tenant Profiles" ON public.profiles;

CREATE POLICY "View Own and Co-Tenant Profiles" ON public.profiles FOR SELECT
USING (
    id = auth.uid() OR tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
);

-- 3. Fix the specific user 'mani@mk.com' (Move him to his own tenant)
DO $$
DECLARE
    target_user_email text := 'mani@mk.com';
    target_company_name text := 'MK Reality';
    target_user_id uuid;
    new_tenant_id uuid;
BEGIN
    -- Find the user ID from profiles (joined with auth via email usually not possible in pure sql for all, 
    -- but we can assume we might find him by name or if we could join auth.users. 
    -- Since we can't easily access auth.users emails here without super privilege, 
    -- we will try to find the profile that matches the name 'Mani Kant Sharma' and is NOT the super admin)
    
    -- NOTE: For safety, since we know the email 'mani@mk.com' from the screenshot,
    -- We'll try to find the user in auth.users if we have access, or update based on the profile name/latest created.
    
    SELECT id INTO target_user_id 
    FROM auth.users 
    WHERE email = target_user_email;

    IF target_user_id IS NOT NULL THEN
        -- Create the Tenant 'MK Reality' if it doesn't exist
        INSERT INTO public.tenants (name, slug, subscription_status)
        VALUES (target_company_name, 'mk-reality', 'trial')
        ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name -- Just get the ID if exists
        RETURNING id INTO new_tenant_id;

        -- Move the User
        UPDATE public.profiles
        SET tenant_id = new_tenant_id,
            role = 'super_admin'
        WHERE id = target_user_id;
        
        RAISE NOTICE 'User % moved to new Tenant %', target_user_email, target_company_name;
    ELSE
        RAISE NOTICE 'User % not found in auth.users. Please check email.', target_user_email;
    END IF;
END $$;
