-- Fix Non-Alcoholic Drinks Issues
-- 1. Re-add missing drinks (Chai, Coffee, Mahamri, Mandazi)
-- 2. Re-link all non-alcoholic drinks to inventory
-- 3. Fix Mixed Fruit Juice inventory link

DO $$
DECLARE
    v_restaurant_id UUID;
    v_drinks_category_id UUID;
    
    -- Menu item IDs
    v_chai_id UUID;
    v_coffee_id UUID;
    v_mahamri_id UUID;
    v_mandazi_id UUID;
    v_mageu_id UUID;
    v_krest_id UUID;
    v_mursik_id UUID;
    v_sprite_id UUID;
    v_coke_id UUID;
    v_fanta_id UUID;
    v_stoney_id UUID;
    v_watermelon_id UUID;
    v_passion_id UUID;
    v_mixed_id UUID;
    
    -- Inventory IDs
    v_tea_inv UUID;
    v_milk_inv UUID;
    v_sugar_inv UUID;
    v_coffee_inv UUID;
    v_mageu_inv UUID;
    v_krest_inv UUID;
    v_mursik_inv UUID;
    v_sprite_inv UUID;
    v_coke_inv UUID;
    v_fanta_inv UUID;
    v_stoney_inv UUID;
    v_watermelon_inv UUID;
    v_passion_inv UUID;
    v_mango_inv UUID;
    v_orange_inv UUID;
