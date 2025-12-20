-- Fix RLS policies for tenants table to allow payment updates
-- This script ensures users can both view and update their tenant's subscription

-- First, let's see what policies exist
-- You can check existing policies with: SELECT * FROM pg_policies WHERE tablename = 'tenants';

-- Drop all existing tenant policies to start fresh
DROP POLICY IF EXISTS "Users can update their own tenant" ON tenants;
DROP POLICY IF EXISTS "Users can update their own tenant subscription" ON tenants;
DROP POLICY IF EXISTS "Users can view their own tenant" ON tenants;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON tenants;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON tenants;

-- Create SELECT policy - Allow users to view their tenant
CREATE POLICY "tenant_select_policy"
ON tenants
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT tenant_id 
    FROM profiles 
    WHERE id = auth.uid()
  )
  OR
  -- Also allow platform admins to see all tenants
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND tenant_id = 'e27f3a62-3c84-4ee7-b202-9e61ef2f1d65f'
  )
);

-- Create UPDATE policy - Allow users to update their tenant subscription
CREATE POLICY "tenant_update_policy"
ON tenants
FOR UPDATE
TO authenticated
USING (
  id IN (
    SELECT tenant_id 
    FROM profiles 
    WHERE id = auth.uid()
  )
)
WITH CHECK (
  id IN (
    SELECT tenant_id 
    FROM profiles 
    WHERE id = auth.uid()
  )
);

-- Verify RLS is enabled
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Show current policies (for verification)
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'tenants';
