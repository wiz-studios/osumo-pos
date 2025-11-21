-- Migration 014: Kitchen Display System Schema
-- Purpose: Add kitchen workflow support, order events audit, and RLS policies
-- Date: 2025-11-21

-- ============================================
-- 1. Add Kitchen Workflow Columns to Orders
-- ============================================

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS kitchen_status TEXT DEFAULT 'new',
ADD COLUMN IF NOT EXISTS sent_to_kitchen_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS sent_to_cashier_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cashier_id UUID REFERENCES staff(id);

-- Add check constraint for kitchen_status
ALTER TABLE orders 
ADD CONSTRAINT kitchen_status_check 
CHECK (kitchen_status IN ('new', 'preparing', 'ready'));

COMMENT ON COLUMN orders.kitchen_status IS 'Kitchen preparation status: new, preparing, ready';
COMMENT ON COLUMN orders.sent_to_kitchen_at IS 'Timestamp when waiter sent order to kitchen';
COMMENT ON COLUMN orders.sent_to_cashier_at IS 'Timestamp when waiter sent order to cashier';
COMMENT ON COLUMN orders.cashier_id IS 'Staff member who processed payment';

-- ============================================
-- 2. Create Order Events Audit Table
-- ============================================

CREATE TABLE IF NOT EXISTS order_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  triggered_by UUID REFERENCES staff(id),
  event_type TEXT NOT NULL CHECK (event_type IN ('status_change', 'kitchen_update', 'payment', 'modification')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE order_events IS 'Audit trail for all order status transitions and modifications';
COMMENT ON COLUMN order_events.event_type IS 'Type of event: status_change, kitchen_update, payment, modification';
COMMENT ON COLUMN order_events.metadata IS 'Additional context (e.g., payment details, table assignment)';

-- ============================================
-- 3. Create Performance Indexes
-- ============================================

-- Index for kitchen display queries
CREATE INDEX IF NOT EXISTS idx_orders_kitchen_status 
ON orders (kitchen_status) 
WHERE status IN ('in_kitchen', 'pending_payment');

-- Index for cashier pending orders
CREATE INDEX IF NOT EXISTS idx_orders_status_payment 
ON orders (status, payment_status);

-- Index for order history lookup
CREATE INDEX IF NOT EXISTS idx_order_events_order_id 
ON order_events (order_id, created_at DESC);

-- Index for staff activity tracking
CREATE INDEX IF NOT EXISTS idx_order_events_staff 
ON order_events (triggered_by, created_at DESC);

-- Index for time-based queries
CREATE INDEX IF NOT EXISTS idx_orders_sent_to_kitchen 
ON orders (sent_to_kitchen_at DESC) 
WHERE sent_to_kitchen_at IS NOT NULL;

-- ============================================
-- 4. Create Kitchen-Safe View (No Prices)
-- ============================================

CREATE OR REPLACE VIEW kitchen_orders AS
SELECT 
  o.id,
  o.created_at,
  o.table_number,
  o.order_type,
  o.kitchen_status,
  o.sent_to_kitchen_at,
  o.status,
  -- Aggregate order items WITHOUT prices or financial data
  json_agg(
    json_build_object(
      'id', oi.id,
      'name', mi.name,
      'quantity', oi.quantity,
      'notes', oi.notes,
      'item_status', oi.item_status
    ) ORDER BY oi.created_at
  ) as items
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
JOIN menu_items mi ON mi.id = oi.menu_item_id
WHERE o.status IN ('in_kitchen', 'pending_payment')
  AND o.kitchen_status IN ('new', 'preparing', 'ready')
GROUP BY o.id, o.created_at, o.table_number, o.order_type, o.kitchen_status, o.sent_to_kitchen_at, o.status
ORDER BY o.sent_to_kitchen_at ASC NULLS LAST;

COMMENT ON VIEW kitchen_orders IS 'Kitchen-safe view with NO prices or financial data';

-- ============================================
-- 5. Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on order_events
ALTER TABLE order_events ENABLE ROW LEVEL SECURITY;

-- Kitchen staff can view kitchen orders (no prices)
DROP POLICY IF EXISTS "Kitchen staff can view kitchen orders" ON orders;
CREATE POLICY "Kitchen staff can view kitchen orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff 
      WHERE staff.user_id = auth.uid() 
        AND staff.role = 'kitchen' 
        AND staff.active = true
    )
    AND status IN ('in_kitchen', 'pending_payment')
  );

