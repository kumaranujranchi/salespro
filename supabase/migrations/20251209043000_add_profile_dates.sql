-- Add date fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS dob DATE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS marriage_anniversary DATE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS joining_date DATE DEFAULT NULL;

-- Comment on columns
COMMENT ON COLUMN profiles.dob IS 'Date of Birth of the employee';
COMMENT ON COLUMN profiles.marriage_anniversary IS 'Marriage Anniversary Date';
COMMENT ON COLUMN profiles.joining_date IS 'Date of Joining the company';
