-- Create a secure function to handle Company Registration (Tenant Creation)
-- This function is SECURITY DEFINER, meaning it runs with the privileges of the creator (postgres/admin)
-- allowing it to bypass RLS policies on the 'tenants' table which otherwise block standard users from inserting.

CREATE OR REPLACE FUNCTION public.register_tenant(company_name text, company_slug text, user_full_name text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_tenant_id uuid;
    result json;
BEGIN
    -- Check if user is authenticated (auth.uid() comes from the session calling the function)
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'User must be logged in to register a company';
    END IF;

    -- 1. Insert New Tenant
    INSERT INTO public.tenants (name, slug, subscription_status)
    VALUES (company_name, company_slug, 'trial')
    RETURNING id INTO new_tenant_id;

    -- 2. Update the User's Profile to link them to this new Tenant
    UPDATE public.profiles
    SET tenant_id = new_tenant_id,
        role = 'super_admin',
        full_name = user_full_name
    WHERE id = auth.uid();

    -- 3. Return the new tenant details
    SELECT json_build_object('id', new_tenant_id, 'name', company_name, 'slug', company_slug) INTO result;
    return result;
END;
$$;

-- Grant execution permission to authenticated users
GRANT EXECUTE ON FUNCTION public.register_tenant(text, text, text) TO authenticated;
