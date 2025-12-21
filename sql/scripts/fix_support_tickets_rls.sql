-- Fix RLS Policies for Support Tickets
-- This will ensure Platform Admins can see ALL tickets

-- Drop existing policies
DROP POLICY IF EXISTS "Platform Admins can view all tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can view own tenant tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can create tickets" ON public.support_tickets;

-- Policy 1: Platform Admins can do EVERYTHING (View, Update, Delete)
CREATE POLICY "Platform Admins full access"
    ON public.support_tickets
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'platform_admin'
        )
    );

-- Policy 2: Tenant Users can VIEW their OWN Tenant's tickets
CREATE POLICY "Tenant users view own tickets"
    ON public.support_tickets
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.tenant_id = support_tickets.tenant_id
        )
    );

-- Policy 3: Tenant Users can CREATE tickets for their tenant
CREATE POLICY "Tenant users create tickets"
    ON public.support_tickets
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.tenant_id = support_tickets.tenant_id
            AND support_tickets.created_by = auth.uid()
        )
    );
