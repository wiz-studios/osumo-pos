-- 036_add_requires_id_to_menu_items.sql
ALTER TABLE menu_items 
ADD COLUMN IF NOT EXISTS requires_id BOOLEAN DEFAULT false;

-- Backfill existing items (all non-alcohol)
UPDATE menu_items 
SET requires_id = false 
WHERE requires_id IS NULL;
