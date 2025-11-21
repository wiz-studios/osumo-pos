-- Migration 017: Cashier RLS policies
-- Purpose: Role-based access control for cashiers
-- Date: 2025-11-21

-- Cashiers can view pending orders
CREATE POLICY "cashiers_view_pending"
ON orders FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM staff
    WHERE staff.user_id = auth.uid()
    AND staff.role = 'cashier'
  )
  AND status = 'pending_payment'
);

-- Cashiers can update orders to paid status
CREATE POLICY "cashiers_complete_payment"
ON orders FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM staff
    WHERE staff.user_id = auth.uid()
    AND staff.role = 'cashier'
  )
  AND status = 'pending_payment'
)
WITH CHECK (
  status = 'paid' AND payment_status = 'paid'
);

-- Migration complete
DO $$
BEGIN
  RAISE NOTICE 'Migration 017 completed successfully';
  RAISE NOTICE 'Added cashier RLS policies';
END $$;
