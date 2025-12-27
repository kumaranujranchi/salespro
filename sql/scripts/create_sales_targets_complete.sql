-- Create sales_targets table if it doesn't exist
CREATE TABLE IF NOT EXISTS sales_targets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    period_type TEXT NOT NULL CHECK (period_type IN ('monthly')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    target_sqft NUMERIC DEFAULT 0,
    target_units NUMERIC DEFAULT 0,
    target_amount NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id)
);

-- Enable Row Level Security
ALTER TABLE sales_targets ENABLE ROW LEVEL SECURITY;

-- Create Policies

-- 1. Allow users to view their own targets
CREATE POLICY "Users can view own targets" ON sales_targets
    FOR SELECT USING (auth.uid() = user_id);

-- 2. Allow admins/directors/team leaders to view all targets within their tenant (simplification)
-- Ideally this updates based on hierarchy, but for now strict RLS might block dashboards.
-- Let's use a broader read policy for authenticated users to ensure dashboards work, 
-- relying on frontend filtering for privacy where critical, or we can use the tenant_id if available.
-- However, sales_targets doesn't have a tenant_id column! It links to profiles.
-- We should probably add tenant_id to be safe for multi-tenancy, but profiles has it.
-- Let's stick to the interface definition which didn't show tenant_id on Target, but it's good practice.
-- Use profile link for RLS.

CREATE POLICY "View targets based on hierarchy" ON sales_targets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND (
                profiles.role IN ('super_admin', 'admin', 'director', 'platform_admin')
                OR
                (profiles.role = 'team_leader' AND profiles.id = (SELECT reporting_manager_id FROM profiles p2 WHERE p2.id = sales_targets.user_id))
            )
        )
        OR auth.uid() = user_id
    );

-- 3. Allow admins/directors to manage targets
CREATE POLICY "Admins manage targets" ON sales_targets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('super_admin', 'admin', 'director')
        )
    );

-- 4. Allow Team Leaders to assign targets to their team members
CREATE POLICY "Team Leaders assign targets" ON sales_targets
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'team_leader'
            AND sales_targets.user_id IN (
                SELECT id FROM profiles WHERE reporting_manager_id = auth.uid()
            )
        )
    );

CREATE POLICY "Team Leaders update targets" ON sales_targets
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'team_leader'
            AND sales_targets.user_id IN (
                SELECT id FROM profiles WHERE reporting_manager_id = auth.uid()
            )
        )
    );

-- Add missing columns if table existed but was old (Double check safety)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales_targets' AND column_name = 'target_units') THEN
        ALTER TABLE sales_targets ADD COLUMN target_units NUMERIC DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales_targets' AND column_name = 'target_amount') THEN
        ALTER TABLE sales_targets ADD COLUMN target_amount NUMERIC DEFAULT 0;
    END IF;
END $$;
