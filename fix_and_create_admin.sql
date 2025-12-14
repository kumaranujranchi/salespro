-- Fix missing column and Create Admin
-- 1. Add missing column required by the trigger
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS force_password_change boolean DEFAULT false;

-- 2. Create Admin User
-- Email: admin@salespro.com
-- Password: Anuj@2025
-- Role: super_admin

-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Check if user already exists
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'admin@salespro.com';

  -- If user doesn't exist, create it
  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();
    
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'admin@salespro.com',
      crypt('Anuj@2025', gen_salt('bf')),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"System Admin","role":"super_admin"}',
      now(),
      now()
    );
  END IF;

  -- Ensure the profile exists and has super_admin role
  -- Using INSERT ... ON CONFLICT just in case the trigger worked partly or not at all
  INSERT INTO public.profiles (id, email, full_name, employee_id, role, is_active, force_password_change)
  VALUES (
    v_user_id,
    'admin@salespro.com',
    'System Admin',
    'ADMIN_001',
    'super_admin',
    true,
    false
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    role = 'super_admin',
    is_active = true;

END $$;
