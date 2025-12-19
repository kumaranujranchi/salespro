-- Create incentives table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.incentives (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sales_executive_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    calculation_month TEXT NOT NULL,
    calculation_year INTEGER NOT NULL,
    total_incentive_amount NUMERIC DEFAULT 0,
    sale_id TEXT NOT NULL,
    
    -- Installment details
    installment_1_amount NUMERIC DEFAULT 0,
    installment_1_paid BOOLEAN DEFAULT false,
    installment_2_amount NUMERIC DEFAULT 0,
    installment_2_paid BOOLEAN DEFAULT false,
    installment_3_amount NUMERIC DEFAULT 0,
    installment_3_paid BOOLEAN DEFAULT false,
    installment_4_amount NUMERIC DEFAULT 0,
    installment_4_paid BOOLEAN DEFAULT false,
    
    is_locked BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.incentives ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid errors on re-run
DROP POLICY IF EXISTS "Admins can manage all incentives" ON public.incentives;
DROP POLICY IF EXISTS "Users can view own incentives" ON public.incentives;

-- Policies
-- 1. Admins/Super Admins can do everything (Case Insensitive Check)
CREATE POLICY "Admins can manage all incentives" ON public.incentives
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND (
                LOWER(profiles.role) = 'admin' 
                OR LOWER(profiles.role) = 'super_admin'
                OR profiles.role = 'Super Admin' -- Explicit check just in case
            )
        )
    );

-- 2. Sales Executives can view their own incentives
CREATE POLICY "Users can view own incentives" ON public.incentives
    FOR SELECT
    USING (sales_executive_id = auth.uid());

-- Grant access
GRANT ALL ON public.incentives TO authenticated;
GRANT ALL ON public.incentives TO service_role;
