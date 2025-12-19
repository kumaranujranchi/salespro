-- Comprehensive Role Management System
-- 1. Create tenant_roles table
CREATE TABLE IF NOT EXISTS tenant_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT false, -- If true, it's a predefined role
    permissions JSONB DEFAULT '{
        "menu": {
            "dashboard": "read",
            "crm": "none",
            "inventory": "none",
            "reports": "none",
            "site_visits": "none",
            "incentives": "none",
            "users": "none",
            "settings": "none"
        },
        "dashboard": {
            "sales_data": false,
            "kpi_cards": true,
            "recent_activity": true
        }
    }'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, name)
);

-- 2. Add role_id to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES tenant_roles(id) ON DELETE SET NULL;

-- 3. RLS Policies for tenant_roles
ALTER TABLE tenant_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin can manage roles"
ON tenant_roles
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND (profiles.role = 'super_admin' OR profiles.role = 'platform_admin')
        AND profiles.tenant_id = tenant_roles.tenant_id
    )
);

CREATE POLICY "All tenant users can read roles"
ON tenant_roles
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.tenant_id = tenant_roles.tenant_id
    )
);

-- 4. Audit Log Function for Roles (Basic version)
CREATE TABLE IF NOT EXISTS role_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    actor_id UUID REFERENCES profiles(id),
    action TEXT NOT NULL,
    role_name TEXT,
    old_permissions JSONB,
    new_permissions JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
