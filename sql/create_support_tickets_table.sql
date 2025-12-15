-- Create Support Tickets Table
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_number SERIAL,
    subject TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Policy 1: Platform Admins can do EVERYTHING (View, Update, Delete)
CREATE POLICY "Platform Admins can view all tickets"
    ON public.support_tickets
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'platform_admin'
        )
    );

-- Policy 2: Tenant Admins/Users can VIEW their OWN Tenant's tickets
CREATE POLICY "Users can view own tenant tickets"
    ON public.support_tickets
    FOR SELECT
    USING (
        tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
    );

-- Policy 3: Tenant Admins/Users can CREATE tickets
CREATE POLICY "Users can create tickets"
    ON public.support_tickets
    FOR INSERT
    WITH CHECK (
        auth.uid() = created_by
        AND
        tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
    );

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_support_tickets_tenant_id ON public.support_tickets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
