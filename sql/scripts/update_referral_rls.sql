-- Allow authenticated users to insert their own campaigns
DROP POLICY IF EXISTS "Users can create their own campaigns" ON referral_campaigns;
CREATE POLICY "Users can create their own campaigns" ON referral_campaigns
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Allow users to update their own campaigns
DROP POLICY IF EXISTS "Users can update their own campaigns" ON referral_campaigns;
CREATE POLICY "Users can update their own campaigns" ON referral_campaigns
  FOR UPDATE
  USING (auth.uid() = created_by);

-- Allow users to view their own campaigns (in addition to public active ones)
DROP POLICY IF EXISTS "Users can view their own campaigns" ON referral_campaigns;
CREATE POLICY "Users can view their own campaigns" ON referral_campaigns
  FOR SELECT
  USING (auth.uid() = created_by);
