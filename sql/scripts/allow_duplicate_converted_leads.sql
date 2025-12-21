-- =====================================================
-- ALLOW DUPLICATE LEADS IF PREVIOUS LEAD IS 'CONVERTED'
-- =====================================================

-- 1. Drop existing triggers and functions enforcing strict uniqueness
DROP TRIGGER IF EXISTS prevent_duplicate_leads ON public.leads;
DROP FUNCTION IF EXISTS check_duplicate_lead();

-- 2. Drop the strict unique constraint on leads table
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS unique_mobile_per_tenant;

-- 3. Create a Partial Unique Index
-- This ensures mobile numbers are unique only among active (non-converted) leads.
-- Multiple 'Converted' leads with the same mobile are allowed.
-- Multiple 'Converted' leads + 1 'New' lead with same mobile is allowed.
-- 2 'New' leads with same mobile is NOT allowed.
CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_unique_mobile_active 
ON public.leads (tenant_id, mobile) 
WHERE lead_status != 'Converted';

-- 4. Re-create the trigger function with updated logic
CREATE OR REPLACE FUNCTION check_duplicate_lead()
RETURNS TRIGGER AS $$
BEGIN
    -- Check for duplicate mobile within tenant ONLY if existing lead is NOT Converted
    -- This complements the unique index but provides a clearer error message.
    IF EXISTS (
        SELECT 1 FROM public.leads 
        WHERE tenant_id = NEW.tenant_id 
        AND mobile = NEW.mobile 
        AND lead_status != 'Converted'
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
    ) THEN
        RAISE EXCEPTION 'An active lead with this mobile number already exists';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Re-attach the trigger
CREATE TRIGGER prevent_duplicate_leads
    BEFORE INSERT OR UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION check_duplicate_lead();
