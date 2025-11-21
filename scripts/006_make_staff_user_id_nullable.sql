-- Make user_id nullable in staff table to support PIN-only staff members
ALTER TABLE staff ALTER COLUMN user_id DROP NOT NULL;

-- Drop the unique constraint if it exists (since multiple nulls are allowed, but good to be safe)
-- Note: In Postgres, unique constraints allow multiple nulls, but we might want to check if there's a specific index
ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_user_id_key;

-- Add a unique constraint for user_id only where it is not null
CREATE UNIQUE INDEX IF NOT EXISTS idx_staff_user_id_unique ON staff(user_id) WHERE user_id IS NOT NULL;
