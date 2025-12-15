-- EMERGENCY RESTORE PLATFORM ADMIN (V2)
-- Since the user was deleted, we must recreate the Profile and link it to the Auth User.

DO $$
DECLARE
  v_user_id uuid;
  v_tenant_id uuid;
BEGIN
  -- 1. Find the Auth User ID for 'admin@salespro.com'
  SELECT id INTO v_user_id 
  FROM auth.users 
  WHERE email = 'admin@salespro.com';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'CRITICAL: Auth user admin@salespro.com not found. Use "Sign Up" page to create it first.';
  END IF;

  -- 2. Create/Get the Admin Tenant
  -- Since we wiped tenants, we likely need to recreate this.
  SELECT id INTO v_tenant_id FROM public.tenants WHERE slug = 'platform-admin';
  
  IF v_tenant_id IS NULL THEN
    INSERT INTO public.tenants (name, slug, subscription_status, is_active, created_at, updated_at)
    VALUES ('SalesPro Platform', 'platform-admin', 'active', true, now(), now())
    RETURNING id INTO v_tenant_id;
    RAISE NOTICE 'Re-created Admin Tenant.';
  END IF;

  -- 3. Re-create the Platform Admin Profile
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    role, 
    tenant_id, 
    is_active, 
    employee_id, 
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
    is_active = true;

  -- 4. Set Owner Link (to complete the circle)
  UPDATE public.tenants SET owner_id = v_user_id WHERE id = v_tenant_id;

  RAISE NOTICE 'Platform Admin RESTORED. You can log in now.';

END;
$$;
