-- Create subscriptions table for tracking Razorpay subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    razorpay_subscription_id TEXT UNIQUE NOT NULL,
    razorpay_plan_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'created', -- created, authenticated, active, paused, halted, cancelled, completed, expired
    current_start TIMESTAMPTZ,
    current_end TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    charge_at TIMESTAMPTZ,
    start_at TIMESTAMPTZ,
    end_at TIMESTAMPTZ,
    auth_attempts INTEGER DEFAULT 0,
    total_count INTEGER,
    paid_count INTEGER DEFAULT 0,
    remaining_count INTEGER,
    short_url TEXT,
    customer_notify BOOLEAN DEFAULT true,
    quantity INTEGER DEFAULT 1,
    notes JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create billing_history table for payment tracking
CREATE TABLE IF NOT EXISTS billing_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    razorpay_payment_id TEXT UNIQUE,
    razorpay_order_id TEXT,
    razorpay_invoice_id TEXT,
    amount INTEGER NOT NULL, -- Amount in paise
    currency TEXT DEFAULT 'INR',
    status TEXT NOT NULL, -- created, authorized, captured, refunded, failed
    method TEXT, -- card, netbanking, wallet, upi
    description TEXT,
    email TEXT,
    contact TEXT,
    fee INTEGER, -- Razorpay fee in paise
    tax INTEGER, -- Tax in paise
    error_code TEXT,
    error_description TEXT,
    notes JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant_id ON subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_razorpay_id ON subscriptions(razorpay_subscription_id);
CREATE INDEX IF NOT EXISTS idx_billing_history_tenant_id ON billing_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_billing_history_subscription_id ON billing_history(subscription_id);
CREATE INDEX IF NOT EXISTS idx_billing_history_status ON billing_history(status);

-- Add subscription_id to tenants table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'subscription_id') THEN
        ALTER TABLE tenants ADD COLUMN subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'razorpay_customer_id') THEN
        ALTER TABLE tenants ADD COLUMN razorpay_customer_id TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'next_billing_date') THEN
        ALTER TABLE tenants ADD COLUMN next_billing_date TIMESTAMPTZ;
    END IF;
END $$;

-- Add RLS policies
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_history ENABLE ROW LEVEL SECURITY;

-- Subscriptions policies
CREATE POLICY "Users can view their tenant's subscriptions"
    ON subscriptions FOR SELECT
    USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "System can manage subscriptions"
    ON subscriptions FOR ALL
    USING (true)
    WITH CHECK (true);

-- Billing history policies
CREATE POLICY "Users can view their tenant's billing history"
    ON billing_history FOR SELECT
    USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "System can manage billing history"
    ON billing_history FOR ALL
    USING (true)
    WITH CHECK (true);

-- Function to update subscription status
CREATE OR REPLACE FUNCTION update_subscription_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update tenant's subscription status based on subscription status
    UPDATE tenants
    SET 
        subscription_status = CASE
            WHEN NEW.status IN ('active', 'authenticated') THEN 'active'
            WHEN NEW.status IN ('paused', 'halted') THEN 'paused'
            WHEN NEW.status IN ('cancelled', 'completed', 'expired') THEN 'cancelled'
            ELSE 'trial'
        END,
        is_active = CASE
            WHEN NEW.status IN ('active', 'authenticated') THEN true
            ELSE false
        END,
        next_billing_date = NEW.current_end,
        updated_at = NOW()
    WHERE id = NEW.tenant_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update tenant status
DROP TRIGGER IF EXISTS trigger_update_subscription_status ON subscriptions;
CREATE TRIGGER trigger_update_subscription_status
    AFTER INSERT OR UPDATE OF status ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_subscription_status();

COMMENT ON TABLE subscriptions IS 'Tracks Razorpay subscription details for each tenant';
COMMENT ON TABLE billing_history IS 'Records all payment transactions and billing events';
