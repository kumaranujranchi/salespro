-- Phase 2: RLS Policies for SaaS Isolation

-- 1. Helper Function to get current user's Tenant ID safely
-- SECURITY DEFINER is critical here to avoid infinite recursion when querying profiles table
CREATE OR REPLACE FUNCTION public.get_auth_tenant_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT tenant_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- 2. Enable RLS on all tables (Safety Check)
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incentives ENABLE ROW LEVEL SECURITY;
-- Profiles already enabled, but good to ensure

-- 3. Create Isolation Policies
-- We drop existing policies first to ensure clean state (optional but recommended)

-- SALES
DROP POLICY IF EXISTS "Enable read access for all users" ON public.sales;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.sales;
-- Add new policies using tenant_id
CREATE POLICY "Tenant Isolation Select" ON public.sales FOR SELECT USING (tenant_id = get_auth_tenant_id());
CREATE POLICY "Tenant Isolation Insert" ON public.sales FOR INSERT WITH CHECK (tenant_id = get_auth_tenant_id());
CREATE POLICY "Tenant Isolation Update" ON public.sales FOR UPDATE USING (tenant_id = get_auth_tenant_id());
CREATE POLICY "Tenant Isolation Delete" ON public.sales FOR DELETE USING (tenant_id = get_auth_tenant_id());

-- PROJECTS
DROP POLICY IF EXISTS "Enable read access for all users" ON public.projects;
CREATE POLICY "Tenant Isolation Select" ON public.projects FOR SELECT USING (tenant_id = get_auth_tenant_id());
CREATE POLICY "Tenant Isolation Insert" ON public.projects FOR INSERT WITH CHECK (tenant_id = get_auth_tenant_id());
CREATE POLICY "Tenant Isolation Update" ON public.projects FOR UPDATE USING (tenant_id = get_auth_tenant_id());
CREATE POLICY "Tenant Isolation Delete" ON public.projects FOR DELETE USING (tenant_id = get_auth_tenant_id());

-- CUSTOMERS
CREATE POLICY "Tenant Isolation All" ON public.customers FOR ALL USING (tenant_id = get_auth_tenant_id());

-- DEPARTMENTS
CREATE POLICY "Tenant Isolation All" ON public.departments FOR ALL USING (tenant_id = get_auth_tenant_id());

-- SITE VISITS
CREATE POLICY "Tenant Isolation All" ON public.site_visits FOR ALL USING (tenant_id = get_auth_tenant_id());

-- ANNOUNCEMENTS
CREATE POLICY "Tenant Isolation All" ON public.announcements FOR ALL USING (tenant_id = get_auth_tenant_id());

-- TARGETS
CREATE POLICY "Tenant Isolation All" ON public.targets FOR ALL USING (tenant_id = get_auth_tenant_id());

-- PAYMENTS
CREATE POLICY "Tenant Isolation All" ON public.payments FOR ALL USING (tenant_id = get_auth_tenant_id());

-- PROFILES (Special Handling)
-- Users can see their own profile
-- Users can see profiles of others in SAME TENANT
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;

CREATE POLICY "View Own and Co-Tenant Profiles" ON public.profiles FOR SELECT
USING (
    id = auth.uid() OR tenant_id = get_auth_tenant_id()
);

CREATE POLICY "Update Own Profile" ON public.profiles FOR UPDATE
USING ( id = auth.uid() );

-- TENANTS Table
-- Only read your own tenant
CREATE POLICY "Read Own Tenant" ON public.tenants FOR SELECT
USING ( id = get_auth_tenant_id() );

-- Force schema reload
NOTIFY pgrst, 'reload schema';
