-- Add force_password_change column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS force_password_change boolean DEFAULT false;

-- Add policy for users to update their own profile
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());