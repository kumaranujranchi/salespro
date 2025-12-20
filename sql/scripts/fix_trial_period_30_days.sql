-- Fix Trial Period to 30 Days (was 14 days)
CREATE OR REPLACE FUNCTION register_tenant(
    company_name TEXT,
    company_slug TEXT,
    user_full_name TEXT,
    contact_email TEXT DEFAULT NULL,
    contact_phone TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_tenant_id UUID;
    v_user_id UUID;
BEGIN
    -- Get current user ID
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- 1. Create Tenant
    INSERT INTO tenants (
        name, 
        slug, 
        contact_email, 
        contact_phone, 
        owner_id,
        subscription_status,
        plan_tier,
        trial_ends_at
    )
    VALUES (
        company_name, 
        company_slug, 
        COALESCE(NULLIF(contact_email, ''), (SELECT email FROM auth.users WHERE id = v_user_id)), 
        NULLIF(contact_phone, ''), 
        v_user_id,
        'trial',
        'starter',
        NOW() + INTERVAL '30 days' -- UPDATED to 30 days
    )
    RETURNING id INTO new_tenant_id;

    -- 2. Update Profile with tenant_id and role
    UPDATE profiles
    SET 
        tenant_id = new_tenant_id,
        full_name = user_full_name,
        role = 'super_admin'
    WHERE id = v_user_id;

END;
$$;
