-- Add cancellation fields to sales table
ALTER TABLE sales
ADD COLUMN IF NOT EXISTS booking_status text DEFAULT 'booked' CHECK (booking_status IN ('booked', 'cancelled')),
ADD COLUMN IF NOT EXISTS cancellation_reason text,
ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
ADD COLUMN IF NOT EXISTS cancelled_by uuid REFERENCES profiles(id);

COMMENT ON COLUMN sales.booking_status IS 'Status of the booking: booked or cancelled';
COMMENT ON COLUMN sales.cancellation_reason IS 'Reason provided for cancellation';
COMMENT ON COLUMN sales.cancelled_at IS 'Timestamp when the sale was cancelled';
COMMENT ON COLUMN sales.cancelled_by IS 'User who performed the cancellation';
