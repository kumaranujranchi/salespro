-- Add force_password_change column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS force_password_change boolean DEFAULT false;

-- Update RLS if needed, though existing policies usually cover all columns unless specified otherwise.
-- Just to be safe, ensuring authenticated users can view this field on their own profile
-- and admins can view/edit it on others.

-- Existing select policy "Users can view all active profiles" covers select *
-- or the new "Users can view profiles based on role and status" covers it.

-- Ensure admins can update this field (e.g. set it to true for password reset)
-- Existing update policy "Super admins and admins can update profiles" covers update.

-- Ensure users can update THEIR OWN profile to set it to false after change.
-- We might need a policy for users to update their own profile?
-- Currently: "Super admins and admins can update profiles"
-- We need: "Users can update their own profile" (specifically force_password_change, image_url, etc)

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
