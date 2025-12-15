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

  -- 3. Delete Business Data (Explicit Order & Logic)
  
  -- INCENTIVES (Links to Sales Ex & Sales)
  DELETE FROM public.incentives 
  WHERE sales_executive_id IN (SELECT id FROM public.profiles WHERE tenant_id = target_tenant_id);

  -- PAYMENTS (Links to Sales)
  DELETE FROM public.payments 
  WHERE sale_id IN (
    SELECT id FROM public.sales WHERE sales_executive_id IN (SELECT id FROM public.profiles WHERE tenant_id = target_tenant_id)
  );

  -- SALES (Links to Customers & Sales Ex & Projects)
  -- Important: Delete Sales before Customers/Projects/Profiles
  DELETE FROM public.sales 
  WHERE sales_executive_id IN (SELECT id FROM public.profiles WHERE tenant_id = target_tenant_id);

  -- SITE VISITS (Links to Customers & Drivers)
  -- Important: Delete Site Visits before Customers/Profiles
  DELETE FROM public.site_visits 
  WHERE requested_by IN (SELECT id FROM public.profiles WHERE tenant_id = target_tenant_id);
  
  -- Handle orphaned site visits where driver belongs to tenant
  DELETE FROM public.site_visits 
  WHERE driver_id IN (SELECT id FROM public.profiles WHERE tenant_id = target_tenant_id);

  -- TARGETS (Links to Profiles)
  DELETE FROM public.targets 
  WHERE user_id IN (SELECT id FROM public.profiles WHERE tenant_id = target_tenant_id);

  -- CUSTOMERS (Links to Profiles (created_by) & Tenant)
  -- Delete customers belonging to the tenant
  DELETE FROM public.customers WHERE tenant_id = target_tenant_id;
  -- Delete orphaned customers created by users of this tenant
  DELETE FROM public.customers 
  WHERE created_by IN (SELECT id FROM public.profiles WHERE tenant_id = target_tenant_id);

  -- PROJECTS (Links to Tenant)
  DELETE FROM public.projects WHERE tenant_id = target_tenant_id;

  -- ANNOUNCEMENTS (Links to Tenant)
  DELETE FROM public.announcements WHERE tenant_id = target_tenant_id;

  -- ACTIVITY LOGS (Links to Tenant)
  DELETE FROM public.activity_logs WHERE tenant_id = target_tenant_id;
  
  -- NOTIFICATIONS (Links to Profiles)
  DELETE FROM public.notifications 
  WHERE user_id IN (SELECT id FROM public.profiles WHERE tenant_id = target_tenant_id);

  -- 4. Unlink Structure-Related Fields in Profiles
  -- We unlink these first to prevent self-referential FK errors when deleting profiles.
  
  -- Unlink Departments
  UPDATE public.profiles SET department_id = NULL WHERE tenant_id = target_tenant_id;
  
  -- Unlink Reporting Managers (Fixes 'profiles_reporting_manager_id_fkey')
  UPDATE public.profiles SET reporting_manager_id = NULL WHERE tenant_id = target_tenant_id;

  -- 5. Delete Departments (Links to Tenant)
  DELETE FROM public.departments WHERE tenant_id = target_tenant_id;

  -- 6. Delete Profiles (Users) - KEY STEP
  -- Now that customers, sales, site visits, notifications, targets, and internal links are gone, this should succeed.
  DELETE FROM public.profiles WHERE tenant_id = target_tenant_id;

  -- 7. Delete the Tenant itself
  DELETE FROM public.tenants WHERE id = target_tenant_id;
  
end;
$$;
