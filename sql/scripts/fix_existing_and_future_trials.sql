-- 1. Update register_tenant RPC to ensure 30 days for FUTURE signups
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

    -- 1. Create Tenant (30 Days Trial)
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
        NOW() + INTERVAL '30 days' -- Ensure 30 days
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

-- 2. FIX EXISTING TENANTS that were created with 14-day trials
-- This updates any trial tenant where the trial period is less than 20 days (catching the 14-day ones)
UPDATE tenants
SET trial_ends_at = created_at + INTERVAL '30 days'
WHERE subscription_status = 'trial'
AND trial_ends_at < (created_at + INTERVAL '20 days');
