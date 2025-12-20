-- 1. Add referral_campaign_id to tenants table
ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS referral_campaign_id UUID REFERENCES public.referral_campaigns(id);

-- 2. Update register_tenant RPC to handle referral code
CREATE OR REPLACE FUNCTION register_tenant(
    company_name TEXT,
    company_slug TEXT,
    user_full_name TEXT,
    contact_email TEXT DEFAULT NULL,
    contact_phone TEXT DEFAULT NULL,
    referral_code TEXT DEFAULT NULL -- New parameter
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_tenant_id UUID;
    v_user_id UUID;
    v_campaign_id UUID;
    v_referrer_id UUID; -- To store the referrer
BEGIN
    -- Get current user ID
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Resolve Referral Code if provided
    IF referral_code IS NOT NULL AND referral_code <> '' THEN
        SELECT id, created_by INTO v_campaign_id, v_referrer_id
        FROM public.referral_campaigns
        WHERE code = referral_code
        AND is_active = true
        LIMIT 1;
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
        trial_ends_at,
        referral_campaign_id -- Link campaign
    )
    VALUES (
        company_name, 
        company_slug, 
        COALESCE(NULLIF(contact_email, ''), (SELECT email FROM auth.users WHERE id = v_user_id)), 
        NULLIF(contact_phone, ''), 
        v_user_id,
        'trial',
        'starter',
        NOW() + INTERVAL '14 days',
        v_campaign_id
    )
    RETURNING id INTO new_tenant_id;

    -- [NEW] Create User Referral Record if campaign exists
    IF v_campaign_id IS NOT NULL AND v_referrer_id IS NOT NULL THEN
        INSERT INTO public.user_referrals (
            campaign_id,
            referrer_id,
            referred_tenant_id,
            status
        ) VALUES (
            v_campaign_id,
            v_referrer_id,
            new_tenant_id,
            'pending' -- Starts as pending/trial
        );
    END IF;

    -- [EXTRA] Backfill existing tenants that have missing contact info
    UPDATE tenants t
    SET contact_email = p.email
    FROM profiles p
    WHERE t.owner_id = p.id
    AND (t.contact_email IS NULL OR t.contact_email = '');

    -- 2. Update Profile with tenant_id and role
    UPDATE profiles
    SET 
        tenant_id = new_tenant_id,
        full_name = user_full_name,
        role = 'super_admin'
    WHERE id = v_user_id;

END;
$$;
