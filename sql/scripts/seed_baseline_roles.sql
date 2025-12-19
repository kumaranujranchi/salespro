-- Role Seeding System
-- This function creates standard roles for a given tenant
CREATE OR REPLACE FUNCTION seed_tenant_roles(p_tenant_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 1. Super Admin
    INSERT INTO tenant_roles (tenant_id, name, description, is_system, permissions)
    VALUES (p_tenant_id, 'Super Admin', 'Full system access', true, '{
        "menu": {
            "dashboard": "edit", "crm": "edit", "inventory": "edit", "site_visits": "edit",
            "incentives": "edit", "reports": "edit", "users": "edit", "settings": "edit"
        },
        "dashboard": { 
            "sales_view": "overall",
            "kpi_cards": true, 
            "project_performance": true, 
            "leaderboard": true, 
            "upcoming_events": true,
            "recent_activity": true 
        }
    }') ON CONFLICT (tenant_id, name) DO UPDATE SET permissions = EXCLUDED.permissions;

    -- 2. Admin
    INSERT INTO tenant_roles (tenant_id, name, description, is_system, permissions)
    VALUES (p_tenant_id, 'Admin', 'Daily operations management', true, '{
        "menu": {
            "dashboard": "read", "crm": "edit", "inventory": "read", "site_visits": "edit",
            "incentives": "read", "reports": "read", "users": "edit", "settings": "none"
        },
        "dashboard": { 
            "sales_view": "overall",
            "kpi_cards": true, 
            "project_performance": true, 
            "leaderboard": true, 
            "upcoming_events": true,
            "recent_activity": true 
        }
    }') ON CONFLICT (tenant_id, name) DO UPDATE SET permissions = EXCLUDED.permissions;

    -- 3. Team Leader
    INSERT INTO tenant_roles (tenant_id, name, description, is_system, permissions)
    VALUES (p_tenant_id, 'Team Leader', 'Manage sales teams and leads', true, '{
        "menu": {
            "dashboard": "read", "crm": "edit", "inventory": "read", "site_visits": "edit",
            "incentives": "read", "reports": "read", "users": "none", "settings": "none"
        },
        "dashboard": { 
            "sales_view": "overall",
            "kpi_cards": true, 
            "project_performance": true, 
            "leaderboard": true, 
            "upcoming_events": true,
            "recent_activity": true 
        }
    }') ON CONFLICT (tenant_id, name) DO UPDATE SET permissions = EXCLUDED.permissions;

    -- 4. Sales Executive
    INSERT INTO tenant_roles (tenant_id, name, description, is_system, permissions)
    VALUES (p_tenant_id, 'Sales Executive', 'Direct sales and lead followups', true, '{
        "menu": {
            "dashboard": "read", "crm": "edit", "inventory": "read", "site_visits": "edit",
            "incentives": "none", "reports": "none", "users": "none", "settings": "none"
        },
        "dashboard": { 
            "sales_view": "self",
            "kpi_cards": true, 
            "project_performance": true, 
            "leaderboard": true, 
            "upcoming_events": true,
            "recent_activity": true 
        }
    }') ON CONFLICT (tenant_id, name) DO UPDATE SET permissions = EXCLUDED.permissions;

    -- 5. Accountant
    INSERT INTO tenant_roles (tenant_id, name, description, is_system, permissions)
    VALUES (p_tenant_id, 'Accountant', 'Handle finances and incentives', true, '{
        "menu": {
            "dashboard": "read", "crm": "none", "inventory": "read", "site_visits": "none",
            "incentives": "edit", "reports": "edit", "users": "none", "settings": "none"
        },
        "dashboard": { 
            "sales_view": "overall",
            "kpi_cards": true, 
            "project_performance": true, 
            "leaderboard": false, 
            "upcoming_events": true,
            "recent_activity": false 
        }
    }') ON CONFLICT (tenant_id, name) DO UPDATE SET permissions = EXCLUDED.permissions;

    -- 6. Director
    INSERT INTO tenant_roles (tenant_id, name, description, is_system, permissions)
    VALUES (p_tenant_id, 'Director', 'High-level overview and reports', true, '{
        "menu": {
            "dashboard": "read", "crm": "read", "inventory": "read", "site_visits": "read",
            "incentives": "read", "reports": "read", "users": "none", "settings": "none"
        },
        "dashboard": { 
            "sales_view": "overall",
            "kpi_cards": true, 
            "project_performance": true, 
            "leaderboard": true, 
            "upcoming_events": true,
            "recent_activity": true 
        }
    }') ON CONFLICT (tenant_id, name) DO UPDATE SET permissions = EXCLUDED.permissions;

    -- 7. CRM Staff
    INSERT INTO tenant_roles (tenant_id, name, description, is_system, permissions)
    VALUES (p_tenant_id, 'CRM Staff', 'Customer relationship management', true, '{
        "menu": {
            "dashboard": "read", "crm": "edit", "inventory": "none", "site_visits": "read",
            "incentives": "none", "reports": "none", "users": "none", "settings": "none"
        },
        "dashboard": { 
            "sales_view": "none",
            "kpi_cards": true, 
            "project_performance": false, 
            "leaderboard": false, 
            "upcoming_events": true,
            "recent_activity": true 
        }
    }') ON CONFLICT (tenant_id, name) DO UPDATE SET permissions = EXCLUDED.permissions;

    -- 8. Receptionist
    INSERT INTO tenant_roles (tenant_id, name, description, is_system, permissions)
    VALUES (p_tenant_id, 'Receptionist', 'Front desk and initial inquiries', true, '{
        "menu": {
            "dashboard": "read", "crm": "read", "inventory": "none", "site_visits": "read",
            "incentives": "none", "reports": "none", "users": "none", "settings": "none"
        },
        "dashboard": { 
            "sales_view": "none",
            "kpi_cards": false, 
            "project_performance": false, 
            "leaderboard": false, 
            "upcoming_events": true,
            "recent_activity": true 
        }
    }') ON CONFLICT (tenant_id, name) DO UPDATE SET permissions = EXCLUDED.permissions;

    -- 9. Driver
    INSERT INTO tenant_roles (tenant_id, name, description, is_system, permissions)
    VALUES (p_tenant_id, 'Driver', 'Site visit logistics', true, '{
        "menu": {
            "dashboard": "none", "crm": "none", "inventory": "none", "site_visits": "read",
            "incentives": "none", "reports": "none", "users": "none", "settings": "none"
        },
        "dashboard": { 
            "sales_view": "none",
            "kpi_cards": false, 
            "project_performance": false, 
            "leaderboard": false, 
            "upcoming_events": false,
            "recent_activity": false 
        }
    }') ON CONFLICT (tenant_id, name) DO UPDATE SET permissions = EXCLUDED.permissions;
END;
$$;

-- Trigger to seed roles on new tenant creation
CREATE OR REPLACE FUNCTION on_tenant_created_seed_roles()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM seed_tenant_roles(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_seed_roles ON tenants;
CREATE TRIGGER trigger_seed_roles
AFTER INSERT ON tenants
FOR EACH ROW EXECUTE FUNCTION on_tenant_created_seed_roles();

-- BACKFILL: Seed roles for existing tenants
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT id FROM tenants LOOP
        PERFORM seed_tenant_roles(r.id);
    END LOOP;
END $$;

-- Update existing profiles to link to the new system roles
UPDATE profiles p
SET role_id = tr.id
FROM tenant_roles tr
WHERE p.tenant_id = tr.tenant_id
AND tr.name = CASE 
    WHEN p.role = 'super_admin' THEN 'Super Admin'
    WHEN p.role = 'admin' THEN 'Admin'
    WHEN p.role = 'team_leader' THEN 'Team Leader'
    WHEN p.role = 'sales_executive' THEN 'Sales Executive'
    WHEN p.role = 'accountant' THEN 'Accountant'
    WHEN p.role = 'director' THEN 'Director'
    WHEN p.role = 'crm_staff' THEN 'CRM Staff'
    WHEN p.role = 'receptionist' THEN 'Receptionist'
    WHEN p.role = 'driver' THEN 'Driver'
END;
