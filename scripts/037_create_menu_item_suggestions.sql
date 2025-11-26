-- ============================================
-- Menu Item Suggestions Migration Script
-- Creates table for upselling/cross-selling suggestions
-- ============================================

-- Step 1: Create table
CREATE TABLE IF NOT EXISTS menu_item_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  trigger_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  suggested_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
  suggestion_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure at least one suggestion type is present
  CONSTRAINT check_suggestion_content CHECK (
    suggested_item_id IS NOT NULL OR suggestion_message IS NOT NULL
  )
);

-- Step 2: Create indexes
CREATE INDEX IF NOT EXISTS idx_suggestions_restaurant ON menu_item_suggestions(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_trigger ON menu_item_suggestions(trigger_item_id);

-- Step 3: Enable RLS
ALTER TABLE menu_item_suggestions ENABLE ROW LEVEL SECURITY;

-- Step 4: Create Policies
-- View policy
CREATE POLICY "suggestions_view_policy" ON menu_item_suggestions
  FOR SELECT USING (
    restaurant_id IN (
      SELECT restaurant_id FROM staff WHERE user_id = auth.uid()
    )
    OR
    restaurant_id IN (
      SELECT restaurant_id FROM staff WHERE id = (current_setting('app.current_staff_id', true)::uuid)
    )
  );

-- Manage policy (admin only - simplified for now to allow authenticated staff)
CREATE POLICY "suggestions_manage_policy" ON menu_item_suggestions
  FOR ALL USING (
    restaurant_id IN (
      SELECT restaurant_id FROM staff WHERE user_id = auth.uid()
    )
  );

-- Step 5: Add comments
COMMENT ON TABLE menu_item_suggestions IS 'Configuration for upselling suggestions in POS';
COMMENT ON COLUMN menu_item_suggestions.trigger_item_id IS 'The item that triggers the suggestion when added to cart';
COMMENT ON COLUMN menu_item_suggestions.suggested_item_id IS 'Specific item to suggest (optional)';
COMMENT ON COLUMN menu_item_suggestions.suggestion_message IS 'Custom message to display (optional)';

SELECT 'Menu item suggestions table created successfully!' AS status;
