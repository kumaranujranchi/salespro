-- Function to Convert Lead to Sale
-- Runs with SECURITY DEFINER to allow Sales Executives to create a Sale record
-- even if they don't have direct INSERT permissions on the sales table.

CREATE OR REPLACE FUNCTION convert_lead_to_sale(
    p_lead_id UUID,
    p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Critical: Runs with privileges of the creator (postgres/admin)
AS $$
DECLARE
    v_lead RECORD;
    v_customer_id UUID;
    v_sale_id UUID;
    v_tenant_id UUID;
BEGIN
    -- 1. Fetch Lead Details
    SELECT * INTO v_lead FROM public.leads WHERE id = p_lead_id;
    
    IF v_lead IS NULL THEN
        RAISE EXCEPTION 'Lead not found';
    END IF;

    -- Set context variables
    v_tenant_id := v_lead.tenant_id;

    -- 2. Find or Create Customer
    SELECT id INTO v_customer_id 
    FROM public.customers 
    WHERE tenant_id = v_tenant_id AND phone = v_lead.mobile;

    IF v_customer_id IS NULL THEN
        INSERT INTO public.customers (
            tenant_id,
            name,
            phone,
            email,
            address,
            created_by,
            created_at,
            updated_at
        ) VALUES (
            v_tenant_id,
            v_lead.customer_name,
            v_lead.mobile,
            v_lead.email,
            v_lead.city,
            p_user_id,
            NOW(),
            NOW()
        ) RETURNING id INTO v_customer_id;
    END IF;

    -- 3. Create Sale Record
    IF v_lead.project_id IS NULL THEN
        RAISE EXCEPTION 'Lead must have a project assigned before conversion.';
    END IF;

    INSERT INTO public.sales (
        tenant_id,
        sale_number,
        customer_id,
        project_id,
        sales_executive_id,
        sale_date,
        total_revenue,
        booking_amount,
        additional_charges,
        discount,
        plc,
        dev_charges,
        is_agreement_done,
        is_registry_done,
        metadata,
        created_at,
        updated_at
    ) VALUES (
        v_tenant_id,
        'B-' || v_lead.lead_id, -- Generate Booking Number
        v_customer_id,
        v_lead.project_id,
        COALESCE(v_lead.sales_executive_id, p_user_id),
        NOW(),
        0, -- total_revenue (Admin to parse)
        0, -- booking_amount (Admin to parse)
        0,
        0,
        0,
        0,
        FALSE,
        FALSE,
        jsonb_build_object(
            'source_lead_id', v_lead.id,
            'booking_status', 'booked',
            'auto_created', true
        ),
        NOW(),
        NOW()
    ) RETURNING id INTO v_sale_id;

    -- Return success result
    RETURN jsonb_build_object(
        'success', true,
        'sale_id', v_sale_id,
        'customer_id', v_customer_id
    );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION convert_lead_to_sale(UUID, UUID) TO authenticated;
