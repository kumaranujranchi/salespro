-- CLEANUP SCRIPT: Reset Referral & Affiliate Test Data
-- WARNING: This will delete ALL data related to referrals, campaigns, commissions, and affiliate accounts.
-- It will also delete TENANTS that were created via a referral link.

BEGIN;

-- 1. Identify tenants that were referred (so we can delete them later)
CREATE TEMP TABLE tenants_to_delete AS
SELECT referred_tenant_id FROM user_referrals WHERE referred_tenant_id IS NOT NULL;

-- 2. Identify affiliate user IDs (to delete their profiles)
CREATE TEMP TABLE affiliates_to_delete AS
SELECT id FROM profiles WHERE role = 'affiliate';

-- 3. Delete from 'commissions' (Dependent on user_referrals)
DELETE FROM commissions;

-- 4. Delete from 'user_referrals' (Links tenants to campaigns)
DELETE FROM user_referrals;

-- 5. Delete from 'referral_campaigns' (The campaigns themselves)
DELETE FROM referral_campaigns;

-- 6. Delete the Tenants that were created via referral
DELETE FROM tenants 
WHERE id IN (SELECT referred_tenant_id FROM tenants_to_delete);

-- 7. Delete Affiliate Profiles
DELETE FROM profiles 
WHERE role = 'affiliate';

-- Note: We cannot delete from auth.users easily via SQL script without superuser privileges or exact knowledge of the auth schema policies in this context. 
-- However, deleting the profile is usually sufficient to "reset" the application state. 
-- The user might need to manually delete the user from the Supabase Auth dashboard if they want to re-register with the EXACT SAME email, 
-- OR we can try a best-effort delete if the user running this has high privileges:
-- DELETE FROM auth.users WHERE id IN (SELECT id FROM affiliates_to_delete);

DROP TABLE tenants_to_delete;
DROP TABLE affiliates_to_delete;

COMMIT;

-- Verify results
SELECT count(*) as campaigns_remaining FROM referral_campaigns;
SELECT count(*) as affiliates_remaining FROM profiles WHERE role = 'affiliate';
SELECT count(*) as referrals_remaining FROM user_referrals;
