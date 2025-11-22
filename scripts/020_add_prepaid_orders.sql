-- Migration 020: Add Prepaid Order Support
-- Purpose: Enable payment-before-preparation for takeaway orders
-- Date: 2025-11-22

-- ============================================
-- 1. Add Prepaid Column to Orders Table
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'is_prepaid') THEN
        ALTER TABLE orders ADD COLUMN is_prepaid BOOLEAN DEFAULT FALSE;
        COMMENT ON COLUMN orders.is_prepaid IS 'True if payment required before kitchen preparation (takeaway orders)';
    END IF;
END $$;

-- ============================================
-- 2. Create Performance Index
-- ============================================

DROP INDEX IF EXISTS idx_orders_prepaid;
CREATE INDEX idx_orders_prepaid ON orders(is_prepaid) WHERE is_prepaid = TRUE;

-- ============================================
-- 3. Add Validation Check
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_prepaid_is_takeaway') THEN
        ALTER TABLE orders
        ADD CONSTRAINT check_prepaid_is_takeaway
        CHECK (
            (is_prepaid = FALSE) OR 
            (is_prepaid = TRUE AND order_type = 'takeaway')
        );
        COMMENT ON CONSTRAINT check_prepaid_is_takeaway ON orders IS 'Prepaid orders must be takeaway type';
    END IF;
END $$;

-- ============================================
-- Migration Complete
-- ============================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 020 completed successfully';
  RAISE NOTICE 'Added is_prepaid column to orders table';
  RAISE NOTICE 'Created performance index for prepaid orders';
  RAISE NOTICE 'Added validation: prepaid orders must be takeaway';
  RAISE NOTICE '';
  RAISE NOTICE '🔄 Order Flow:';
  RAISE NOTICE '  Dine-in: Waiter → Kitchen → Ready → Cashier → Paid';
  RAISE NOTICE '  Prepaid: Waiter → Cashier → Paid → Kitchen → Ready';
END $$;
