-- Migration 015: Add ready_at timestamp for kitchen workflow
-- Purpose: Track when kitchen marks order as ready for service time analytics
-- Date: 2025-11-21

-- Add ready_at column to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS ready_at TIMESTAMPTZ;

COMMENT ON COLUMN orders.ready_at IS 'Timestamp when kitchen marked order as ready for pickup';

-- Update existing orders that are already ready (backfill)
UPDATE orders 
SET ready_at = updated_at 
WHERE kitchen_status = 'ready' AND ready_at IS NULL;

-- Migration complete
DO $$
BEGIN
  RAISE NOTICE 'Migration 015 completed successfully';
  RAISE NOTICE 'Added ready_at timestamp column to orders table';
END $$;
