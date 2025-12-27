-- Add tenant_id column to notifications table for proper tenant isolation
-- This migration ensures notifications are scoped to tenants

-- Step 1: Add tenant_id column (nullable initially for existing data)
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- Step 2: Backfill tenant_id for existing notifications based on user's tenant
UPDATE notifications n
SET tenant_id = p.tenant_id
FROM profiles p
WHERE n.user_id = p.id
AND n.tenant_id IS NULL;

-- Step 3: Make tenant_id NOT NULL after backfill
ALTER TABLE notifications 
ALTER COLUMN tenant_id SET NOT NULL;

-- Step 4: Add index for performance
CREATE INDEX IF NOT EXISTS idx_notifications_tenant_id ON notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_tenant_user ON notifications(tenant_id, user_id);

-- Step 5: Drop existing RLS policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert their own notifications" ON notifications;

-- Step 6: Create new RLS policies with tenant isolation
CREATE POLICY "Users can view notifications in their tenant"
ON notifications FOR SELECT
USING (
  tenant_id IN (
    SELECT tenant_id FROM profiles WHERE id = auth.uid()
  )
  AND user_id = auth.uid()
);

CREATE POLICY "Users can update their own notifications in their tenant"
ON notifications FOR UPDATE
USING (
  tenant_id IN (
    SELECT tenant_id FROM profiles WHERE id = auth.uid()
  )
  AND user_id = auth.uid()
);

CREATE POLICY "System can insert notifications for tenant users"
ON notifications FOR INSERT
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id FROM profiles WHERE id = auth.uid()
  )
);

-- Step 7: Enable RLS if not already enabled
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

COMMENT ON COLUMN notifications.tenant_id IS 'Tenant ID for multi-tenancy isolation';
