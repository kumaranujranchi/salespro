-- =====================================================
-- CRM Module Database Schema
-- =====================================================

-- Create ENUM types for Lead Management
DO $$ BEGIN
    CREATE TYPE lead_source AS ENUM ('Ads', 'Walk-in', 'Reference', 'Channel Partner');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE lead_status AS ENUM ('New', 'Contacted', 'Qualified', 'Disqualified', 'Closed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE budget_range AS ENUM ('<50L', '50L-1Cr', '1Cr-2Cr', '>2Cr');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE purpose_type AS ENUM ('Investment', 'End Use');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE lead_score AS ENUM ('Hot', 'Warm', 'Cold');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE followup_type AS ENUM ('Call', 'WhatsApp', 'Visit', 'Email');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE customer_response AS ENUM ('Positive', 'Neutral', 'Negative');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- LEADS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    
    -- Auto-generated Lead ID
    lead_id VARCHAR(50) UNIQUE NOT NULL,
    
    -- Lead Source & Assignment
    lead_source lead_source NOT NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    sales_executive_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    
    -- Customer Details
    customer_name VARCHAR(255) NOT NULL,
    mobile VARCHAR(15) NOT NULL,
    email VARCHAR(255),
    city VARCHAR(100),
    
    -- Requirement Details
    budget_range budget_range,
    purpose purpose_type,
    preferred_locations TEXT[], -- Array of preferred area names
    
    -- Lead Management
    lead_status lead_status DEFAULT 'New',
    lead_score lead_score DEFAULT 'Warm',
    internal_notes TEXT,
    
    -- Timestamps
    lead_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Constraints
    CONSTRAINT unique_mobile_per_tenant UNIQUE (tenant_id, mobile),
    CONSTRAINT valid_mobile CHECK (mobile ~ '^[0-9]{10}$'),
    CONSTRAINT valid_email CHECK (email IS NULL OR email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- =====================================================
-- LEAD FOLLOWUPS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.lead_followups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
    
    -- Follow-up Details
    followup_type followup_type NOT NULL,
    followup_date TIMESTAMPTZ DEFAULT NOW(),
    
    -- Discussion & Response
    discussion_summary TEXT NOT NULL,
    customer_response customer_response,
    
    -- Status Management
    previous_status lead_status,
    new_status lead_status NOT NULL,
    
    -- Next Action
    next_followup_date DATE,
    
    -- Audit Trail (Immutable after 24 hrs)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_editable BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Constraints
    CONSTRAINT discussion_min_length CHECK (char_length(discussion_summary) >= 20),
    CONSTRAINT status_change CHECK (previous_status IS NULL OR previous_status != new_status),
    CONSTRAINT next_followup_required CHECK (
        new_status IN ('Closed', 'Disqualified') OR next_followup_date IS NOT NULL
    )
);

-- =====================================================
-- LEAD OWNERSHIP TRANSFERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.lead_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
    
    -- Transfer Details
    from_executive_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    to_executive_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
    
    -- Approval Workflow
    requested_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    transfer_status VARCHAR(20) DEFAULT 'Pending', -- Pending, Approved, Rejected
    approval_notes TEXT,
    
    -- Timestamps
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_leads_tenant ON public.leads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leads_executive ON public.leads(sales_executive_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(lead_status);
CREATE INDEX IF NOT EXISTS idx_leads_score ON public.leads(lead_score);
CREATE INDEX IF NOT EXISTS idx_leads_mobile ON public.leads(mobile);
CREATE INDEX IF NOT EXISTS idx_leads_lead_date ON public.leads(lead_date DESC);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_followups_lead ON public.lead_followups(lead_id);
CREATE INDEX IF NOT EXISTS idx_followups_tenant ON public.lead_followups(tenant_id);
CREATE INDEX IF NOT EXISTS idx_followups_date ON public.lead_followups(followup_date DESC);
CREATE INDEX IF NOT EXISTS idx_followups_next_date ON public.lead_followups(next_followup_date);

CREATE INDEX IF NOT EXISTS idx_transfers_lead ON public.lead_transfers(lead_id);
CREATE INDEX IF NOT EXISTS idx_transfers_tenant ON public.lead_transfers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_transfers_status ON public.lead_transfers(transfer_status);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_transfers ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- LEADS RLS POLICIES
-- =====================================================

-- Sales Executives: View/Edit only their assigned leads
CREATE POLICY leads_sales_executive_policy ON public.leads
    FOR ALL
    USING (
        tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
        AND (
            sales_executive_id = auth.uid()
            OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin', 'admin', 'team_leader', 'director')
        )
    )
    WITH CHECK (
        tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
        AND (
            sales_executive_id = auth.uid()
            OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin', 'admin', 'team_leader', 'director')
        )
    );

-- Team Leaders & Admins: Full access to all leads in their tenant
CREATE POLICY leads_admin_policy ON public.leads
    FOR ALL
    USING (
        tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
    );

-- =====================================================
-- FOLLOWUPS RLS POLICIES
-- =====================================================

CREATE POLICY followups_policy ON public.lead_followups
    FOR ALL
    USING (
        tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
        AND (
            -- Can view if owns the lead
            lead_id IN (SELECT id FROM public.leads WHERE sales_executive_id = auth.uid())
            -- Or is admin/team leader
            OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin', 'admin', 'team_leader', 'director')
        )
    )
    WITH CHECK (
        tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
        AND (
            lead_id IN (SELECT id FROM public.leads WHERE sales_executive_id = auth.uid())
            OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin', 'admin', 'team_leader', 'director')
        )
    );

-- =====================================================
-- TRANSFERS RLS POLICIES
-- =====================================================

CREATE POLICY transfers_policy ON public.lead_transfers
    FOR ALL
    USING (
        tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
    );

-- =====================================================
-- FUNCTIONS FOR LEAD ID GENERATION
-- =====================================================

-- Function to generate unique lead ID: L-[YYYYMMDD]-[XXXX]
CREATE OR REPLACE FUNCTION generate_lead_id(tenant_uuid UUID)
RETURNS VARCHAR(50) AS $$
DECLARE
    date_part VARCHAR(8);
    sequence_num INTEGER;
    lead_id_result VARCHAR(50);
    max_attempts INTEGER := 10;
    attempt INTEGER := 0;
BEGIN
    date_part := TO_CHAR(NOW(), 'YYYYMMDD');
    
    LOOP
        -- Get the count of leads created today for this tenant
        SELECT COUNT(*) + 1 INTO sequence_num
        FROM public.leads
        WHERE tenant_id = tenant_uuid
        AND DATE(lead_date) = CURRENT_DATE;
        
        -- Format: L-YYYYMMDD-XXXX
        lead_id_result := 'L-' || date_part || '-' || LPAD(sequence_num::TEXT, 4, '0');
        
        -- Check if this ID already exists (race condition protection)
        IF NOT EXISTS (SELECT 1 FROM public.leads WHERE lead_id = lead_id_result) THEN
            RETURN lead_id_result;
        END IF;
        
        attempt := attempt + 1;
        IF attempt >= max_attempts THEN
            RAISE EXCEPTION 'Failed to generate unique lead ID after % attempts', max_attempts;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGER TO AUTO-UPDATE timestamps
-- =====================================================

CREATE OR REPLACE FUNCTION update_leads_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_update_timestamp
    BEFORE UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION update_leads_timestamp();

-- =====================================================
-- TRIGGER TO MAKE FOLLOWUPS IMMUTABLE AFTER 24 HOURS
-- =====================================================

CREATE OR REPLACE FUNCTION make_followup_immutable()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if followup is older than 24 hours
    IF OLD.created_at < NOW() - INTERVAL '24 hours' THEN
        UPDATE public.lead_followups 
        SET is_editable = FALSE 
        WHERE id = OLD.id;
        
        -- Prevent any updates after 24 hours
        RAISE EXCEPTION 'Cannot modify follow-up entries older than 24 hours';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER followup_immutable_check
    BEFORE UPDATE ON public.lead_followups
    FOR EACH ROW
    EXECUTE FUNCTION make_followup_immutable();

-- =====================================================
-- FUNCTION TO VALIDATE DAILY FOLLOWUP LIMIT
-- =====================================================

CREATE OR REPLACE FUNCTION check_followup_limit()
RETURNS TRIGGER AS $$
DECLARE
    followup_count INTEGER;
BEGIN
    -- Count followups for this lead today
    SELECT COUNT(*) INTO followup_count
    FROM public.lead_followups
    WHERE lead_id = NEW.lead_id
    AND DATE(followup_date) = CURRENT_DATE;
    
    -- Limit to 3 followups per day
    IF followup_count >= 3 THEN
        RAISE EXCEPTION 'Maximum 3 follow-ups per day allowed for this lead';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_daily_followup_limit
    BEFORE INSERT ON public.lead_followups
    FOR EACH ROW
    EXECUTE FUNCTION check_followup_limit();

-- =====================================================
-- FUNCTION TO PREVENT DUPLICATE LEADS
-- =====================================================

CREATE OR REPLACE FUNCTION check_duplicate_lead()
RETURNS TRIGGER AS $$
BEGIN
    -- Check for duplicate mobile within tenant
    IF EXISTS (
        SELECT 1 FROM public.leads 
        WHERE tenant_id = NEW.tenant_id 
        AND mobile = NEW.mobile 
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
    ) THEN
        RAISE EXCEPTION 'A lead with this mobile number already exists';
    END IF;
    
    -- Check for duplicate email if provided
    IF NEW.email IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.leads 
        WHERE tenant_id = NEW.tenant_id 
        AND email = NEW.email 
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
    ) THEN
        RAISE EXCEPTION 'A lead with this email already exists';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_duplicate_leads
    BEFORE INSERT OR UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION check_duplicate_lead();

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT SELECT, INSERT, UPDATE ON public.leads TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.lead_followups TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.lead_transfers TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION generate_lead_id(UUID) TO authenticated;

COMMIT;
