-- Seed initial Super Admin and default Tenant for RealSalePro
INSERT INTO tenants (id, name, slug, settings, subscription_status, plan_tier, is_active)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'SalesPro Core',
    'default-tenant',
    '{"features": {"crm": true, "inventory": true, "reports": true, "site_visits": true, "incentives": true}}'::jsonb,
    'active',
    'enterprise',
    true
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO tenant_roles (id, tenant_id, name, description, permissions, is_system)
VALUES (
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'admin',
    'Full Administrator Access',
    '["all"]'::jsonb,
    true
)
ON CONFLICT DO NOTHING;

INSERT INTO profiles (id, user_id, email, full_name, employee_id, phone, role, tenant_id, role_id, is_active, force_password_change)
VALUES (
    'c0000000-0000-0000-0000-000000000001',
    'admin@realsalepro.com',
    'admin@realsalepro.com',
    'Super Admin',
    'ADM-001',
    '+91-0000000000',
    'platform_admin',
    'a0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    true,
    false
)
ON CONFLICT (email) DO NOTHING;
