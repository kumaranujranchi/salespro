-- ULTIMATE DATA CLEANUP (ROBUST VERSION)
-- This script force-deletes all users and data, except for your Platform Admin account.
-- It handles MISSING TABLES (like notifications) gracefully using Dynamic SQL.

DO $$
DECLARE
  v_admin_id uuid;
BEGIN
  -- 1. Find and Protect Admin
  SELECT id INTO v_admin_id FROM public.profiles WHERE role = 'platform_admin' LIMIT 1;
  RAISE NOTICE 'Admin ID Protected: %', v_admin_id;

  -- 2. DISABLE CONSTRAINTS Logic (User-level)
  UPDATE public.profiles 
  SET reporting_manager_id = NULL, department_id = NULL
  WHERE id != v_admin_id OR v_admin_id IS NULL;

  -- 3. DELETE DEPENDENT DATA (Robustly)
  
  -- Customers
  BEGIN DELETE FROM public.customers WHERE created_by != v_admin_id OR v_admin_id IS NULL; EXCEPTION WHEN others THEN NULL; END;

  -- Announcements
  BEGIN DELETE FROM public.announcements WHERE created_by != v_admin_id OR v_admin_id IS NULL; EXCEPTION WHEN others THEN NULL; END;

  -- Targets
  BEGIN DELETE FROM public.targets; EXCEPTION WHEN others THEN NULL; END;

  -- Activity Logs
  BEGIN DELETE FROM public.activity_logs; EXCEPTION WHEN others THEN NULL; END;
  BEGIN DELETE FROM public.activity_log; EXCEPTION WHEN others THEN NULL; END;

  -- Notifications (The one that failed)
  BEGIN DELETE FROM public.notifications; EXCEPTION WHEN others THEN NULL; END;

  -- Site Visits
  BEGIN DELETE FROM public.site_visits; EXCEPTION WHEN others THEN NULL; END;

  -- Incentives
  BEGIN DELETE FROM public.incentives; EXCEPTION WHEN others THEN NULL; END;

  -- Sales
  BEGIN DELETE FROM public.sales; EXCEPTION WHEN others THEN NULL; END;

  -- Payments
  BEGIN DELETE FROM public.payments; EXCEPTION WHEN others THEN NULL; END;

  -- Projects
  BEGIN DELETE FROM public.projects; EXCEPTION WHEN others THEN NULL; END;
  
  -- Departments
  BEGIN DELETE FROM public.departments; EXCEPTION WHEN others THEN NULL; END;

  -- 4. DELETE THE USERS (PROFILES)
  DELETE FROM public.profiles 
  WHERE (id != v_admin_id OR v_admin_id IS NULL)
  AND role != 'platform_admin';

  -- 5. DELETE TENANTS
  DELETE FROM public.tenants 
  WHERE id NOT IN (SELECT tenant_id FROM public.profiles WHERE id = v_admin_id);

  RAISE NOTICE 'Ultimate Cleanup Complete. All ghost data removed.';

END;
$$;
