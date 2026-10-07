-- =====================================================================
-- RealSalePro PostgreSQL Production Database Schema
-- Multi-Tenant Real Estate CRM
-- =====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TENANTS TABLE
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_is_active ON tenants(is_active);

-- 2. DEPARTMENTS TABLE
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_departments_tenant ON departments(tenant_id);

-- 3. TENANT ROLES TABLE
CREATE TABLE IF NOT EXISTS tenant_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '[]'::jsonb,
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tenant_roles_tenant ON tenant_roles(tenant_id);

-- 4. PROFILES / USERS TABLE
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255),
    full_name VARCHAR(255) NOT NULL,
    employee_id VARCHAR(100),
    phone VARCHAR(50),
    role VARCHAR(50) NOT NULL DEFAULT 'sales_executive',
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    reporting_manager_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    role_id UUID REFERENCES tenant_roles(id) ON DELETE SET NULL,
    image_url TEXT,
    dob DATE,
    marriage_anniversary DATE,
    joining_date DATE,
    is_active BOOLEAN DEFAULT true,
    force_password_change BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_tenant ON profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- 5. PROJECTS TABLE
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
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
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
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
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    lead_id VARCHAR(100) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    mobile VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    lead_source VARCHAR(100) DEFAULT 'Direct',
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    sales_executive_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    city VARCHAR(100),
    budget_range VARCHAR(100),
    purpose VARCHAR(100),
    preferred_locations TEXT[] DEFAULT '{}',
    lead_status VARCHAR(100) DEFAULT 'New',
    lead_score VARCHAR(50) DEFAULT 'Warm',
    internal_notes TEXT,
    lead_date DATE DEFAULT CURRENT_DATE,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
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
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    followup_type VARCHAR(100) NOT NULL,
    followup_date TIMESTAMPTZ NOT NULL,
    discussion_summary TEXT NOT NULL,
    customer_response TEXT,
    call_status VARCHAR(100),
    previous_status VARCHAR(100),
    new_status VARCHAR(100) NOT NULL,
    next_followup_date TIMESTAMPTZ,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    is_editable BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_lead_followups_lead ON lead_followups(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_followups_tenant ON lead_followups(tenant_id);

-- 9. SALES TABLE
CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
    sales_executive_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    team_leader_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
    property_type VARCHAR(100),
    unit_number VARCHAR(100),
    area_sqft NUMERIC(12, 2) NOT NULL DEFAULT 0,
    rate_per_sqft NUMERIC(12, 2) DEFAULT 0,
    base_price NUMERIC(14, 2) DEFAULT 0,
    total_revenue NUMERIC(14, 2) NOT NULL DEFAULT 0,
    booking_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    is_agreement_done BOOLEAN DEFAULT false,
    agreement_date DATE,
    is_registry_done BOOLEAN DEFAULT false,
    registry_date DATE,
    status VARCHAR(50) DEFAULT 'booked',
    metadata JSONB DEFAULT '{}'::jsonb,
    -- Primary Applicant Details
    father_husband_name VARCHAR(255),
    dob DATE,
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
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    payment_type VARCHAR(100) NOT NULL,
    payment_mode VARCHAR(100) NOT NULL,
    transaction_reference VARCHAR(255),
    remarks TEXT,
    recorded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payments_tenant ON payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_sale ON payments(sale_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(tenant_id, payment_date);

-- 11. SITE VISITS TABLE
CREATE TABLE IF NOT EXISTS site_visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    requested_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL,
    mobile VARCHAR(50) NOT NULL,
    visit_date DATE NOT NULL,
    visit_time VARCHAR(50) NOT NULL,
    pickup_location TEXT NOT NULL,
    notes TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    driver_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
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
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    period_type VARCHAR(50) DEFAULT 'monthly',
    target_sqft NUMERIC(12, 2) DEFAULT 0,
    target_amount NUMERIC(14, 2) DEFAULT 0,
    target_units INT DEFAULT 0,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sales_targets_user ON sales_targets(tenant_id, user_id, start_date);

-- 13. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
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
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    is_important BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT true,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_announcements_tenant ON announcements(tenant_id);

-- 15. ACTIVITY LOGS TABLE
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(255),
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_tenant ON activity_logs(tenant_id);

-- 16. SUPPORT TICKETS TABLE
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    ticket_number SERIAL,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'open',
    priority VARCHAR(50) DEFAULT 'medium',
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    resolution_notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_tenant ON support_tickets(tenant_id);

-- 17. SUBSCRIPTIONS & BILLING TABLES
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    razorpay_subscription_id VARCHAR(255) UNIQUE NOT NULL,
    plan_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'created',
    current_start TIMESTAMPTZ,
    current_end TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant ON subscriptions(tenant_id);

CREATE TABLE IF NOT EXISTS billing_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    status VARCHAR(50) NOT NULL,
    razorpay_payment_id VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_billing_history_tenant ON billing_history(tenant_id);

-- 18. REFERRAL & AFFILIATE SYSTEM
CREATE TABLE IF NOT EXISTS referral_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    referrer_email VARCHAR(255),
    referrer_commission_percent NUMERIC(5, 2) DEFAULT 10.00,
    referee_discount_percent NUMERIC(5, 2) DEFAULT 10.00,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_by_user_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_referral_campaigns_code ON referral_campaigns(code);
