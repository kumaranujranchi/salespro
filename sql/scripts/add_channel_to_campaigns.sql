-- Add channel column to referral_campaigns if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'referral_campaigns' AND column_name = 'channel') THEN
        ALTER TABLE referral_campaigns ADD COLUMN channel TEXT;
    END IF;
END $$;
