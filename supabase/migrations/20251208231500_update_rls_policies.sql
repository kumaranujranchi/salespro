-- Update RLS policies for profiles to allow admins to view inactive users

DROP POLICY IF EXISTS "Users can view all active profiles" ON profiles;

CREATE POLICY "Users can view profiles based on role and status"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    is_active = true
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'admin')
    )
  );

-- Ensure update policy allows updating inactive users (already covered by existing policy but checking correctness)
-- Existing: "Super admins and admins can update profiles" ... USING (EXISTS(... admin ...))
-- This seems fine as it doesn't restrict by target row's is_active status, only the user's role.

-- Add index on is_active for performance
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);