BEGIN
    SELECT id INTO v_restaurant_id FROM restaurants LIMIT 1;
    SELECT id INTO v_drinks_category_id FROM menu_categories WHERE name = 'Drinks' LIMIT 1;

    -- Get inventory IDs
    SELECT id INTO v_tea_inv FROM inventory_items WHERE name = 'Tea Leaves' LIMIT 1;
    SELECT id INTO v_milk_inv FROM inventory_items WHERE name = 'Milk' LIMIT 1;
    SELECT id INTO v_sugar_inv FROM inventory_items WHERE name = 'Sugar' LIMIT 1;
    SELECT id INTO v_coffee_inv FROM inventory_items WHERE name LIKE 'Coffee%' LIMIT 1;
    SELECT id INTO v_mageu_inv FROM inventory_items WHERE name LIKE 'Mageu%' LIMIT 1;
    SELECT id INTO v_krest_inv FROM inventory_items WHERE name LIKE 'Krest%' LIMIT 1;
    SELECT id INTO v_mursik_inv FROM inventory_items WHERE name LIKE 'Mursik%' LIMIT 1;
    SELECT id INTO v_sprite_inv FROM inventory_items WHERE name LIKE 'Sprite%' LIMIT 1;
    SELECT id INTO v_coke_inv FROM inventory_items WHERE name LIKE 'Coca-Cola%' LIMIT 1;
    SELECT id INTO v_fanta_inv FROM inventory_items WHERE name LIKE 'Fanta%' LIMIT 1;
    SELECT id INTO v_stoney_inv FROM inventory_items WHERE name LIKE 'Stoney%' LIMIT 1;
    SELECT id INTO v_watermelon_inv FROM inventory_items WHERE name = 'Watermelon' LIMIT 1;
    SELECT id INTO v_passion_inv FROM inventory_items WHERE name = 'Passion Fruit' LIMIT 1;
    SELECT id INTO v_mango_inv FROM inventory_items WHERE name = 'Mango' LIMIT 1;
    SELECT id INTO v_orange_inv FROM inventory_items WHERE name = 'Orange' LIMIT 1;

    -- Re-add missing hot drinks
    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, cost_price, prep_time_minutes, available, image_url)
    VALUES
        (v_restaurant_id, v_drinks_category_id, 'Chai (Tea)', 'Spiced Kenyan tea with milk', 60, 20, 5, true, 'https://images.unsplash.com/photo-1597318112841-a6431e0fcc97?w=400'),
        (v_restaurant_id, v_drinks_category_id, 'Coffee (Nescafé)', 'Black or with milk', 60, 20, 5, true, 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400'),
        (v_restaurant_id, v_drinks_category_id, 'Mahamri + Chai', 'Coastal breakfast combo', 100, 40, 10, true, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400'),
        (v_restaurant_id, v_drinks_category_id, 'Mandazi + Chai', 'Classic Kenyan breakfast', 80, 30, 10, true, 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=400')
    ON CONFLICT DO NOTHING;

    -- Get menu item IDs
    SELECT id INTO v_chai_id FROM menu_items WHERE name = 'Chai (Tea)' LIMIT 1;
    SELECT id INTO v_coffee_id FROM menu_items WHERE name LIKE 'Coffee%' LIMIT 1;
    SELECT id INTO v_mahamri_id FROM menu_items WHERE name = 'Mahamri + Chai' LIMIT 1;
    SELECT id INTO v_mandazi_id FROM menu_items WHERE name = 'Mandazi + Chai' LIMIT 1;
    SELECT id INTO v_mageu_id FROM menu_items WHERE name = 'Mageu' LIMIT 1;
    SELECT id INTO v_krest_id FROM menu_items WHERE name = 'Krest Soda' LIMIT 1;
    SELECT id INTO v_mursik_id FROM menu_items WHERE name = 'Mursik' LIMIT 1;
    SELECT id INTO v_sprite_id FROM menu_items WHERE name = 'Sprite' LIMIT 1;
    SELECT id INTO v_coke_id FROM menu_items WHERE name LIKE 'Coca-Cola%' LIMIT 1;
    SELECT id INTO v_fanta_id FROM menu_items WHERE name = 'Fanta Orange' LIMIT 1;
    SELECT id INTO v_stoney_id FROM menu_items WHERE name LIKE 'Stoney%' LIMIT 1;
    SELECT id INTO v_watermelon_id FROM menu_items WHERE name = 'Watermelon Juice' LIMIT 1;
    SELECT id INTO v_passion_id FROM menu_items WHERE name = 'Passion Juice' LIMIT 1;
    SELECT id INTO v_mixed_id FROM menu_items WHERE name = 'Mixed Fruit Juice' LIMIT 1;

    -- Link Chai
    IF v_chai_id IS NOT NULL THEN
        DELETE FROM recipe_ingredients WHERE menu_item_id = v_chai_id;
        INSERT INTO recipe_ingredients (restaurant_id, menu_item_id, inventory_item_id, quantity_required)
        VALUES
            (v_restaurant_id, v_chai_id, v_tea_inv, 0.005),
            (v_restaurant_id, v_chai_id, v_milk_inv, 0.05),
            (v_restaurant_id, v_chai_id, v_sugar_inv, 0.01);
    END IF;

    -- Link Coffee
    IF v_coffee_id IS NOT NULL THEN
        DELETE FROM recipe_ingredients WHERE menu_item_id = v_coffee_id;
        INSERT INTO recipe_ingredients (restaurant_id, menu_item_id, inventory_item_id, quantity_required)
        VALUES
            (v_restaurant_id, v_coffee_id, v_coffee_inv, 0.01),
            (v_restaurant_id, v_coffee_id, v_milk_inv, 0.05),
            (v_restaurant_id, v_coffee_id, v_sugar_inv, 0.01);
    END IF;

    -- Link Mahamri + Chai
    IF v_mahamri_id IS NOT NULL THEN
        DELETE FROM recipe_ingredients WHERE menu_item_id = v_mahamri_id;
        INSERT INTO recipe_ingredients (restaurant_id, menu_item_id, inventory_item_id, quantity_required)
        VALUES
            (v_restaurant_id, v_mahamri_id, v_tea_inv, 0.005),
            (v_restaurant_id, v_mahamri_id, v_milk_inv, 0.05),
            (v_restaurant_id, v_mahamri_id, v_sugar_inv, 0.01);
    END IF;

    -- Link Mandazi + Chai
    IF v_mandazi_id IS NOT NULL THEN
        DELETE FROM recipe_ingredients WHERE menu_item_id = v_mandazi_id;
        INSERT INTO recipe_ingredients (restaurant_id, menu_item_id, inventory_item_id, quantity_required)
        VALUES
            (v_restaurant_id, v_mandazi_id, v_tea_inv, 0.005),
            (v_restaurant_id, v_mandazi_id, v_milk_inv, 0.05),
            (v_restaurant_id, v_mandazi_id, v_sugar_inv, 0.01);
    END IF;

    -- Link bottled drinks (1:1)
    IF v_mageu_id IS NOT NULL AND v_mageu_inv IS NOT NULL THEN
        INSERT INTO recipe_ingredients (restaurant_id, menu_item_id, inventory_item_id, quantity_required)
        VALUES (v_restaurant_id, v_mageu_id, v_mageu_inv, 0.2) ON CONFLICT DO NOTHING;
    END IF;

    IF v_krest_id IS NOT NULL AND v_krest_inv IS NOT NULL THEN
        INSERT INTO recipe_ingredients (restaurant_id, menu_item_id, inventory_item_id, quantity_required)
        VALUES (v_restaurant_id, v_krest_id, v_krest_inv, 1) ON CONFLICT DO NOTHING;
    END IF;

    IF v_mursik_id IS NOT NULL AND v_mursik_inv IS NOT NULL THEN
        INSERT INTO recipe_ingredients (restaurant_id, menu_item_id, inventory_item_id, quantity_required)
        VALUES (v_restaurant_id, v_mursik_id, v_mursik_inv, 0.25) ON CONFLICT DO NOTHING;
    END IF;

    IF v_sprite_id IS NOT NULL AND v_sprite_inv IS NOT NULL THEN
        INSERT INTO recipe_ingredients (restaurant_id, menu_item_id, inventory_item_id, quantity_required)
        VALUES (v_restaurant_id, v_sprite_id, v_sprite_inv, 1) ON CONFLICT DO NOTHING;
    END IF;

    IF v_coke_id IS NOT NULL AND v_coke_inv IS NOT NULL THEN
        INSERT INTO recipe_ingredients (restaurant_id, menu_item_id, inventory_item_id, quantity_required)
        VALUES (v_restaurant_id, v_coke_id, v_coke_inv, 1) ON CONFLICT DO NOTHING;
    END IF;

    IF v_fanta_id IS NOT NULL AND v_fanta_inv IS NOT NULL THEN
        INSERT INTO recipe_ingredients (restaurant_id, menu_item_id, inventory_item_id, quantity_required)
        VALUES (v_restaurant_id, v_fanta_id, v_fanta_inv, 1) ON CONFLICT DO NOTHING;
    END IF;

    IF v_stoney_id IS NOT NULL AND v_stoney_inv IS NOT NULL THEN
        INSERT INTO recipe_ingredients (restaurant_id, menu_item_id, inventory_item_id, quantity_required)
        VALUES (v_restaurant_id, v_stoney_id, v_stoney_inv, 1) ON CONFLICT DO NOTHING;
    END IF;

    -- Link juices
    IF v_watermelon_id IS NOT NULL AND v_watermelon_inv IS NOT NULL THEN
        INSERT INTO recipe_ingredients (restaurant_id, menu_item_id, inventory_item_id, quantity_required)
        VALUES (v_restaurant_id, v_watermelon_id, v_watermelon_inv, 0.3) ON CONFLICT DO NOTHING;
    END IF;

    IF v_passion_id IS NOT NULL AND v_passion_inv IS NOT NULL THEN
        DELETE FROM recipe_ingredients WHERE menu_item_id = v_passion_id;
        INSERT INTO recipe_ingredients (restaurant_id, menu_item_id, inventory_item_id, quantity_required)
        VALUES
            (v_restaurant_id, v_passion_id, v_passion_inv, 0.15),
            (v_restaurant_id, v_passion_id, v_sugar_inv, 0.02);
    END IF;

    IF v_mixed_id IS NOT NULL THEN
        DELETE FROM recipe_ingredients WHERE menu_item_id = v_mixed_id;
        INSERT INTO recipe_ingredients (restaurant_id, menu_item_id, inventory_item_id, quantity_required)
        VALUES
            (v_restaurant_id, v_mixed_id, v_mango_inv, 0.1),
            (v_restaurant_id, v_mixed_id, v_orange_inv, 0.1),
            (v_restaurant_id, v_mixed_id, v_passion_inv, 0.05),
            (v_restaurant_id, v_mixed_id, v_sugar_inv, 0.02);
    END IF;

    RAISE NOTICE 'Non-alcoholic drinks fixed and re-linked!';
END $$;

-- Verify the fix
SELECT 
    mi.name,
    mi.price,
    CASE 
        WHEN mi.price >= 220 THEN 'Alcoholic'
        ELSE 'Non-Alcoholic'
    END as type,
    COUNT(ri.id) as inventory_linked
FROM menu_items mi
JOIN menu_categories mc ON mi.category_id = mc.id
LEFT JOIN recipe_ingredients ri ON mi.id = ri.menu_item_id
WHERE mc.name = 'Drinks'
GROUP BY mi.name, mi.price
ORDER BY mi.price;

-- Show summary
SELECT 
    COUNT(*) as total_drinks,
    COUNT(*) FILTER (WHERE mi.price < 220) as non_alcoholic,
    COUNT(*) FILTER (WHERE mi.price >= 220) as alcoholic
FROM menu_items mi
JOIN menu_categories mc ON mi.category_id = mc.id
WHERE mc.name = 'Drinks';
