-- Function to handle new user creation automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    employee_id,
    role,
    department_id,
    reporting_manager_id,
    image_url,
    phone,
    is_active,
    force_password_change
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    -- We assume employee_id is passed in metadata. If not, we generate a temporary one to avoid constraint error, 
    -- but ideally this should be provided.
    COALESCE(new.raw_user_meta_data->>'employee_id', 'TEMP_' || floor(extract(epoch from now()))::text),
    COALESCE(new.raw_user_meta_data->>'role', 'sales_executive'),
    CASE 
      WHEN new.raw_user_meta_data->>'department_id' = '' THEN NULL 
      ELSE (new.raw_user_meta_data->>'department_id')::uuid 
    END,
    CASE 
      WHEN new.raw_user_meta_data->>'reporting_manager_id' = '' THEN NULL 
      ELSE (new.raw_user_meta_data->>'reporting_manager_id')::uuid 
    END,
    new.raw_user_meta_data->>'imageUrl', -- Note: frontend keys
    new.raw_user_meta_data->>'phone',
    true,
    true
  );
  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    -- If profile creation fails, we should ideally fail the auth creation too, 
    -- but triggers on AFTER INSERT might not rollback the transaction in all auth setups easily.
    -- However, raising exception here DOES abort the transaction for the user creation in Supabase Auth usually.
    RAISE EXCEPTION 'Failed to create user profile: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if trigger exists before creating to avoid errors in idempotent runs
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
