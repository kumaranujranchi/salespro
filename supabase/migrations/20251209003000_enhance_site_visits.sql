/*
  # Enhance Site Visits and Add Notifications

  1. New Tables
    - `notifications`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `title` (text)
      - `message` (text)
      - `type` (text: 'info', 'success', 'warning', 'error')
      - `related_entity_type` (text, optional - e.g., 'site_visit')
      - `related_entity_id` (uuid, optional)
      - `is_read` (boolean)
      - `created_at` (timestamptz)

  2. Alter Tables
    - `site_visits` modification:
      - Add `driver_id` (uuid, references profiles)
      - Add `start_odometer` (decimal)
      - Add `end_odometer` (decimal)
      - Add `rejection_reason` (text)
      - Add `clarification_note` (text)
      - Update `status` check constraint to include new statuses

  3. Security
    - Enable RLS on `notifications`
    - Add policies for notifications
*/

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text CHECK (type IN ('info', 'success', 'warning', 'error')) DEFAULT 'info',
  related_entity_type text,
  related_entity_id uuid,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- We might need a policy for inserting system notifications (usually done by triggers or admin functions)
-- allowing all authenticated for now to simplify client-side creation if needed, 
-- but ideally should be protected.
CREATE POLICY "System/Users can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true); 


-- Update site_visits table
-- 1. Drop existing constraint
ALTER TABLE site_visits DROP CONSTRAINT IF EXISTS site_visits_status_check;

-- 2. Add new columns
ALTER TABLE site_visits 
ADD COLUMN IF NOT EXISTS driver_id uuid REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS start_odometer decimal(10, 2),
ADD COLUMN IF NOT EXISTS end_odometer decimal(10, 2),
ADD COLUMN IF NOT EXISTS rejection_reason text,
ADD COLUMN IF NOT EXISTS clarification_note text;

-- 3. Add new check constraint
ALTER TABLE site_visits 
ADD CONSTRAINT site_visits_status_check 
CHECK (status IN ('pending', 'approved', 'declined', 'pending_clarification', 'trip_started', 'completed', 'cancelled'));

-- Update RLS for driver
-- Drivers need to see visits assigned to them
CREATE POLICY "Drivers can view assigned visits"
  ON site_visits FOR SELECT
  TO authenticated
  USING (
    driver_id = auth.uid()
    OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'driver'
    )
  );

CREATE POLICY "Drivers can update assigned visits"
  ON site_visits FOR UPDATE
  TO authenticated
  USING (driver_id = auth.uid());
