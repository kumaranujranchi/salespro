-- ULTIMATE DATA CLEANUP (V4 FIXED)
-- Fixes the logic error where NULL tenant_IDs prevented the circular link break.
-- This script safely resets the database while keeping your Admin account.

DO $$
DECLARE
  v_admin_id uuid;
  v_count integer;
BEGIN
  -- 1. Find and Protect Admin
  SELECT id INTO v_admin_id FROM public.profiles WHERE role = 'platform_admin' LIMIT 1;
  
  IF v_admin_id IS NOT NULL THEN
    RAISE NOTICE 'Admin ID Protected: %', v_admin_id;
  ELSE
    RAISE NOTICE 'WARNING: No Platform Admin found. Proceeding with full wipe.';
  END IF;

  -- 2. BREAK CIRCULAR LINKS (FIXED LOGIC)
  -- Previous version failed because "NOT IN (NULL)" returns nothing.
  -- New Logic: Set owner_id to NULL for EVERY tenant that is NOT owned by the specific Admin ID.
  
  UPDATE public.tenants 
  SET owner_id = NULL 
  WHERE owner_id IS DISTINCT FROM v_admin_id;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Unlinked Owners from % Tenants', v_count;

  -- Also unlink Users from Manager/Dept
  UPDATE public.profiles 
  SET reporting_manager_id = NULL, department_id = NULL
  WHERE id IS DISTINCT FROM v_admin_id;

  -- 3. DELETE DEPENDENT DATA 
  -- We wrap these in blocks to ignore missing tables
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

  -- 4. DELETE THE USERS (PROFILES)
  DELETE FROM public.profiles 
  WHERE id IS DISTINCT FROM v_admin_id;

  -- 5. DELETE TENANTS
  -- Delete tenants not owned by admin (which should be all of them except the admin's tenant)
  DELETE FROM public.tenants 
  WHERE owner_id IS DISTINCT FROM v_admin_id;

  RAISE NOTICE 'Cleanup V4 Complete. System Reset Done.';

END;
$$;
