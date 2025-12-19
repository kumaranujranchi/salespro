-- Add settings column to tenants table for feature flags and customization
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'settings') THEN
        ALTER TABLE tenants ADD COLUMN settings JSONB DEFAULT '{
            "features": {
                "crm": true,
                "inventory": true,
                "reports": true,
                "site_visits": true,
                "incentives": true
            },
            "appearance": {
                "primary_color": "#1673FF",
                "logo_url": null
            },
            "incentive_plan": {
                "type": "fixed",
                "rules": {}
            }
        }'::jsonb;
    END IF;
END $$;
