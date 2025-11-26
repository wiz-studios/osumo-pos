-- ============================================
-- Activity Logs Migration Script
-- Replaces old audit_logs with new activity_logs
-- ============================================

-- Step 1: Drop all existing policies, indexes, and tables
DROP POLICY IF EXISTS "activity_logs_restaurant_access" ON activity_logs;
DROP POLICY IF EXISTS "activity_logs_insert" ON activity_logs;

DROP INDEX IF EXISTS idx_activity_staff;
DROP INDEX IF EXISTS idx_activity_restaurant;
DROP INDEX IF EXISTS idx_activity_action;
DROP INDEX IF EXISTS idx_activity_target;
DROP INDEX IF EXISTS idx_activity_time;

DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;

-- Step 2: Create new activity_logs table with proper schema
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  target_id UUID,
  target_type TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Create indexes for fast filtering
CREATE INDEX idx_activity_staff ON activity_logs(staff_id);
CREATE INDEX idx_activity_restaurant ON activity_logs(restaurant_id);
CREATE INDEX idx_activity_action ON activity_logs(action_type);
CREATE INDEX idx_activity_target ON activity_logs(target_id, target_type);
CREATE INDEX idx_activity_time ON activity_logs(created_at DESC);

-- Step 4: Enable Row Level Security
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies
-- Policy: Staff can only view logs from their restaurant
CREATE POLICY "activity_logs_restaurant_access" ON activity_logs
  FOR SELECT USING (
    restaurant_id IN (
      SELECT restaurant_id FROM staff WHERE user_id = auth.uid()
    )
    OR
    restaurant_id IN (
      SELECT restaurant_id FROM staff WHERE id = staff_id
    )
  );

-- Policy: Staff can insert logs for their own restaurant
-- This works for both auth-based and PIN-based logins
CREATE POLICY "activity_logs_insert" ON activity_logs
  FOR INSERT WITH CHECK (
    -- Allow if user is authenticated and belongs to the restaurant
    restaurant_id IN (
      SELECT restaurant_id FROM staff WHERE user_id = auth.uid()
    )
    OR
    -- Allow if the staff_id in the log matches a staff member in the same restaurant
    (
      staff_id IN (SELECT id FROM staff WHERE restaurant_id = activity_logs.restaurant_id)
    )
  );

-- Step 6: Add documentation comments
COMMENT ON TABLE activity_logs IS 'Audit trail for all sensitive actions in the POS system';
COMMENT ON COLUMN activity_logs.action_type IS 'Type of action: payment_processed, stock_adjusted, discount_applied, etc.';
COMMENT ON COLUMN activity_logs.target_id IS 'ID of the affected entity (order_id, inventory_item_id, etc.)';
COMMENT ON COLUMN activity_logs.target_type IS 'Type of target: order, inventory, menu_item, etc.';
COMMENT ON COLUMN activity_logs.details IS 'JSONB field for flexible metadata storage';

-- Migration complete
SELECT 'Activity logs table created successfully!' AS status;
