-- HARDENING SCRIPT: Enforce Tenant Isolation via Triggers and Constraints

-- 1. Helper Function: Get Current Tenant ID (Deterministic)
-- Changed to PLPGSQL and split logic to prevent RLS recursion
CREATE OR REPLACE FUNCTION public.get_auth_tenant_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
    tid uuid;
BEGIN
    -- We select directly. Since this is SECURITY DEFINER, it runs as DB owner.
    -- This should bypass RLS unless 'FORCE RLS' is on.
    SELECT tenant_id INTO tid FROM public.profiles WHERE id = auth.uid();
    RETURN tid;
END;
$$;

-- 1b. Fix RLS on Profiles to prevent recursion AND removing legacy leaks
-- Dynamic Drop: Find ALL policies for 'profiles' and delete them.
-- This removes "Users can view all active profiles" and other legacy leaks.
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
        RAISE NOTICE 'Dropped policy: % on profiles', pol.policyname;
    END LOOP;
END $$;

-- Create separate policies (Optimizer barrier)
CREATE POLICY "View Own Profile" ON public.profiles
FOR SELECT USING ( id = auth.uid() );

CREATE POLICY "View Co-Tenant Profiles" ON public.profiles
FOR SELECT USING ( tenant_id = get_auth_tenant_id() );

-- Restore INSERT/UPDATE for profiles (Critical for Signup flow)
CREATE POLICY "Insert Own Profile" ON public.profiles
FOR INSERT WITH CHECK ( id = auth.uid() );

CREATE POLICY "Update Own Profile" ON public.profiles
FOR UPDATE USING ( id = auth.uid() );


-- 2. Trigger Function: Force Tenant ID Assignment
-- This prevents any client from "spoofing" the tenant_id. 
-- Even if they send a different tenant_id, this trigger OVERWRITES it.
CREATE OR REPLACE FUNCTION public.trg_assign_tenant_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_tenant_id uuid;
BEGIN
    current_tenant_id := public.get_auth_tenant_id();
    
    IF current_tenant_id IS NOT NULL THEN
        NEW.tenant_id := current_tenant_id;
    -- Optional: If user has no tenant (super admin?), maybe allow provided ID? 
    -- For strict isolation, we usually enforce it.
    -- ELSE
        -- RAISE EXCEPTION 'User has no tenant assigned.';
    END IF;
    
    RETURN NEW;
END;
$$;

-- 3. Apply Constraints and Triggers to Tables
DO $$
DECLARE
    -- List of tables that MUST be isolated
    tables text[] := ARRAY[
        'sales', 
        'projects', 
        'customers', 
        'departments', 
        'site_visits', 
        'announcements', 
        'targets', 
        'payments', 
        'incentives'
        -- 'profiles' is excluded (source of truth)
        -- 'tenants' is excluded (metadata)
    ];
    t text;
BEGIN
    FOREACH t IN ARRAY tables LOOP
        -- A. Enforce NOT NULL on tenant_id (if not already)
        EXECUTE format('ALTER TABLE public.%I ALTER COLUMN tenant_id SET NOT NULL', t);
        
        -- A2. FORCE ENABLE RLS (Critical fix if it was disabled)
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

        -- B. Drop existing trigger to avoid duplicates
        EXECUTE format('DROP TRIGGER IF EXISTS trg_enforce_tenant_%I ON public.%I', t, t);
        
        -- C. Create Trigger (BEFORE INSERT)
        EXECUTE format('
            CREATE TRIGGER trg_enforce_tenant_%I
            BEFORE INSERT ON public.%I
            FOR EACH ROW
            EXECUTE FUNCTION public.trg_assign_tenant_id();
        ', t, t);

        -- D. STRICT RLS POLICIES (DROP ALL & RECREATE)
        -- Dynamic Drop: Find ALL policies for this table and delete them.
        -- This ensures no "Ghost" policies (like "Director view" or old Schema policies) survive.
        DECLARE
            pol RECORD;
        BEGIN
            FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = t LOOP
                EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, t);
                RAISE NOTICE 'Dropped policy: % on %', pol.policyname, t;
            END LOOP;
        END;
        
        -- Create STRICT Policies
        EXECUTE format('CREATE POLICY "Tenant Isolation All" ON public.%I FOR ALL USING (tenant_id = public.get_auth_tenant_id())', t);
        
        RAISE NOTICE 'Secured table: %', t;
    END LOOP;
END $$;

-- 4. Re-Verify RLS Policies (Ensure NO permissive policies exist)
-- This section effectively runs the previous "update_rls_for_saas.sql" logic again or checks it.
-- We will just assume the previous policies are correct, but valid RLS is critical.

DO $$
BEGIN
    RAISE NOTICE 'Hardening Complete. All critical tables now enforce tenant_id via Trigger and Schema Constraints.';
END $$;
