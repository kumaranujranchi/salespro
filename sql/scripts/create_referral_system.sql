-- Create referral_campaigns table
CREATE TABLE IF NOT EXISTS referral_campaigns (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  referrer_commission_percent NUMERIC(5,2) DEFAULT 20.00,
  referee_discount_percent NUMERIC(5,2) DEFAULT 10.00,
  max_referrals INTEGER, -- Optional limit
  valid_until TIMESTAMPTZ, -- Optional expiration
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_referrals table (Links a new tenant/user to a referrer)
CREATE TABLE IF NOT EXISTS user_referrals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  campaign_id UUID REFERENCES referral_campaigns(id),
  referrer_id UUID REFERENCES profiles(id), -- Who referred
  referred_tenant_id UUID REFERENCES tenants(id), -- Who was referred (The new tenant)
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'converted', 'expired')),
  converted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create commissions table (Ledger of earnings)
CREATE TABLE IF NOT EXISTS commissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  referral_id UUID REFERENCES user_referrals(id),
  referrer_id UUID REFERENCES profiles(id),
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  transaction_reference TEXT, -- Link to payment/withdrawal if needed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE referral_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;

-- Policies for referral_campaigns
-- Platform admins can do everything
CREATE POLICY "Platform admins can manage campaigns" ON referral_campaigns
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND role = 'platform_admin'
    )
  );

-- Public read access for validating codes (e.g., during signup)
CREATE POLICY "Anyone can read active campaigns" ON referral_campaigns
  FOR SELECT
  USING (is_active = true);


-- Policies for user_referrals
-- Platform admins view all
CREATE POLICY "Platform admins view all referrals" ON user_referrals
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND role = 'platform_admin'
    )
  );

-- Referrers can view their own referrals
CREATE POLICY "Referrers view their own referrals" ON user_referrals
  FOR SELECT
  USING (referrer_id = auth.uid());


-- Policies for commissions
-- Platform admins view all
CREATE POLICY "Platform admins view all commissions" ON commissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND role = 'platform_admin'
    )
  );

-- Users can view their own commissions
CREATE POLICY "Users view their own commissions" ON commissions
  FOR SELECT
  USING (referrer_id = auth.uid());

-- Triggers for updated_at
CREATE TRIGGER update_referral_campaigns_modtime
    BEFORE UPDATE ON referral_campaigns
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_user_referrals_modtime
    BEFORE UPDATE ON user_referrals
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_commissions_modtime
    BEFORE UPDATE ON commissions
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();
