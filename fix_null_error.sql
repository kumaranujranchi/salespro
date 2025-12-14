-- FIX: "converting NULL to string is unsupported"
-- The GoTrue (Auth) service is crashing because it finds NULL in columns where it expects strings.
-- This script safely updates those NULLs to empty strings.

BEGIN;

-- 1. Fix email_change (The main culprit from your logs)
UPDATE auth.users 
SET email_change = '' 
WHERE email_change IS NULL;

-- 2. Fix other potential token columns that might cause the same crash
UPDATE auth.users 
SET email_change_token_new = '' 
WHERE email_change_token_new IS NULL;

UPDATE auth.users 
SET recovery_token = '' 
WHERE recovery_token IS NULL;

UPDATE auth.users 
SET confirmation_token = '' 
WHERE confirmation_token IS NULL;

-- 3. Ensure the admin user is active and confirmed
UPDATE auth.users
SET email_confirmed_at = now(),
    updated_at = now()
WHERE email = 'admin@salespro.com';

COMMIT;

-- Force config reload (just in case)
NOTIFY pgrst, 'reload config';
