-- ============================================
-- Seed Menu Item Suggestions
-- Adds sample upselling configurations
-- ============================================

-- Function to safely insert a suggestion
DO $$
DECLARE
    v_restaurant_id UUID;
    v_beef_stew_id UUID;
    v_rice_id UUID;
    v_chicken_id UUID;
    v_fries_id UUID;
    v_soda_id UUID;
BEGIN
    -- Get the first restaurant
    SELECT id INTO v_restaurant_id FROM restaurants LIMIT 1;

    -- Get Item IDs (Adjust names to match your actual menu items)
    SELECT id INTO v_beef_stew_id FROM menu_items WHERE restaurant_id = v_restaurant_id AND name ILIKE '%Beef Stew%' LIMIT 1;
    SELECT id INTO v_rice_id FROM menu_items WHERE restaurant_id = v_restaurant_id AND name ILIKE '%Rice%' LIMIT 1;
    SELECT id INTO v_chicken_id FROM menu_items WHERE restaurant_id = v_restaurant_id AND name ILIKE '%Chicken%' LIMIT 1;
    SELECT id INTO v_fries_id FROM menu_items WHERE restaurant_id = v_restaurant_id AND name ILIKE '%Fries%' LIMIT 1;
    SELECT id INTO v_soda_id FROM menu_items WHERE restaurant_id = v_restaurant_id AND name ILIKE '%Soda%' LIMIT 1;

    -- Insert Suggestion: Beef Stew -> Rice
    IF v_beef_stew_id IS NOT NULL AND v_rice_id IS NOT NULL THEN
        INSERT INTO menu_item_suggestions (restaurant_id, trigger_item_id, suggested_item_id, suggestion_message)
        VALUES (v_restaurant_id, v_beef_stew_id, v_rice_id, 'Best served with Steamed Rice!');
    END IF;

    -- Insert Suggestion: Chicken -> Fries
    IF v_chicken_id IS NOT NULL AND v_fries_id IS NOT NULL THEN
        INSERT INTO menu_item_suggestions (restaurant_id, trigger_item_id, suggested_item_id, suggestion_message)
        VALUES (v_restaurant_id, v_chicken_id, v_fries_id, 'Add a side of Fries?');
    END IF;

    -- Insert Suggestion: Fries -> Soda (Message only example)
    IF v_fries_id IS NOT NULL THEN
        INSERT INTO menu_item_suggestions (restaurant_id, trigger_item_id, suggestion_message)
        VALUES (v_restaurant_id, v_fries_id, 'Don''t forget a cold drink!');
    END IF;

END $$;

SELECT 'Seeded menu item suggestions successfully!' AS status;
