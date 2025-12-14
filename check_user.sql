-- Check if Admin User Exists
SELECT 
    id, 
    email, 
    role, 
    created_at, 
    last_sign_in_at 
FROM auth.users 
WHERE email = 'admin@salespro.com';

-- Check if Profile Exists
SELECT 
    id, 
    full_name, 
    role 
FROM public.profiles 
WHERE email = 'admin@salespro.com';
