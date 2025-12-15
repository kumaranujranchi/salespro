-- Assign Platform Admin Role to the Owner
-- Replace 'admin@salespro.com' with your actual email if different.

UPDATE public.profiles
SET role = 'platform_admin'
WHERE email = 'admin@salespro.com';

-- Verify the change
SELECT email, role FROM public.profiles WHERE email = 'admin@salespro.com';
