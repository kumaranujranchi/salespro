-- DIAGNOSTIC SCRIPT: Check status of 'ravi@gmail.com'

DO $$
DECLARE
    target_email text := 'ravi@gmail.com';
    u_id uuid;
    u_email text;
    u_confirmed timestamptz;
    p_tenant_id uuid;
    t_name text;
BEGIN
    RAISE NOTICE '--- CHECKING USER STATUS FOR % ---', target_email;

    -- 1. Check Auth User
    SELECT id, email, email_confirmed_at INTO u_id, u_email, u_confirmed
    FROM auth.users
    WHERE email = target_email;

    IF u_id IS NULL THEN
        RAISE NOTICE 'USER NOT FOUND in auth.users';
        RETURN;
    ELSE
        RAISE NOTICE 'Auth User Found: ID=%, Email Confirmed=%', u_id, u_confirmed;
    END IF;

    -- 2. Check Profile & Tenant Link
    SELECT tenant_id INTO p_tenant_id
    FROM public.profiles
    WHERE id = u_id;

    IF p_tenant_id IS NULL THEN
        RAISE NOTICE 'CRITICAL: Profile exists but tenant_id is NULL. User is an ORPHAN.';
    ELSE
        -- 3. Check Tenant Details
        SELECT name INTO t_name FROM public.tenants WHERE id = p_tenant_id;
        IF t_name IS NOT NULL THEN
             RAISE NOTICE 'Profile Linked to Tenant: % (ID: %)', t_name, p_tenant_id;
        ELSE
             RAISE NOTICE 'CRITICAL: Profile has tenant_id % but Tenant DOES NOT EXIST.', p_tenant_id;
        END IF;
    END IF;

END $$;
