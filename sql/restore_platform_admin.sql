-- RESTORE PLATFORM ADMIN ACCESS
-- Run this script to re-create the Platform Admin account if it was accidentally deleted.

DO $$
DECLARE
  v_user_id uuid;
  v_tenant_id uuid;
BEGIN
  -- 1. Get the Auth ID for the admin email
  -- (This only works if the user still exists in Supabase Auth / 'Authentication' tab)
  SELECT id INTO v_user_id 
  FROM auth.users 
  WHERE email = 'admin@salespro.com';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User admin@salespro.com not found in Authentication. Please Sign Up again from the login page.';
  END IF;

  -- 2. Ensure an Admin Tenant exists
  -- check by name or slug
  SELECT id INTO v_tenant_id FROM public.tenants WHERE slug = 'platform-admin';
  
  IF v_tenant_id IS NULL THEN
    INSERT INTO public.tenants (name, slug, subscription_status, is_active, created_at, updated_at)
    VALUES ('SalesPro Platform', 'platform-admin', 'active', true, now(), now())
    RETURNING id INTO v_tenant_id;
    RAISE NOTICE 'Created new Admin Tenant.';
  ELSE
    RAISE NOTICE 'Found existing Admin Tenant.';
  END IF;

  -- 3. Restore/Fix the Profile
  -- We use ON CONFLICT to update if it exists but has wrong role/tenant
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    role, 
    tenant_id, 
    is_active, 
    employee_id, -- Providing a dummy ID in case it's required
    created_at, 
    updated_at
  )
  VALUES (
    v_user_id, 
    'admin@salespro.com', 
    'Platform Super Admin', 
    'platform_admin', 
    v_tenant_id, 
    true, 
    'ADMIN-001',
    now(), 
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    role = 'platform_admin',
    tenant_id = v_tenant_id,
    is_active = true,
    updated_at = now();

  RAISE NOTICE 'Platform Admin permissions restored successfully for admin@salespro.com';
  
END;
$$;
