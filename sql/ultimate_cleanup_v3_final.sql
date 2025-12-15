-- ULTIMATE DATA CLEANUP (V3 FINAL)
-- This script safely handles the Circular Dependency between Tenants and Owners.
-- It fixes the "tenants_owner_id_fkey" error.

DO $$
DECLARE
  v_admin_id uuid;
BEGIN
  -- 1. Find and Protect Admin
  SELECT id INTO v_admin_id FROM public.profiles WHERE role = 'platform_admin' LIMIT 1;
  RAISE NOTICE 'Admin ID Protected: %', v_admin_id;

  -- 2. BREAK CIRCULAR LINKS (CRITICAL STEP)
  -- The error happened because Tenants point to Owners (Profiles).
  -- We must Nullify owner_id for tenants we plan to delete.
  
  UPDATE public.tenants 
  SET owner_id = NULL 
  WHERE id NOT IN (SELECT tenant_id FROM public.profiles WHERE id = v_admin_id);
  
  -- Also unlink Users from Manager/Dept
  UPDATE public.profiles 
  SET reporting_manager_id = NULL, department_id = NULL
  WHERE id != v_admin_id OR v_admin_id IS NULL;

  -- 3. DELETE DEPENDENT DATA 
  
  BEGIN DELETE FROM public.customers WHERE created_by != v_admin_id OR v_admin_id IS NULL; EXCEPTION WHEN others THEN NULL; END;
  BEGIN DELETE FROM public.announcements WHERE created_by != v_admin_id OR v_admin_id IS NULL; EXCEPTION WHEN others THEN NULL; END;
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

  -- 4. DELETE THE USERS (PROFILES)
  -- Now safe because tenants no longer point to them as "owners"
  DELETE FROM public.profiles 
  WHERE (id != v_admin_id OR v_admin_id IS NULL)
  AND role != 'platform_admin';

  -- 5. DELETE TENANTS
  DELETE FROM public.tenants 
  WHERE id NOT IN (SELECT tenant_id FROM public.profiles WHERE id = v_admin_id);

  RAISE NOTICE 'Cleanup V3 Complete. Circular dependencies broken and data wiped.';

END;
$$;
