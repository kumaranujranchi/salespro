create or replace function admin_delete_tenant(target_tenant_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  caller_role text;
begin
  -- 1. Check if the calling user is a platform_admin
  select role into caller_role
  from public.profiles
  where id = auth.uid();

  if caller_role != 'platform_admin' then
    raise exception 'Unauthorized: Only Platform Admins can delete tenants.';
  end if;

  -- 2. Break Circular Links
  update public.tenants set owner_id = null where id = target_tenant_id;

  -- 3. EXPANDED DELETION LOGIC with SINGULAR/PLURAL TABLE SAFETY
  
  -- INCENTIVES
  BEGIN
    EXECUTE 'DELETE FROM public.incentives WHERE sales_executive_id IN (SELECT id FROM public.profiles WHERE tenant_id = $1)' USING target_tenant_id;
  EXCEPTION WHEN undefined_table THEN NULL; END;

  -- PAYMENTS
  BEGIN
    EXECUTE 'DELETE FROM public.payments WHERE sale_id IN (SELECT id FROM public.sales WHERE sales_executive_id IN (SELECT id FROM public.profiles WHERE tenant_id = $1))' USING target_tenant_id;
  EXCEPTION WHEN undefined_table THEN NULL; END;

  -- SALES 
  BEGIN
    EXECUTE 'DELETE FROM public.sales WHERE sales_executive_id IN (SELECT id FROM public.profiles WHERE tenant_id = $1) OR customer_id IN (SELECT id FROM public.customers WHERE tenant_id = $1 OR created_by IN (SELECT id FROM public.profiles WHERE tenant_id = $1)) OR project_id IN (SELECT id FROM public.projects WHERE tenant_id = $1)' USING target_tenant_id;
  EXCEPTION WHEN undefined_table THEN NULL; END;

  -- SITE VISITS
  BEGIN
    EXECUTE 'DELETE FROM public.site_visits WHERE requested_by IN (SELECT id FROM public.profiles WHERE tenant_id = $1)' USING target_tenant_id;
  EXCEPTION WHEN undefined_table THEN NULL; END;
  
  BEGIN
    EXECUTE 'DELETE FROM public.site_visits WHERE driver_id IN (SELECT id FROM public.profiles WHERE tenant_id = $1)' USING target_tenant_id;
  EXCEPTION WHEN undefined_table THEN NULL; WHEN undefined_column THEN NULL; END;

  -- TARGETS
  BEGIN
    EXECUTE 'DELETE FROM public.targets WHERE user_id IN (SELECT id FROM public.profiles WHERE tenant_id = $1)' USING target_tenant_id;
  EXCEPTION WHEN undefined_table THEN NULL; END;

  -- CUSTOMERS
  BEGIN
    EXECUTE 'DELETE FROM public.customers WHERE tenant_id = $1' USING target_tenant_id;
  EXCEPTION WHEN undefined_table THEN NULL; END;
  
  BEGIN
    EXECUTE 'DELETE FROM public.customers WHERE created_by IN (SELECT id FROM public.profiles WHERE tenant_id = $1)' USING target_tenant_id;
  EXCEPTION WHEN undefined_table THEN NULL; END;

  -- PROJECTS
  BEGIN
    EXECUTE 'DELETE FROM public.projects WHERE tenant_id = $1' USING target_tenant_id;
  EXCEPTION WHEN undefined_table THEN NULL; END;

  -- ANNOUNCEMENTS
  BEGIN
    EXECUTE 'DELETE FROM public.announcements WHERE tenant_id = $1' USING target_tenant_id;
  EXCEPTION WHEN undefined_table THEN NULL; END;

  -- ACTIVITY LOGS (PLURAL)
  BEGIN
    EXECUTE 'DELETE FROM public.activity_logs WHERE tenant_id = $1' USING target_tenant_id;
  EXCEPTION WHEN undefined_table THEN NULL; END;
  
  -- ACTIVITY LOG (SINGULAR) - The likely culprit
  -- Attempt to delete by tenant_id if column exists
  BEGIN 
    EXECUTE 'DELETE FROM public.activity_log WHERE tenant_id = $1' USING target_tenant_id; 
  EXCEPTION WHEN others THEN NULL; END; -- might fail if tenant_id column missing
  
  -- Attempt to delete by user_id (since error mentioned activity_log_user_id_fkey)
  BEGIN 
    EXECUTE 'DELETE FROM public.activity_log WHERE user_id IN (SELECT id FROM public.profiles WHERE tenant_id = $1)' USING target_tenant_id; 
  EXCEPTION WHEN others THEN NULL; END;

  -- NOTIFICATIONS
  BEGIN
    EXECUTE 'DELETE FROM public.notifications WHERE user_id IN (SELECT id FROM public.profiles WHERE tenant_id = $1)' USING target_tenant_id;
  EXCEPTION WHEN undefined_table THEN NULL; END;

  -- 4. Unlink Profiles
  UPDATE public.profiles SET department_id = NULL WHERE tenant_id = target_tenant_id;
  UPDATE public.profiles SET reporting_manager_id = NULL WHERE tenant_id = target_tenant_id;
  
  -- 5. Delete Departments
  BEGIN
    EXECUTE 'DELETE FROM public.departments WHERE tenant_id = $1' USING target_tenant_id;
  EXCEPTION WHEN undefined_table THEN NULL; END;

  -- 6. Delete Profiles (Users)
  DELETE FROM public.profiles WHERE tenant_id = target_tenant_id;

  -- 7. Delete Tenant
  DELETE FROM public.tenants WHERE id = target_tenant_id;
  
end;
$$;
