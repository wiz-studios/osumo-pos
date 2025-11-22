-- Add ready_at column to orders table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'ready_at') THEN
        ALTER TABLE orders ADD COLUMN ready_at TIMESTAMPTZ;
    END IF;
END $$;
