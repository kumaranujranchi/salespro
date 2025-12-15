-- FIX GHOST PROFILES
-- You observed that "Tenant IDs" are still visible in Profiles even though Tenants are deleted.
-- These are "Ghost Profiles". This script specifically finds them and removes them.

DO $$
DECLARE
  r RECORD;
  deleted_count INT := 0;
BEGIN
  RAISE NOTICE 'Scanning for Ghost Profiles (Users pointing to deleted tenants)...';

  -- Loop through users who have a tenant_id that DOES NOT EXIST in the tenants table
  FOR r IN 
    SELECT p.id, p.email, p.tenant_id
    FROM public.profiles p
    LEFT JOIN public.tenants t ON p.tenant_id = t.id
    WHERE p.tenant_id IS NOT NULL 
    AND t.id IS NULL -- This confirms the tenant is deleted
    AND p.role != 'platform_admin' -- Protected
    AND p.email != 'admin@salespro.com' -- Protected
  LOOP
    RAISE NOTICE 'Found Ghost Profile: % (Tenant ID: % missing)', r.email, r.tenant_id;

    -- 1. Detach from self-referencing FKs first
    UPDATE public.profiles SET reporting_manager_id = NULL WHERE id = r.id;

    -- 2. Delete related data for this specific user
    -- Activity Log (Singular - the one that caused errors)
    BEGIN EXECUTE 'DELETE FROM public.activity_log WHERE user_id = $1' USING r.id; EXCEPTION WHEN others THEN NULL; END;
    -- Activity Logs (Plural - backup)
    BEGIN EXECUTE 'DELETE FROM public.activity_logs WHERE user_id = $1' USING r.id; EXCEPTION WHEN others THEN NULL; END;
    
    DELETE FROM public.notifications WHERE user_id = r.id;
    DELETE FROM public.targets WHERE user_id = r.id;
    DELETE FROM public.sales WHERE sales_executive_id = r.id;
    DELETE FROM public.incentives WHERE sales_executive_id = r.id;
    DELETE FROM public.site_visits WHERE requested_by = r.id;
    BEGIN EXECUTE 'DELETE FROM public.site_visits WHERE driver_id = $1' USING r.id; EXCEPTION WHEN others THEN NULL; END;
    
    -- 3. Delete the profile
    DELETE FROM public.profiles WHERE id = r.id;
    
    deleted_count := deleted_count + 1;
  END LOOP;

  RAISE NOTICE 'Fix Complete. Removed % ghost profiles.', deleted_count;
END;
$$;
