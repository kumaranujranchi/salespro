-- Function to get user email from auth.users
-- This is needed because profiles table might not have all users

CREATE OR REPLACE FUNCTION get_user_email_by_id(user_id UUID)
RETURNS TABLE (email TEXT, full_name TEXT) 
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  -- First try to get from profiles table
  RETURN QUERY
  SELECT p.email::TEXT, p.full_name::TEXT
  FROM public.profiles p
  WHERE p.id = user_id
  LIMIT 1;
  
  -- If no result from profiles, get from auth.users
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT au.email::TEXT, 
           COALESCE(au.raw_user_meta_data->>'full_name', au.email)::TEXT as full_name
    FROM auth.users au
    WHERE au.id = user_id
    LIMIT 1;
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_email_by_id(UUID) TO authenticated;
