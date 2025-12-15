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

  -- 3. EXPANDED DELETION LOGIC (To handle complex FK webs)
  
  -- INCENTIVES (Linked to Sales Execs)
  DELETE FROM public.incentives 
  WHERE sales_executive_id IN (SELECT id FROM public.profiles WHERE tenant_id = target_tenant_id);

  -- PAYMENTS (Linked to Sales)
  -- Must delete payments for ALL sales that define the tenant (by exec, customer, or project)
  DELETE FROM public.payments 
  WHERE sale_id IN (
    SELECT id FROM public.sales 
    WHERE sales_executive_id IN (SELECT id FROM public.profiles WHERE tenant_id = target_tenant_id)
    OR customer_id IN (
        SELECT id FROM public.customers 
        WHERE tenant_id = target_tenant_id 
        OR created_by IN (SELECT id FROM public.profiles WHERE tenant_id = target_tenant_id)
    )
    OR project_id IN (SELECT id FROM public.projects WHERE tenant_id = target_tenant_id)
  );

  -- SALES (The Blocker)
  -- Delete sales linked to ANY entity of the tenant (Exec, Customer, or Project)
  DELETE FROM public.sales 
  WHERE sales_executive_id IN (SELECT id FROM public.profiles WHERE tenant_id = target_tenant_id)
  OR customer_id IN (
      SELECT id FROM public.customers 
      WHERE tenant_id = target_tenant_id 
      OR created_by IN (SELECT id FROM public.profiles WHERE tenant_id = target_tenant_id)
  )
  OR project_id IN (SELECT id FROM public.projects WHERE tenant_id = target_tenant_id);

  -- SITE VISITS
  DELETE FROM public.site_visits 
  WHERE requested_by IN (SELECT id FROM public.profiles WHERE tenant_id = target_tenant_id);
  
  BEGIN
    EXECUTE 'DELETE FROM public.site_visits WHERE driver_id IN (SELECT id FROM public.profiles WHERE tenant_id = $1)' USING target_tenant_id;
  EXCEPTION 
    WHEN undefined_column THEN NULL; 
  END;

  -- TARGETS
  DELETE FROM public.targets 
  WHERE user_id IN (SELECT id FROM public.profiles WHERE tenant_id = target_tenant_id);

  -- CUSTOMERS (Now safe to delete because Sales are gone)
  DELETE FROM public.customers WHERE tenant_id = target_tenant_id;
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

  -- 4. Unlink Profiles
  UPDATE public.profiles SET department_id = NULL WHERE tenant_id = target_tenant_id;
  UPDATE public.profiles SET reporting_manager_id = NULL WHERE tenant_id = target_tenant_id;
  
  -- 5. Delete Departments
  DELETE FROM public.departments WHERE tenant_id = target_tenant_id;

  -- 6. Delete Profiles
  DELETE FROM public.profiles WHERE tenant_id = target_tenant_id;

  -- 7. Delete Tenant
  DELETE FROM public.tenants WHERE id = target_tenant_id;
  
end;
$$;