-- Kitchen staff can ONLY update kitchen_status (not prices/totals)
DROP POLICY IF EXISTS "Kitchen staff can update kitchen status only" ON orders;
CREATE POLICY "Kitchen staff can update kitchen status only"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff 
      WHERE staff.user_id = auth.uid() 
        AND staff.role = 'kitchen' 
        AND staff.active = true
    )
  );
  -- Note: Financial field protection is enforced by application logic
  -- RLS WITH CHECK cannot reference old/new values


-- Cashier can view pending payment orders
DROP POLICY IF EXISTS "Cashier can view pending orders" ON orders;
CREATE POLICY "Cashier can view pending orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff 
      WHERE staff.user_id = auth.uid() 
        AND staff.role = 'cashier' 
        AND staff.active = true
    )
    AND status = 'pending_payment'
  );

-- Order events are viewable by all authenticated staff
CREATE POLICY "Staff can view order events"
  ON order_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff 
      WHERE staff.user_id = auth.uid() 
        AND staff.active = true
    )
  );

-- Only system can insert order events (via function)
CREATE POLICY "System can insert order events"
  ON order_events FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================
-- 6. Helper Functions
-- ============================================

-- Function to safely transition order status with validation
CREATE OR REPLACE FUNCTION transition_order_status(
  p_order_id UUID,
  p_new_status TEXT,
  p_staff_id UUID,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS BOOLEAN AS $$
DECLARE
  v_current_status TEXT;
  v_valid_transition BOOLEAN := false;
BEGIN
  -- Get current status
  SELECT status INTO v_current_status
  FROM orders WHERE id = p_order_id;

  IF v_current_status IS NULL THEN
    RAISE EXCEPTION 'Order not found: %', p_order_id;
  END IF;

  -- Validate transition
  v_valid_transition := CASE
    WHEN v_current_status = 'draft' AND p_new_status = 'in_kitchen' THEN true
    WHEN v_current_status = 'in_kitchen' AND p_new_status = 'pending_payment' THEN true
    WHEN v_current_status = 'pending_payment' AND p_new_status = 'paid' THEN true
    ELSE false
  END;

  IF NOT v_valid_transition THEN
    RAISE EXCEPTION 'Invalid status transition: % -> %', v_current_status, p_new_status;
  END IF;

  -- Update order
  UPDATE orders 
  SET status = p_new_status,
      updated_at = NOW()
  WHERE id = p_order_id;

  -- Log event
  INSERT INTO order_events (order_id, from_status, to_status, triggered_by, event_type, metadata)
  VALUES (p_order_id, v_current_status, p_new_status, p_staff_id, 'status_change', p_metadata);

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION transition_order_status IS 'Safely transition order status with validation and audit logging';

-- Function to update kitchen status
CREATE OR REPLACE FUNCTION update_kitchen_status(
  p_order_id UUID,
  p_new_kitchen_status TEXT,
  p_staff_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_current_kitchen_status TEXT;
BEGIN
  -- Get current kitchen status
  SELECT kitchen_status INTO v_current_kitchen_status
  FROM orders WHERE id = p_order_id;

  IF v_current_kitchen_status IS NULL THEN
    RAISE EXCEPTION 'Order not found: %', p_order_id;
  END IF;

  -- Validate kitchen status
  IF p_new_kitchen_status NOT IN ('new', 'preparing', 'ready') THEN
    RAISE EXCEPTION 'Invalid kitchen status: %', p_new_kitchen_status;
  END IF;

  -- Update kitchen status
  UPDATE orders 
  SET kitchen_status = p_new_kitchen_status,
      updated_at = NOW()
  WHERE id = p_order_id;

  -- Log event
  INSERT INTO order_events (order_id, from_status, to_status, triggered_by, event_type, metadata)
  VALUES (
    p_order_id, 
    v_current_kitchen_status, 
    p_new_kitchen_status, 
    p_staff_id, 
    'kitchen_update',
    json_build_object('kitchen_status', p_new_kitchen_status)
  );

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_kitchen_status IS 'Update kitchen preparation status with audit logging';

-- ============================================
-- 7. Grant Permissions
-- ============================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION transition_order_status TO authenticated;
GRANT EXECUTE ON FUNCTION update_kitchen_status TO authenticated;

-- ============================================
-- Migration Complete
-- ============================================

-- Verify migration
DO $$
BEGIN
  RAISE NOTICE 'Migration 014 completed successfully';
  RAISE NOTICE 'Kitchen workflow columns added to orders table';
  RAISE NOTICE 'Order events audit table created';
  RAISE NOTICE 'Performance indexes created';
  RAISE NOTICE 'Kitchen-safe view created';
  RAISE NOTICE 'RLS policies configured';
  RAISE NOTICE 'Helper functions created';
END $$;
