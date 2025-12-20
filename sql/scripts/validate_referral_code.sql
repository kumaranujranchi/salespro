-- RPC function to validate a referral code
CREATE OR REPLACE FUNCTION validate_referral_code(code_input TEXT)
RETURNS TABLE (
  campaign_id UUID,
  discount_percent NUMERIC,
  referrer_commission_percent NUMERIC,
  is_valid BOOLEAN,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  campaign_record RECORD;
BEGIN
  -- Search for active campaign
  SELECT * INTO campaign_record
  FROM referral_campaigns
  WHERE code = code_input
  AND is_active = true;

  IF campaign_record IS NULL THEN
    RETURN QUERY SELECT 
      NULL::UUID, 
      NULL::NUMERIC, 
      NULL::NUMERIC, 
      false, 
      'Invalid or inactive referral code';
    RETURN;
  END IF;

  -- Optional: Check expiration
  IF campaign_record.valid_until IS NOT NULL AND campaign_record.valid_until < NOW() THEN
     RETURN QUERY SELECT 
      NULL::UUID, 
      NULL::NUMERIC, 
      NULL::NUMERIC, 
      false, 
      'Referral code has expired';
     RETURN;
  END IF;

  -- Return success
  RETURN QUERY SELECT 
    campaign_record.id, 
    campaign_record.referee_discount_percent, 
    campaign_record.referrer_commission_percent, 
    true, 
    'Code applied successfully';
END;
$$;
