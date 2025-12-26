-- Enable RLS
ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to ensure clean state
DROP POLICY IF EXISTS "site_visits_select_policy" ON public.site_visits;
DROP POLICY IF EXISTS "site_visits_insert_policy" ON public.site_visits;
DROP POLICY IF EXISTS "site_visits_update_policy" ON public.site_visits;
DROP POLICY IF EXISTS "site_visits_delete_policy" ON public.site_visits;

-- 1. SELECT POLICY
CREATE POLICY "site_visits_select_policy" ON public.site_visits
    FOR SELECT
    USING (
        -- 1. User is the requester
        requested_by = auth.uid()
        
        -- 2. User is the assigned driver
        OR driver_id = auth.uid()
        
        -- 3. User is an Admin/Director/TL and belongs to the same tenant as the requester
        OR EXISTS (
            SELECT 1 FROM public.profiles as viewer
            WHERE viewer.id = auth.uid()
            AND viewer.role IN ('super_admin', 'admin', 'director', 'team_leader', 'platform_admin')
            AND viewer.tenant_id = (
                SELECT creator.tenant_id 
                FROM public.profiles as creator 
                WHERE creator.id = site_visits.requested_by
            )
        )
    );

-- 2. INSERT POLICY
CREATE POLICY "site_visits_insert_policy" ON public.site_visits
    FOR INSERT
    WITH CHECK (
        -- Authenticated users can create visits
        auth.role() = 'authenticated'
        -- Optional: specific checks if needed, but usually just auth is enough
    );

-- 3. UPDATE POLICY
CREATE POLICY "site_visits_update_policy" ON public.site_visits
    FOR UPDATE
    USING (
        -- Same visibility rules as select usually apply for finding the row
        requested_by = auth.uid()
        OR driver_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.profiles as viewer
            WHERE viewer.id = auth.uid()
            AND viewer.role IN ('super_admin', 'admin', 'director', 'team_leader', 'platform_admin')
            AND viewer.tenant_id = (
                SELECT creator.tenant_id 
                FROM public.profiles as creator 
                WHERE creator.id = site_visits.requested_by
            )
        )
    )
    WITH CHECK (
        -- Allow updates
        requested_by = auth.uid()
        OR driver_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.profiles as viewer
            WHERE viewer.id = auth.uid()
            AND viewer.role IN ('super_admin', 'admin', 'director', 'team_leader', 'platform_admin')
            AND viewer.tenant_id = (
                SELECT creator.tenant_id 
                FROM public.profiles as creator 
                WHERE creator.id = site_visits.requested_by
            )
        )
    );

-- 4. DELETE POLICY
CREATE POLICY "site_visits_delete_policy" ON public.site_visits
    FOR DELETE
    USING (
        -- Only Requester (if pending) or Admins can delete
        (requested_by = auth.uid() AND status = 'pending')
        OR EXISTS (
            SELECT 1 FROM public.profiles as viewer
            WHERE viewer.id = auth.uid()
            AND viewer.role IN ('super_admin', 'admin', 'director', 'platform_admin')
            AND viewer.tenant_id = (
                SELECT creator.tenant_id 
                FROM public.profiles as creator 
                WHERE creator.id = site_visits.requested_by
            )
        )
    );
