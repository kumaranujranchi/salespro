-- Fix for Lead ID Generation Error
-- Replaces the ID generation logic to use MAX(ID) instead of COUNT(*).
-- This prevents errors when leads have been deleted.

CREATE OR REPLACE FUNCTION generate_lead_id(tenant_uuid UUID)
RETURNS VARCHAR(50) AS $$
DECLARE
    date_part VARCHAR(8);
    sequence_num INTEGER;
    lead_id_result VARCHAR(50);
BEGIN
    -- Get current date in YYYYMMDD format
    date_part := TO_CHAR(NOW(), 'YYYYMMDD');
    
    -- Find the maximum sequence number used today for this tenant
    -- We look for IDs matching 'L-YYYYMMDD-%' and extract the last part
    SELECT COALESCE(MAX(CAST(split_part(lead_id, '-', 3) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM public.leads
    WHERE tenant_id = tenant_uuid
    AND lead_id LIKE 'L-' || date_part || '-%';
    
    -- Loop to ensure uniqueness (handles parallel insertions)
    LOOP
        -- Format: L-YYYYMMDD-XXXX (e.g., L-20241217-0005)
        lead_id_result := 'L-' || date_part || '-' || LPAD(sequence_num::TEXT, 4, '0');
        
        -- Check if this ID already exists
        IF NOT EXISTS (SELECT 1 FROM public.leads WHERE lead_id = lead_id_result) THEN
            RETURN lead_id_result;
        END IF;
        
        -- If conflict, increment and try again
        sequence_num := sequence_num + 1;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION generate_lead_id(UUID) TO authenticated;
