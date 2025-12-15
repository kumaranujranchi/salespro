-- FORCE CLEANUP ALL DATA EXCEPT PLATFORM ADMIN
-- This script wipes all business data and users, leaving only the Platform Admin.
-- Use this to fix the "stuck" profiles issue.

DO $$
DECLARE
  v_admin_id uuid;
BEGIN
  -- 1. Identify the Platform Admin ID (to protect it)
  SELECT id INTO v_admin_id FROM public.profiles WHERE role = 'platform_admin' LIMIT 1;
  
  IF v_admin_id IS NOT NULL THEN
    RAISE NOTICE 'Preserving Admin ID: %', v_admin_id;
  ELSE
    RAISE NOTICE 'No Platform Admin found. Proceeding with full wipe.';
  END IF;

  -- 2. DELETE ALL BUSINESS DATA (Order is important)
  
  -- Delete all Incentives
  DELETE FROM public.incentives;
  
  -- Delete all Payments
  DELETE FROM public.payments;
  
  -- Delete all Sales
  DELETE FROM public.sales;
  
  -- Delete all Site Visits
  DELETE FROM public.site_visits;
  
  -- Delete all Targets
  DELETE FROM public.targets;
  
  -- Delete all Customers
  DELETE FROM public.customers;
  
  -- Delete all Projects
  DELETE FROM public.projects;
  
  -- Delete all Announcements
  DELETE FROM public.announcements;
  
  -- Delete Activity Logs (Singular and Plural)
  DELETE FROM public.activity_logs;
  BEGIN DELETE FROM public.activity_log; EXCEPTION WHEN others THEN NULL; END;
  
  -- Delete Notifications
  DELETE FROM public.notifications;

  -- 3. UNLINK PROFILES from Departments/Managers
  -- (This prevents FK errors when we try to delete them)
  UPDATE public.profiles 
  SET department_id = NULL, reporting_manager_id = NULL
  WHERE id != v_admin_id OR v_admin_id IS NULL;

  -- 4. DELETE DEPARTMENTS
  DELETE FROM public.departments;

  -- 5. DELETE PROFILES (Except Admin)
  DELETE FROM public.profiles 
  WHERE (id != v_admin_id OR v_admin_id IS NULL)
  AND role != 'platform_admin';

  -- 6. DELETE TENANTS (Except Admin Tenant if you want to keep it, but usually safe to wipe if empty)
  -- If you want to keep the tenant matching the admin:
  DELETE FROM public.tenants 
  WHERE id NOT IN (SELECT tenant_id FROM public.profiles WHERE id = v_admin_id);

  RAISE NOTICE 'System cleaned successfully. Stuck profiles should be gone.';

END;
$$;
