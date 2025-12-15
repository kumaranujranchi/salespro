-- ULTIMATE DATA CLEANUP
-- This script force-deletes all users and data, except for your Platform Admin account.
-- It explicitly handles the "Created By" constraints (Customers) which usually block deletion.

DO $$
DECLARE
  v_admin_id uuid;
  r RECORD;
BEGIN
  -- 1. Find and Protect Admin
  SELECT id INTO v_admin_id FROM public.profiles WHERE role = 'platform_admin' LIMIT 1;
  RAISE NOTICE 'Admin ID Protected: %', v_admin_id;

  -- 2. DISABLE CONSTRAINTS Logic (User-level) by unlinking everything first
  
  -- Unlink all users from Managers and Departments
  UPDATE public.profiles 
  SET reporting_manager_id = NULL, department_id = NULL
  WHERE id != v_admin_id OR v_admin_id IS NULL;

  -- 3. DELETE DEPENDENT DATA (created_by links)
  
  -- Delete CUSTOMERS created by anyone other than Admin
  DELETE FROM public.customers 
  WHERE created_by != v_admin_id OR v_admin_id IS NULL;

  -- Delete ANNOUNCEMENTS created by anyone other than Admin
  DELETE FROM public.announcements 
  WHERE created_by != v_admin_id OR v_admin_id IS NULL;

  -- Delete TARGETS
  DELETE FROM public.targets;

  -- Delete ACTIVITY LOGS (Try both table names)
  BEGIN DELETE FROM public.activity_logs; EXCEPTION WHEN others THEN NULL; END;
  BEGIN DELETE FROM public.activity_log; EXCEPTION WHEN others THEN NULL; END;

  -- Delete NOTIFICATIONS
  DELETE FROM public.notifications;

  -- Delete SITE VISITS
  DELETE FROM public.site_visits;

  -- Delete INCENTIVES
  DELETE FROM public.incentives;

  -- Delete SALES
  DELETE FROM public.sales;

  -- Delete PAYMENTS
  DELETE FROM public.payments;

  -- Delete PROJECTS
  DELETE FROM public.projects;
  
  -- Delete DEPARTMENTS
  DELETE FROM public.departments;

  -- 4. DELETE THE USERS (PROFILES)
  -- Now that customers/sales/logs are gone, nothing should block this.
  DELETE FROM public.profiles 
  WHERE (id != v_admin_id OR v_admin_id IS NULL)
  AND role != 'platform_admin';

  -- 5. DELETE TENANTS (Optional: keeping admin tenant)
  DELETE FROM public.tenants 
  WHERE id NOT IN (SELECT tenant_id FROM public.profiles WHERE id = v_admin_id);

  RAISE NOTICE 'Ultimate Cleanup Complete. All ghost data removed.';

END;
$$;
