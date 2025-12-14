/*
  # EMERGENCY: Reset All User Passwords
  
  This script will reset the password for ALL users in the system to '123456'.
  
  WARNING: This is a destructive operation. All existing passwords will be overwritten.
  Ensure you really want to do this before running.
*/

-- 1. Enable pgcrypto extension to generate secure hashes
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Update the encrypted_password for ALL users in auth.users
UPDATE auth.users
SET encrypted_password = crypt('123456', gen_salt('bf'));

-- 3. Optional: Clear any recovery tokens to prevent confusion
UPDATE auth.users
SET recovery_token = NULL,
    confirmation_token = NULL;
