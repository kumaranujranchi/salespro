-- Fix: Allow deleting tenants by cascading delete to user_referrals

ALTER TABLE public.user_referrals
DROP CONSTRAINT IF EXISTS user_referrals_referred_tenant_id_fkey;

ALTER TABLE public.user_referrals
ADD CONSTRAINT user_referrals_referred_tenant_id_fkey
FOREIGN KEY (referred_tenant_id)
REFERENCES public.tenants(id)
ON DELETE CASCADE;
