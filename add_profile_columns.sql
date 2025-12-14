-- Add missing columns to profiles table to match frontend
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS dob date,
ADD COLUMN IF NOT EXISTS marriage_anniversary date,
ADD COLUMN IF NOT EXISTS joining_date date;

-- Force schema cache reload
NOTIFY pgrst, 'reload config';
