-- =====================================================================
-- RealSalePro PostgreSQL Production Database Schema
-- Multi-Tenant Real Estate CRM
-- Compatible with Convex string IDs & Native PostgreSQL UUIDs
-- =====================================================================

-- Native PostgreSQL gen_random_uuid() is built-in (PostgreSQL 13+)

-- 1. TENANTS TABLE
CREATE TABLE IF NOT EXISTS tenants (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    settings JSONB DEFAULT '{}'::jsonb,
    subscription_status VARCHAR(50) DEFAULT 'active',
    plan_tier VARCHAR(50) DEFAULT 'enterprise',
    billing_cycle VARCHAR(50) DEFAULT 'monthly',
    subscription_id VARCHAR(255),
    razorpay_customer_id VARCHAR(255),
    next_billing_date TIMESTAMPTZ,
    trial_ends_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    leads_count INT DEFAULT 0,
    last_login_at TIMESTAMPTZ,
    inactivity_warning_count INT DEFAULT 0,
    last_inactivity_warning_at TIMESTAMPTZ,
    inactivity_deactivated_at TIMESTAMPTZ,
    deactivation_reason VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_is_active ON tenants(is_active);

-- 2. DEPARTMENTS TABLE
CREATE TABLE IF NOT EXISTS departments (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    custom_fields JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_departments_tenant ON departments(tenant_id);

-- 3. TENANT ROLES TABLE
CREATE TABLE IF NOT EXISTS tenant_roles (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '[]'::jsonb,
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tenant_roles_tenant ON tenant_roles(tenant_id);

-- 4. PROFILES / USERS TABLE
CREATE TABLE IF NOT EXISTS profiles (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255),
    password_hash VARCHAR(255),
    full_name VARCHAR(255) NOT NULL,
    employee_id VARCHAR(100),
    phone VARCHAR(50),
    role VARCHAR(50) NOT NULL DEFAULT 'sales_executive',
    department_id VARCHAR(255) REFERENCES departments(id) ON DELETE SET NULL,
    reporting_manager_id VARCHAR(255) REFERENCES profiles(id) ON DELETE SET NULL,
    tenant_id VARCHAR(255) REFERENCES tenants(id) ON DELETE CASCADE,
    role_id VARCHAR(255) REFERENCES tenant_roles(id) ON DELETE SET NULL,
    image_url TEXT,
    dob VARCHAR(100),
    marriage_anniversary VARCHAR(100),
    joining_date VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    force_password_change BOOLEAN DEFAULT false,
    last_login_at TIMESTAMPTZ,
    temp_login_password VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_tenant ON profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- 5. PROJECTS TABLE
CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    project_type VARCHAR(100),
    location_lat DOUBLE PRECISION,
    location_lng DOUBLE PRECISION,
    google_maps_url TEXT,
    site_photos TEXT[] DEFAULT '{}',
    image_url TEXT,
    status VARCHAR(50) DEFAULT 'ongoing',
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_projects_tenant ON projects(tenant_id);

-- 6. PROJECT UNITS (INVENTORY) TABLE
CREATE TABLE IF NOT EXISTS project_units (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id VARCHAR(255) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    unit_number VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'Available',
    custom_values JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_project_units_tenant ON project_units(tenant_id);
CREATE INDEX IF NOT EXISTS idx_project_units_project ON project_units(project_id);
CREATE INDEX IF NOT EXISTS idx_project_units_status ON project_units(status);

-- 7. LEADS TABLE
CREATE TABLE IF NOT EXISTS leads (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    lead_id VARCHAR(100) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    mobile VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    lead_source VARCHAR(100) DEFAULT 'Direct',
    project_id VARCHAR(255) REFERENCES projects(id) ON DELETE SET NULL,
    sales_executive_id VARCHAR(255) REFERENCES profiles(id) ON DELETE SET NULL,
    city VARCHAR(100),
    budget_range VARCHAR(100),
    purpose VARCHAR(100),
    preferred_locations TEXT[] DEFAULT '{}',
    lead_status VARCHAR(100) DEFAULT 'New',
    lead_score VARCHAR(50) DEFAULT 'Warm',
    internal_notes TEXT,
    lead_date VARCHAR(100) DEFAULT CURRENT_DATE::text,
    created_by VARCHAR(255) REFERENCES profiles(id) ON DELETE SET NULL,
    updated_by VARCHAR(255) REFERENCES profiles(id) ON DELETE SET NULL,
    latest_followup_date TIMESTAMPTZ,
    latest_followup_status VARCHAR(100),
    next_followup_date TIMESTAMPTZ,
    followup_count INT DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_leads_tenant ON leads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leads_mobile ON leads(mobile);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(tenant_id, lead_status);
CREATE INDEX IF NOT EXISTS idx_leads_executive ON leads(tenant_id, sales_executive_id);
CREATE INDEX IF NOT EXISTS idx_leads_date ON leads(tenant_id, lead_date);

-- 8. LEAD FOLLOWUPS TABLE
CREATE TABLE IF NOT EXISTS lead_followups (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    lead_id VARCHAR(255) NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    followup_type VARCHAR(100) NOT NULL,
    followup_date VARCHAR(100) NOT NULL,
    discussion_summary TEXT NOT NULL,
    customer_response TEXT,
    call_status VARCHAR(100),
    previous_status VARCHAR(100),
    new_status VARCHAR(100) NOT NULL,
    next_followup_date VARCHAR(100),
    created_by VARCHAR(255) REFERENCES profiles(id) ON DELETE SET NULL,
    is_editable BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_lead_followups_lead ON lead_followups(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_followups_tenant ON lead_followups(tenant_id);

-- 9. SALES TABLE
CREATE TABLE IF NOT EXISTS sales (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id VARCHAR(255) REFERENCES leads(id) ON DELETE SET NULL,
    project_id VARCHAR(255) NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
    sales_executive_id VARCHAR(255) NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    team_leader_id VARCHAR(255) REFERENCES profiles(id) ON DELETE SET NULL,
    sale_date VARCHAR(100) NOT NULL DEFAULT CURRENT_DATE::text,
    property_type VARCHAR(100),
    unit_number VARCHAR(100),
    area_sqft NUMERIC(12, 2) NOT NULL DEFAULT 0,
    rate_per_sqft NUMERIC(12, 2) DEFAULT 0,
    base_price NUMERIC(14, 2) DEFAULT 0,
    total_revenue NUMERIC(14, 2) NOT NULL DEFAULT 0,
    booking_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    is_agreement_done BOOLEAN DEFAULT false,
    agreement_date VARCHAR(100),
    is_registry_done BOOLEAN DEFAULT false,
    registry_date VARCHAR(100),
    status VARCHAR(50) DEFAULT 'booked',
    metadata JSONB DEFAULT '{}'::jsonb,
    -- Primary Applicant Details
    father_husband_name VARCHAR(255),
    dob VARCHAR(100),
    gender VARCHAR(50),
    alternate_mobile VARCHAR(50),
    pan_number VARCHAR(50),
    aadhaar_number VARCHAR(50),
    occupation VARCHAR(100),
    company_name VARCHAR(255),
    annual_income VARCHAR(100),
    marital_status VARCHAR(50),
    nationality VARCHAR(100),
    passport VARCHAR(100),
    -- Current Address
    address_house_no TEXT,
    address_street TEXT,
    address_city VARCHAR(100),
    address_state VARCHAR(100),
    address_pin_code VARCHAR(50),
    -- Permanent Address
    address_same_as_current BOOLEAN DEFAULT true,
    perm_address_house_no TEXT,
    perm_address_street TEXT,
    perm_address_city VARCHAR(100),
    perm_address_state VARCHAR(100),
    perm_address_pin_code VARCHAR(50),
    -- Co-Applicant Details
    co_applicant_name VARCHAR(255),
    co_applicant_relation VARCHAR(100),
    co_applicant_mobile VARCHAR(50),
    co_applicant_aadhaar VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sales_tenant ON sales(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_project ON sales(project_id);
CREATE INDEX IF NOT EXISTS idx_sales_executive ON sales(sales_executive_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(tenant_id, sale_date);

-- 10. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    sale_id VARCHAR(255) NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    payment_date VARCHAR(100) NOT NULL DEFAULT CURRENT_DATE::text,
    amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    payment_type VARCHAR(100) NOT NULL,
    payment_mode VARCHAR(100) NOT NULL,
    transaction_reference VARCHAR(255),
    remarks TEXT,
    recorded_by VARCHAR(255) REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payments_tenant ON payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_sale ON payments(sale_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(tenant_id, payment_date);

-- 11. SITE VISITS TABLE
CREATE TABLE IF NOT EXISTS site_visits (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    requested_by VARCHAR(255) NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    lead_id VARCHAR(255) REFERENCES leads(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL,
    mobile VARCHAR(50) NOT NULL,
    visit_date VARCHAR(100) NOT NULL,
    visit_time VARCHAR(50) NOT NULL,
    pickup_location TEXT NOT NULL,
    notes TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    driver_id VARCHAR(255) REFERENCES profiles(id) ON DELETE SET NULL,
    rejection_reason TEXT,
    clarification_note TEXT,
    start_odometer VARCHAR(50),
    end_odometer VARCHAR(50),
    trip_start_time TIMESTAMPTZ,
    trip_end_time TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_site_visits_tenant ON site_visits(tenant_id);
CREATE INDEX IF NOT EXISTS idx_site_visits_status ON site_visits(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_site_visits_driver ON site_visits(driver_id);

-- 12. SALES TARGETS TABLE
CREATE TABLE IF NOT EXISTS sales_targets (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    period_type VARCHAR(50) DEFAULT 'monthly',
    target_sqft NUMERIC(12, 2) DEFAULT 0,
    target_amount NUMERIC(14, 2) DEFAULT 0,
    target_units INT DEFAULT 0,
    start_date VARCHAR(100) NOT NULL,
    end_date VARCHAR(100) NOT NULL,
    created_by VARCHAR(255) REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sales_targets_user ON sales_targets(tenant_id, user_id, start_date);

-- 13. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    related_entity_type VARCHAR(100),
    related_entity_id VARCHAR(255),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);

-- 14. ANNOUNCEMENTS TABLE
CREATE TABLE IF NOT EXISTS announcements (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    is_important BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT true,
    created_by VARCHAR(255) REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_announcements_tenant ON announcements(tenant_id);

-- 15. ACTIVITY LOGS TABLE
CREATE TABLE IF NOT EXISTS activity_logs (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id VARCHAR(255) REFERENCES profiles(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(255),
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_tenant ON activity_logs(tenant_id);

-- 16. SUPPORT TICKETS TABLE
CREATE TABLE IF NOT EXISTS support_tickets (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    ticket_number SERIAL,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'open',
    priority VARCHAR(50) DEFAULT 'medium',
    created_by VARCHAR(255) REFERENCES profiles(id) ON DELETE SET NULL,
    resolution_notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_tenant ON support_tickets(tenant_id);

-- 17. SUBSCRIPTIONS & BILLING TABLES
CREATE TABLE IF NOT EXISTS subscriptions (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    razorpay_subscription_id VARCHAR(255) UNIQUE NOT NULL,
    plan_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'created',
    current_start VARCHAR(100),
    current_end VARCHAR(100),
    ended_at VARCHAR(100),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant ON subscriptions(tenant_id);

CREATE TABLE IF NOT EXISTS billing_history (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    status VARCHAR(50) NOT NULL,
    razorpay_payment_id VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_billing_history_tenant ON billing_history(tenant_id);

-- 18. REFERRAL & AFFILIATE SYSTEM
CREATE TABLE IF NOT EXISTS referral_campaigns (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) REFERENCES tenants(id) ON DELETE CASCADE,
    code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    referrer_email VARCHAR(255),
    referrer_commission_percent NUMERIC(5, 2) DEFAULT 10.00,
    referee_discount_percent NUMERIC(5, 2) DEFAULT 10.00,
    is_active BOOLEAN DEFAULT true,
    created_by VARCHAR(255) REFERENCES profiles(id) ON DELETE SET NULL,
    created_by_user_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_referral_campaigns_code ON referral_campaigns(code);

CREATE TABLE IF NOT EXISTS user_referrals (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    campaign_id VARCHAR(255) NOT NULL REFERENCES referral_campaigns(id) ON DELETE CASCADE,
    referred_tenant_id VARCHAR(255) REFERENCES tenants(id) ON DELETE SET NULL,
    referrer_id VARCHAR(255) REFERENCES profiles(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'pending',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS commissions (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    referral_id VARCHAR(255) NOT NULL REFERENCES user_referrals(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending',
    paid_at VARCHAR(100),
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 19. LEAD TRANSFERS TABLE
CREATE TABLE IF NOT EXISTS lead_transfers (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    lead_id VARCHAR(255) NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    from_executive_id VARCHAR(255) REFERENCES profiles(id) ON DELETE SET NULL,
    to_executive_id VARCHAR(255) NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    requested_by VARCHAR(255) NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    approved_by VARCHAR(255) REFERENCES profiles(id) ON DELETE SET NULL,
    transfer_status VARCHAR(50) DEFAULT 'Pending',
    approval_notes TEXT,
    requested_at VARCHAR(100),
    approved_at VARCHAR(100),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 20. INCENTIVES TABLE
CREATE TABLE IF NOT EXISTS incentives (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    sales_executive_id VARCHAR(255) NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    calculation_month VARCHAR(50) NOT NULL,
    calculation_year INT NOT NULL,
    total_incentive_amount NUMERIC(12, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending',
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 21. AI CHAT LIMITS TABLE
CREATE TABLE IF NOT EXISTS ai_chat_limits (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    date VARCHAR(50) NOT NULL,
    count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 22. CAPI & CONVERSION EVENTS LOG TABLE
CREATE TABLE IF NOT EXISTS capi_events_log (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    lead_id VARCHAR(255) REFERENCES leads(id) ON DELETE SET NULL,
    platform VARCHAR(50) NOT NULL DEFAULT 'meta',
    event_name VARCHAR(100) NOT NULL,
    event_id VARCHAR(255),
    event_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'success',
    payload JSONB DEFAULT '{}'::jsonb,
    response JSONB DEFAULT '{}'::jsonb,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_capi_events_tenant ON capi_events_log(tenant_id, created_at DESC);

-- 23. WHATSAPP CONVERSATIONS TABLE (In-House Live Chat & Bot Engine)
CREATE TABLE IF NOT EXISTS whatsapp_conversations (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    phone VARCHAR(50) NOT NULL UNIQUE,
    customer_name VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'bot_active', -- 'bot_active', 'agent_requested', 'agent_chatting', 'closed'
    assigned_to VARCHAR(255) REFERENCES profiles(id) ON DELETE SET NULL,
    unread_count INT NOT NULL DEFAULT 0,
    last_message TEXT,
    last_message_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wa_conv_phone ON whatsapp_conversations(phone);
CREATE INDEX IF NOT EXISTS idx_wa_conv_status ON whatsapp_conversations(status);
CREATE INDEX IF NOT EXISTS idx_wa_conv_last_msg ON whatsapp_conversations(last_message_at DESC);

-- 24. WHATSAPP MESSAGES TABLE (2-Way Chat History)
CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    conversation_id VARCHAR(255) NOT NULL REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
    direction VARCHAR(20) NOT NULL, -- 'inbound', 'outbound'
    sender_type VARCHAR(30) NOT NULL, -- 'visitor', 'bot', 'agent', 'system'
    sender_name VARCHAR(255),
    message_type VARCHAR(30) NOT NULL DEFAULT 'text', -- 'text', 'template', 'interactive', 'image', 'document'
    body TEXT NOT NULL,
    meta_message_id VARCHAR(255),
    status VARCHAR(30) NOT NULL DEFAULT 'sent', -- 'sent', 'delivered', 'read', 'failed'
    error_message TEXT,
    raw_payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wa_msg_conv ON whatsapp_messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_wa_msg_meta_id ON whatsapp_messages(meta_message_id);

-- 25. WHATSAPP TEMPLATES TABLE (Direct Meta Sync & Approval Hub)
CREATE TABLE IF NOT EXISTS whatsapp_templates (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(255) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL DEFAULT 'MARKETING', -- 'MARKETING', 'UTILITY', 'AUTHENTICATION'
    language VARCHAR(20) NOT NULL DEFAULT 'en',
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- 'APPROVED', 'PENDING', 'REJECTED', 'PAUSED'
    meta_template_id VARCHAR(255),
    components JSONB NOT NULL DEFAULT '[]'::jsonb,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wa_tpl_status ON whatsapp_templates(status);

-- 26. WHATSAPP BROADCASTS TABLE (Bulk Campaigns)
CREATE TABLE IF NOT EXISTS whatsapp_broadcasts (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title VARCHAR(255) NOT NULL,
    template_name VARCHAR(255),
    custom_message TEXT,
    target_audience VARCHAR(100) NOT NULL DEFAULT 'all_leads',
    total_recipients INT NOT NULL DEFAULT 0,
    sent_count INT NOT NULL DEFAULT 0,
    delivered_count INT NOT NULL DEFAULT 0,
    read_count INT NOT NULL DEFAULT 0,
    failed_count INT NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'draft', -- 'draft', 'scheduled', 'processing', 'completed', 'failed'
    created_by VARCHAR(255) REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ
);

-- 27. WHATSAPP OTPS TABLE (Customer Verification via WhatsApp)
CREATE TABLE IF NOT EXISTS whatsapp_otps (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    phone VARCHAR(50) NOT NULL,
    otp_code VARCHAR(20) NOT NULL,
    purpose VARCHAR(50) NOT NULL DEFAULT 'signup_verification', -- 'signup_verification', 'password_reset', 'login'
    attempts INT NOT NULL DEFAULT 0,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wa_otps_phone ON whatsapp_otps(phone, is_verified, expires_at);

-- 28. WHATSAPP PLATFORM CONFIG TABLE (Meta Cloud API Official Setup)
CREATE TABLE IF NOT EXISTS whatsapp_platform_config (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
    waba_id VARCHAR(255),
    phone_number_id VARCHAR(255),
    access_token TEXT,
    webhook_verify_token VARCHAR(255) DEFAULT 'realsalepro_wa_secret',
    bot_enabled BOOLEAN DEFAULT true,
    welcome_message TEXT,
    agent_notify_email VARCHAR(255) DEFAULT 'support@realsalepro.com',
    agent_notify_phone VARCHAR(50) DEFAULT '+917079737773',
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
