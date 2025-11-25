-- Fix Mandazi + Chai ingredient linking

DO $$
DECLARE
    v_restaurant_id UUID;
    v_mandazi_chai_id UUID;
    v_tea_leaves_inv UUID;
    v_milk_inv UUID;
    v_sugar_inv UUID;
BEGIN
    -- Get IDs
    SELECT id INTO v_restaurant_id FROM restaurants LIMIT 1;
    SELECT id INTO v_mandazi_chai_id FROM menu_items WHERE name = 'Mandazi + Chai' LIMIT 1;
    SELECT id INTO v_tea_leaves_inv FROM inventory_items WHERE name = 'Tea Leaves' LIMIT 1;
    SELECT id INTO v_milk_inv FROM inventory_items WHERE name = 'Milk' LIMIT 1;
    SELECT id INTO v_sugar_inv FROM inventory_items WHERE name = 'Sugar' LIMIT 1;

    -- Link ingredients
    IF v_mandazi_chai_id IS NOT NULL THEN
        INSERT INTO recipe_ingredients (restaurant_id, menu_item_id, inventory_item_id, quantity_required)
        VALUES
            (v_restaurant_id, v_mandazi_chai_id, v_tea_leaves_inv, 0.005),
            (v_restaurant_id, v_mandazi_chai_id, v_milk_inv, 0.05),
            (v_restaurant_id, v_mandazi_chai_id, v_sugar_inv, 0.01)
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Linked Mandazi + Chai to ingredients';
    END IF;
END $$;

-- Verify
SELECT 
    mi.name as menu_item,
    mi.price,
    COUNT(ri.id) as ingredients_linked
FROM menu_items mi
LEFT JOIN recipe_ingredients ri ON mi.id = ri.menu_item_id
WHERE mi.name = 'Mandazi + Chai'
GROUP BY mi.name, mi.price;
