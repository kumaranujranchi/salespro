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

  -- 3. Delete Business Data using Dynamic SQL
  
  -- Incentives (Linked to Sales Exec)
  BEGIN EXECUTE 'DELETE FROM public.incentives WHERE sales_executive_id IN (SELECT id FROM public.profiles WHERE tenant_id = $1)' USING target_tenant_id; EXCEPTION WHEN others THEN NULL; END;
  
  -- Payments (Linked to Sale -> Sales Exec)
  BEGIN EXECUTE 'DELETE FROM public.payments WHERE sale_id IN (SELECT id FROM public.sales WHERE sales_executive_id IN (SELECT id FROM public.profiles WHERE tenant_id = $1))' USING target_tenant_id; EXCEPTION WHEN others THEN NULL; END;

  -- Sales (Linked to Sales Exec)
  BEGIN EXECUTE 'DELETE FROM public.sales WHERE sales_executive_id IN (SELECT id FROM public.profiles WHERE tenant_id = $1)' USING target_tenant_id; EXCEPTION WHEN others THEN NULL; END;

  -- Site Visits (Request/Driver)
  BEGIN EXECUTE 'DELETE FROM public.site_visits WHERE requested_by IN (SELECT id FROM public.profiles WHERE tenant_id = $1)' USING target_tenant_id; EXCEPTION WHEN others THEN NULL; END;
  BEGIN EXECUTE 'DELETE FROM public.site_visits WHERE driver_id IN (SELECT id FROM public.profiles WHERE tenant_id = $1)' USING target_tenant_id; EXCEPTION WHEN others THEN NULL; END;

  -- Targets (Linked to User)
  BEGIN EXECUTE 'DELETE FROM public.targets WHERE user_id IN (SELECT id FROM public.profiles WHERE tenant_id = $1)' USING target_tenant_id; EXCEPTION WHEN others THEN NULL; END;

  -- Projects (Direct link)
  BEGIN EXECUTE 'DELETE FROM public.projects WHERE tenant_id = $1' USING target_tenant_id; EXCEPTION WHEN others THEN NULL; END;

  -- Customers (Direct + Orphaned by created_by)
  BEGIN EXECUTE 'DELETE FROM public.customers WHERE tenant_id = $1' USING target_tenant_id; EXCEPTION WHEN others THEN NULL; END;
  BEGIN EXECUTE 'DELETE FROM public.customers WHERE created_by IN (SELECT id FROM public.profiles WHERE tenant_id = $1)' USING target_tenant_id; EXCEPTION WHEN others THEN NULL; END;

  -- Announcements
  BEGIN EXECUTE 'DELETE FROM public.announcements WHERE tenant_id = $1' USING target_tenant_id; EXCEPTION WHEN others THEN NULL; END;

  -- Activity Logs
  BEGIN EXECUTE 'DELETE FROM public.activity_logs WHERE tenant_id = $1' USING target_tenant_id; EXCEPTION WHEN others THEN NULL; END;
  
  -- Notifications
  BEGIN EXECUTE 'DELETE FROM public.notifications WHERE user_id IN (SELECT id FROM public.profiles WHERE tenant_id = $1)' USING target_tenant_id; EXCEPTION WHEN others THEN NULL; END;

  -- 4. Unlink structure-related fields
  -- Unlink Departments
  UPDATE public.profiles SET department_id = NULL WHERE tenant_id = target_tenant_id;
  -- Unlink Reporting Managers (Fixes profiles_reporting_manager_id_fkey)
  UPDATE public.profiles SET reporting_manager_id = NULL WHERE tenant_id = target_tenant_id;
  
  BEGIN EXECUTE 'DELETE FROM public.departments WHERE tenant_id = $1' USING target_tenant_id; EXCEPTION WHEN others THEN NULL; END;

  -- 5. Delete Profiles (Users)
  DELETE FROM public.profiles WHERE tenant_id = target_tenant_id;

  -- 6. Delete the Tenant itself
  DELETE FROM public.tenants WHERE id = target_tenant_id;
  
end;
$$;
