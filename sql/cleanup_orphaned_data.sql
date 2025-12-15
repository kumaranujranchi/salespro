-- CLEANUP ORPHANED DATA
-- This script detects and deletes data that was left behind after a failed tenant deletion.
-- It specifically targets Profiles (Users) that do not belong to any existing Tenant.

DO $$
DECLARE
  r RECORD;
  deleted_count INT := 0;
BEGIN
  RAISE NOTICE 'Starting cleanup of orphaned data...';

  -- 1. Identify Orphans (Profiles with no valid tenant)
  -- We assume any profile whose tenant_id is not in the tenants table is an orphan
  -- configured to EXCLUDE the restored admin profile's tenant if strictly needed, 
  -- but generally all valid profiles should matches a valid tenant_id.

  FOR r IN 
    SELECT id, email, full_name, tenant_id
    FROM public.profiles 
    WHERE tenant_id IS NOT NULL 
    AND tenant_id NOT IN (SELECT id FROM public.tenants)
  LOOP
    RAISE NOTICE 'Processing orphan profile: % (%)', r.email, r.id;

    -- DELETE DEPENDENCIES FOR THIS ORPHAN
    -- We use separate blocks to bypass errors if tables are missing

    -- Activity Log (Singular)
    BEGIN EXECUTE 'DELETE FROM public.activity_log WHERE user_id = $1' USING r.id; EXCEPTION WHEN others THEN NULL; END;
    -- Activity Logs (Plural)
    BEGIN EXECUTE 'DELETE FROM public.activity_logs WHERE user_id = $1' USING r.id; EXCEPTION WHEN others THEN NULL; END;
    -- Notifications
    DELETE FROM public.notifications WHERE user_id = r.id;
    -- Targets
    DELETE FROM public.targets WHERE user_id = r.id;
    -- Site Visits (Driver)
    BEGIN EXECUTE 'DELETE FROM public.site_visits WHERE driver_id = $1' USING r.id; EXCEPTION WHEN others THEN NULL; END;
    -- Site Visits (Requested By)
    DELETE FROM public.site_visits WHERE requested_by = r.id;
    -- Incentives
    DELETE FROM public.incentives WHERE sales_executive_id = r.id;
    -- Sales (Sales Exec)
    DELETE FROM public.sales WHERE sales_executive_id = r.id; 
    
    -- Finally, delete the Profile itself
    DELETE FROM public.profiles WHERE id = r.id;
    
    deleted_count := deleted_count + 1;
  END LOOP;

  RAISE NOTICE 'Cleanup complete. Deleted % orphaned profiles.', deleted_count;

  -- 2. Cleanup Orphaned Customers (No valid tenant)
  BEGIN
    DELETE FROM public.customers 
    WHERE tenant_id NOT IN (SELECT id FROM public.tenants)
    OR tenant_id IS NULL; -- careful with NULL if used for shared, but usually strict SaaS 
  EXCEPTION WHEN others THEN NULL; END;

  -- 3. Cleanup Orphaned Projects
  DELETE FROM public.projects WHERE tenant_id NOT IN (SELECT id FROM public.tenants);

  -- 4. Cleanup Orphaned Departments
  DELETE FROM public.departments WHERE tenant_id NOT IN (SELECT id FROM public.tenants);

END;
$$;
