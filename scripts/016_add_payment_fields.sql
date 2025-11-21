-- Migration 016: Add payment tracking fields
-- Purpose: Track payment completion and details
-- Date: 2025-11-21

-- Add paid_at timestamp
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

COMMENT ON COLUMN orders.paid_at IS 'Timestamp when payment was completed';

-- Add payment_details JSONB for flexible payment data
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_details JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN orders.payment_details IS 'Structured payment information (method-specific)';

-- Create index for payment queries
CREATE INDEX IF NOT EXISTS idx_orders_paid_at ON orders(paid_at) WHERE paid_at IS NOT NULL;

-- Migration complete
DO $$
BEGIN
  RAISE NOTICE 'Migration 016 completed successfully';
  RAISE NOTICE 'Added paid_at and payment_details to orders table';
END $$;
