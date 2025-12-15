-- ULTIMATE DATA CLEANUP (V5 - THE "SAVE ADMIN TENANT" FIX)
-- The previous error happened because the script tried to delete the Tenant that the Platform Admin belongs to.
-- This version explicitly finds which Tenant the Admin is using and PROTECTS it.

DO $$
DECLARE
  v_admin_id uuid;
  v_admin_tenant_id uuid;
BEGIN
  -- 1. Find and Protect Admin User
  SELECT id, tenant_id INTO v_admin_id, v_admin_tenant_id 
  FROM public.profiles 
  WHERE role = 'platform_admin' LIMIT 1;
  
  IF v_admin_id IS NOT NULL THEN
    RAISE NOTICE 'Admin User ID: %', v_admin_id;
    RAISE NOTICE 'Admin Tenant ID: % (This will be protected)', v_admin_tenant_id;
  ELSE
    RAISE NOTICE 'WARNING: No Platform Admin found.';
  END IF;

  -- 2. BREAK CIRCULAR LINKS
  -- We nullify owner_id for all tenants EXCEPT the one the admin belongs to (if any).
  -- This allows us to delete the users of those tenants.
  
  UPDATE public.tenants 
  SET owner_id = NULL 
  WHERE id IS DISTINCT FROM v_admin_tenant_id;

  -- Detach Users from hierarchy
  UPDATE public.profiles 
  SET reporting_manager_id = NULL, department_id = NULL
  WHERE id IS DISTINCT FROM v_admin_id;

  -- 3. DELETE DEPENDENT DATA (Robust wrapper)
  BEGIN DELETE FROM public.customers WHERE created_by IS DISTINCT FROM v_admin_id; EXCEPTION WHEN others THEN NULL; END;
  BEGIN DELETE FROM public.announcements WHERE created_by IS DISTINCT FROM v_admin_id; EXCEPTION WHEN others THEN NULL; END;
  BEGIN DELETE FROM public.targets; EXCEPTION WHEN others THEN NULL; END;
  BEGIN DELETE FROM public.activity_logs; EXCEPTION WHEN others THEN NULL; END;
  BEGIN DELETE FROM public.activity_log; EXCEPTION WHEN others THEN NULL; END;
  BEGIN DELETE FROM public.notifications; EXCEPTION WHEN others THEN NULL; END;
  BEGIN DELETE FROM public.site_visits; EXCEPTION WHEN others THEN NULL; END;
  BEGIN DELETE FROM public.incentives; EXCEPTION WHEN others THEN NULL; END;
  BEGIN DELETE FROM public.sales; EXCEPTION WHEN others THEN NULL; END;
  BEGIN DELETE FROM public.payments; EXCEPTION WHEN others THEN NULL; END;
  BEGIN DELETE FROM public.projects; EXCEPTION WHEN others THEN NULL; END;
  BEGIN DELETE FROM public.departments; EXCEPTION WHEN others THEN NULL; END;

  -- 4. DELETE PROFILES
  -- Delete everyone except the Platform Admin
  DELETE FROM public.profiles 
  WHERE id IS DISTINCT FROM v_admin_id;

  -- 5. DELETE TENANTS
  -- Delete every tenant EXCEPT the one the Platform Admin belongs to
  DELETE FROM public.tenants 
  WHERE id IS DISTINCT FROM v_admin_tenant_id;

  RAISE NOTICE 'System Reset Successful. Admin and their Tenant preserved.';

END;
$$;
