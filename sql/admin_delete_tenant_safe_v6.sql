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

  -- 2. Break Circular Links (Tenant -> Owner)
  update public.tenants 
  set owner_id = null 
  where id = target_tenant_id;

  -- 3. Delete Business Data
  -- We use dynamic SQL for optional columns (like driver_id) to avoid compilation errors if they are missing.

  -- INCENTIVES
  DELETE FROM public.incentives 
  WHERE sales_executive_id IN (SELECT id FROM public.profiles WHERE tenant_id = target_tenant_id);

  -- PAYMENTS
  DELETE FROM public.payments 
  WHERE sale_id IN (
    SELECT id FROM public.sales WHERE sales_executive_id IN (SELECT id FROM public.profiles WHERE tenant_id = target_tenant_id)
  );

  -- SALES
  DELETE FROM public.sales 
  WHERE sales_executive_id IN (SELECT id FROM public.profiles WHERE tenant_id = target_tenant_id);

  -- SITE VISITS
  -- Delete by requested_by (standard field)
  DELETE FROM public.site_visits 
  WHERE requested_by IN (SELECT id FROM public.profiles WHERE tenant_id = target_tenant_id);
  
  -- Delete by driver_id (Optional field - handle missing column safely)
  BEGIN
    EXECUTE 'DELETE FROM public.site_visits WHERE driver_id IN (SELECT id FROM public.profiles WHERE tenant_id = $1)' USING target_tenant_id;
  EXCEPTION 
    WHEN undefined_column THEN NULL; -- Output nothing if column missing
  END;

  -- TARGETS
  DELETE FROM public.targets 
  WHERE user_id IN (SELECT id FROM public.profiles WHERE tenant_id = target_tenant_id);

  -- CUSTOMERS
  -- 1. By Tenant
  DELETE FROM public.customers WHERE tenant_id = target_tenant_id;
  -- 2. By Creator (Orphaned)
  DELETE FROM public.customers 
  WHERE created_by IN (SELECT id FROM public.profiles WHERE tenant_id = target_tenant_id);

  -- PROJECTS
  DELETE FROM public.projects WHERE tenant_id = target_tenant_id;

  -- ANNOUNCEMENTS
  DELETE FROM public.announcements WHERE tenant_id = target_tenant_id;

  -- ACTIVITY LOGS
  DELETE FROM public.activity_logs WHERE tenant_id = target_tenant_id;
  
  -- NOTIFICATIONS
  DELETE FROM public.notifications 
  WHERE user_id IN (SELECT id FROM public.profiles WHERE tenant_id = target_tenant_id);

  -- 4. Unlink Structure-Related Fields in Profiles
  UPDATE public.profiles SET department_id = NULL WHERE tenant_id = target_tenant_id;
  UPDATE public.profiles SET reporting_manager_id = NULL WHERE tenant_id = target_tenant_id;
  
  -- 5. Delete Departments
  DELETE FROM public.departments WHERE tenant_id = target_tenant_id;

  -- 6. Delete Profiles (Users)
  DELETE FROM public.profiles WHERE tenant_id = target_tenant_id;

  -- 7. Delete the Tenant itself
  DELETE FROM public.tenants WHERE id = target_tenant_id;
  
end;
$$;
