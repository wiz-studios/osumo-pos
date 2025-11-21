-- Migration 019: Receipt Storage & Retrieval System
-- Purpose: Permanent, immutable storage of KRA-compliant receipts
-- Date: 2025-11-21

-- Add receipt tracking columns to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS receipt_number TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS receipt_generated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS receipt_data JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS waiter_id UUID REFERENCES staff(id);

-- Add comments for documentation
COMMENT ON COLUMN orders.receipt_number IS 'Unique KRA-compliant receipt/invoice number (KRA-YYYYMMDD-XXXXXX)';
COMMENT ON COLUMN orders.receipt_generated_at IS 'Timestamp when receipt was generated (immutable)';
COMMENT ON COLUMN orders.receipt_data IS 'Complete receipt snapshot (items, payment, staff, business info) - IMMUTABLE';
COMMENT ON COLUMN orders.waiter_id IS 'Staff member who took the order';

-- Create indexes for fast receipt retrieval
CREATE INDEX IF NOT EXISTS idx_orders_receipt_number ON orders(receipt_number) WHERE receipt_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_receipt_generated_at ON orders(receipt_generated_at DESC) WHERE receipt_generated_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_cashier_paid ON orders(cashier_id, paid_at DESC) WHERE paid_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_table_paid ON orders(table_number, paid_at DESC) WHERE paid_at IS NOT NULL;

-- Create audit log for receipt access (compliance & security)
CREATE TABLE IF NOT EXISTS receipt_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id),
    receipt_number TEXT NOT NULL,
    accessed_by UUID REFERENCES staff(id),
    access_type TEXT NOT NULL, -- 'view', 'print', 'reprint'
    accessed_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address TEXT,
    user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_receipt_access_logs_order ON receipt_access_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_receipt_access_logs_accessed_at ON receipt_access_logs(accessed_at DESC);

COMMENT ON TABLE receipt_access_logs IS 'Audit trail for receipt viewing/reprinting (KRA compliance)';

-- Enable RLS on receipt_access_logs
ALTER TABLE receipt_access_logs ENABLE ROW LEVEL SECURITY;

-- Allow anon to insert access logs
CREATE POLICY "anon_receipt_logs_insert" ON receipt_access_logs
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anon to view access logs (for admin reporting)
CREATE POLICY "anon_receipt_logs_select" ON receipt_access_logs
  FOR SELECT
  TO anon
  USING (true);

-- Create function to ensure receipt immutability
CREATE OR REPLACE FUNCTION prevent_receipt_modification()
RETURNS TRIGGER AS $$
BEGIN
    -- Once receipt is generated, prevent any changes to receipt data
    IF OLD.receipt_generated_at IS NOT NULL 
       AND (OLD.receipt_data IS DISTINCT FROM NEW.receipt_data 
            OR OLD.receipt_number IS DISTINCT FROM NEW.receipt_number
            OR OLD.receipt_generated_at IS DISTINCT FROM NEW.receipt_generated_at) 
    THEN
        RAISE EXCEPTION 'Receipt data is immutable once generated (KRA compliance)';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce receipt immutability
DROP TRIGGER IF EXISTS enforce_receipt_immutability ON orders;
CREATE TRIGGER enforce_receipt_immutability
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION prevent_receipt_modification();

DO $$
BEGIN
  RAISE NOTICE 'Migration 019 completed successfully';
  RAISE NOTICE 'Added receipt storage columns and immutability protection';
END $$;
