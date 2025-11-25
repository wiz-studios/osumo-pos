-- Add Kenyan Drinks Menu to POS
-- This script adds a complete non-alcoholic drinks menu with inventory linking

-- Step 1: Add "Drinks" category
INSERT INTO menu_categories (restaurant_id, name, display_order, is_visible)
SELECT 
    id as restaurant_id,
    'Drinks' as name,
    (SELECT COALESCE(MAX(display_order), 0) + 1 FROM menu_categories WHERE restaurant_id = restaurants.id) as display_order,
    true as is_visible
FROM restaurants
WHERE NOT EXISTS (
    SELECT 1 FROM menu_categories 
    WHERE name = 'Drinks' AND restaurant_id = restaurants.id
)
LIMIT 1;

-- Step 2: Add inventory items for drinks
DO $$
DECLARE
    v_restaurant_id UUID;
    v_drinks_category_id UUID;
BEGIN
    -- Get restaurant and category IDs
    SELECT id INTO v_restaurant_id FROM restaurants LIMIT 1;
    SELECT id INTO v_drinks_category_id FROM menu_categories WHERE name = 'Drinks' LIMIT 1;

    -- Add bottled drinks inventory
    INSERT INTO inventory_items (restaurant_id, name, unit, quantity_in_stock, reorder_level, unit_cost, supplier)
    VALUES
        (v_restaurant_id, 'Coca-Cola 500ml', 'bottle', 100, 20, 50, 'Nairobi Beverages Ltd'),
        (v_restaurant_id, 'Fanta Orange 500ml', 'bottle', 80, 20, 50, 'Nairobi Beverages Ltd'),
        (v_restaurant_id, 'Sprite 500ml', 'bottle', 80, 20, 50, 'Nairobi Beverages Ltd'),
        (v_restaurant_id, 'Krest Soda 500ml', 'bottle', 60, 15, 40, 'Nairobi Beverages Ltd'),
        (v_restaurant_id, 'Stoney Tangawizi 500ml', 'bottle', 100, 25, 60, 'Nairobi Beverages Ltd')
    ON CONFLICT DO NOTHING;

    -- Add hot drinks ingredients
    INSERT INTO inventory_items (restaurant_id, name, unit, quantity_in_stock, reorder_level, unit_cost, supplier)
    VALUES
        (v_restaurant_id, 'Tea Leaves', 'kg', 5, 1, 400, 'Kericho Tea'),
        (v_restaurant_id, 'Coffee (Nescafé)', 'kg', 2, 0.5, 800, 'Local Market'),
        (v_restaurant_id, 'Milk', 'litre', 20, 5, 60, 'Brookside Dairy'),
        (v_restaurant_id, 'Sugar', 'kg', 10, 2, 120, 'Mumias Sugar')
    ON CONFLICT DO NOTHING;

    -- Add fresh juice ingredients
    INSERT INTO inventory_items (restaurant_id, name, unit, quantity_in_stock, reorder_level, unit_cost, supplier)
    VALUES
        (v_restaurant_id, 'Mango', 'kg', 15, 3, 150, 'Wakulima Market'),
        (v_restaurant_id, 'Passion Fruit', 'kg', 10, 2, 200, 'Wakulima Market'),
        (v_restaurant_id, 'Watermelon', 'kg', 20, 5, 80, 'Wakulima Market'),
        (v_restaurant_id, 'Orange', 'kg', 12, 3, 100, 'Wakulima Market')
    ON CONFLICT DO NOTHING;

    -- Add traditional drinks ingredients
    INSERT INTO inventory_items (restaurant_id, name, unit, quantity_in_stock, reorder_level, unit_cost, supplier)
    VALUES
        (v_restaurant_id, 'Mursik (Fermented Milk)', 'litre', 5, 1, 150, 'Local Supplier'),
        (v_restaurant_id, 'Mageu Mix', 'kg', 3, 1, 180, 'Local Market')
    ON CONFLICT DO NOTHING;

    -- Step 3: Add menu items

    -- HOT DRINKS
    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, cost_price, prep_time_minutes, available, image_url)
    VALUES
        (v_restaurant_id, v_drinks_category_id, 'Chai (Tea)', 'Spiced Kenyan tea with milk', 50, 15, 5, true, 'https://images.unsplash.com/photo-1597318112841-a6431e0fcc97?w=400'),
        (v_restaurant_id, v_drinks_category_id, 'Coffee (Nescafé)', 'Black or with milk', 60, 20, 5, true, 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400'),
        (v_restaurant_id, v_drinks_category_id, 'Mahamri + Chai', 'Coastal breakfast combo', 100, 40, 10, true, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400'),
        (v_restaurant_id, v_drinks_category_id, 'Mandazi + Chai', 'Classic Kenyan breakfast', 80, 30, 10, true, 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=400')
    ON CONFLICT DO NOTHING;

    -- SOFT DRINKS
    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, cost_price, prep_time_minutes, available, image_url)
    VALUES
        (v_restaurant_id, v_drinks_category_id, 'Coca-Cola 500ml', 'Ice-cold Coke', 100, 50, 1, true, 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400'),
        (v_restaurant_id, v_drinks_category_id, 'Fanta Orange', 'Refreshing orange soda', 100, 50, 1, true, 'https://images.unsplash.com/photo-1624517452488-04869289c4ca?w=400'),
        (v_restaurant_id, v_drinks_category_id, 'Sprite', 'Lemon-lime refreshment', 100, 50, 1, true, 'https://images.unsplash.com/photo-1625772452859-1c03d5bf1137?w=400'),
        (v_restaurant_id, v_drinks_category_id, 'Krest Soda', 'Affordable soda water', 80, 40, 1, true, 'https://images.unsplash.com/photo-1581006852262-e4307cf6283a?w=400'),
        (v_restaurant_id, v_drinks_category_id, 'Stoney Tangawizi', 'Iconic Kenyan ginger beer', 120, 60, 1, true, 'https://images.unsplash.com/photo-1546173159-315724a31696?w=400')
    ON CONFLICT DO NOTHING;

    -- FRESH JUICES
    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, cost_price, prep_time_minutes, available, image_url)
    VALUES
        (v_restaurant_id, v_drinks_category_id, 'Fresh Mango Juice', 'Seasonal fresh mango blend', 180, 80, 5, true, 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400'),
        (v_restaurant_id, v_drinks_category_id, 'Passion Juice', 'Tangy passion fruit juice', 150, 60, 5, true, 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400'),
        (v_restaurant_id, v_drinks_category_id, 'Watermelon Juice', 'Refreshing watermelon juice', 120, 50, 5, true, 'https://images.unsplash.com/photo-1587049352846-4a222e784fbb?w=400'),
        (v_restaurant_id, v_drinks_category_id, 'Mixed Fruit Juice', 'Premium fruit blend', 200, 90, 7, true, 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400')
    ON CONFLICT DO NOTHING;

    -- TRADITIONAL DRINKS
    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, cost_price, prep_time_minutes, available, image_url)
    VALUES
        (v_restaurant_id, v_drinks_category_id, 'Mursik', 'Kalenjin fermented milk in gourd', 80, 30, 2, true, 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400'),
        (v_restaurant_id, v_drinks_category_id, 'Mageu', 'Fermented maize drink', 60, 25, 2, true, 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400')
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Drinks menu and inventory added successfully!';
END $$;

-- Step 4: Link menu items to inventory (recipe_ingredients)
DO $$
DECLARE
    v_restaurant_id UUID;
    v_chai_id UUID;
    v_coffee_id UUID;
    v_mango_juice_id UUID;
    v_passion_juice_id UUID;
    v_watermelon_juice_id UUID;
    v_mixed_juice_id UUID;
    v_mursik_id UUID;
    v_mageu_id UUID;
    v_coke_id UUID;
    v_fanta_id UUID;
    v_sprite_id UUID;
    v_krest_id UUID;
    v_stoney_id UUID;
    
    -- Inventory IDs
    v_tea_leaves_inv UUID;
    v_milk_inv UUID;
    v_sugar_inv UUID;
    v_coffee_inv UUID;
    v_mango_inv UUID;
    v_passion_inv UUID;
    v_watermelon_inv UUID;
    v_orange_inv UUID;
    v_mursik_inv UUID;
    v_mageu_inv UUID;
    v_coke_inv UUID;
    v_fanta_inv UUID;
    v_sprite_inv UUID;
    v_krest_inv UUID;
    v_stoney_inv UUID;
BEGIN
    SELECT id INTO v_restaurant_id FROM restaurants LIMIT 1;

    -- Get menu item IDs
    SELECT id INTO v_chai_id FROM menu_items WHERE name = 'Chai (Tea)' LIMIT 1;
    SELECT id INTO v_coffee_id FROM menu_items WHERE name = 'Coffee (Nescafé)' LIMIT 1;
    SELECT id INTO v_mango_juice_id FROM menu_items WHERE name = 'Fresh Mango Juice' LIMIT 1;
    SELECT id INTO v_passion_juice_id FROM menu_items WHERE name = 'Passion Juice' LIMIT 1;
    SELECT id INTO v_watermelon_juice_id FROM menu_items WHERE name = 'Watermelon Juice' LIMIT 1;
    SELECT id INTO v_mixed_juice_id FROM menu_items WHERE name = 'Mixed Fruit Juice' LIMIT 1;
    SELECT id INTO v_mursik_id FROM menu_items WHERE name = 'Mursik' LIMIT 1;
    SELECT id INTO v_mageu_id FROM menu_items WHERE name = 'Mageu' LIMIT 1;
    SELECT id INTO v_coke_id FROM menu_items WHERE name = 'Coca-Cola 500ml' LIMIT 1;
    SELECT id INTO v_fanta_id FROM menu_items WHERE name = 'Fanta Orange' LIMIT 1;
    SELECT id INTO v_sprite_id FROM menu_items WHERE name = 'Sprite' LIMIT 1;
    SELECT id INTO v_krest_id FROM menu_items WHERE name = 'Krest Soda' LIMIT 1;
    SELECT id INTO v_stoney_id FROM menu_items WHERE name = 'Stoney Tangawizi' LIMIT 1;

    -- Get inventory IDs
    SELECT id INTO v_tea_leaves_inv FROM inventory_items WHERE name = 'Tea Leaves' LIMIT 1;
    SELECT id INTO v_milk_inv FROM inventory_items WHERE name = 'Milk' LIMIT 1;
    SELECT id INTO v_sugar_inv FROM inventory_items WHERE name = 'Sugar' LIMIT 1;
    SELECT id INTO v_coffee_inv FROM inventory_items WHERE name = 'Coffee (Nescafé)' LIMIT 1;
    SELECT id INTO v_mango_inv FROM inventory_items WHERE name = 'Mango' LIMIT 1;
    SELECT id INTO v_passion_inv FROM inventory_items WHERE name = 'Passion Fruit' LIMIT 1;
    SELECT id INTO v_watermelon_inv FROM inventory_items WHERE name = 'Watermelon' LIMIT 1;
    SELECT id INTO v_orange_inv FROM inventory_items WHERE name = 'Orange' LIMIT 1;
    SELECT id INTO v_mursik_inv FROM inventory_items WHERE name = 'Mursik (Fermented Milk)' LIMIT 1;
    SELECT id INTO v_mageu_inv FROM inventory_items WHERE name = 'Mageu Mix' LIMIT 1;
    SELECT id INTO v_coke_inv FROM inventory_items WHERE name = 'Coca-Cola 500ml' LIMIT 1;
    SELECT id INTO v_fanta_inv FROM inventory_items WHERE name = 'Fanta Orange 500ml' LIMIT 1;
    SELECT id INTO v_sprite_inv FROM inventory_items WHERE name = 'Sprite 500ml' LIMIT 1;
    SELECT id INTO v_krest_inv FROM inventory_items WHERE name = 'Krest Soda 500ml' LIMIT 1;
    SELECT id INTO v_stoney_inv FROM inventory_items WHERE name = 'Stoney Tangawizi 500ml' LIMIT 1;

    -- Link Chai (Tea)
    IF v_chai_id IS NOT NULL THEN
        INSERT INTO recipe_ingredients (restaurant_id, menu_item_id, inventory_item_id, quantity_required)
        VALUES
            (v_restaurant_id, v_chai_id, v_tea_leaves_inv, 0.005),
            (v_restaurant_id, v_chai_id, v_milk_inv, 0.05),
            (v_restaurant_id, v_chai_id, v_sugar_inv, 0.01)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Link Coffee
    IF v_coffee_id IS NOT NULL THEN
        INSERT INTO recipe_ingredients (restaurant_id, menu_item_id, inventory_item_id, quantity_required)
        VALUES
            (v_restaurant_id, v_coffee_id, v_coffee_inv, 0.01),
            (v_restaurant_id, v_coffee_id, v_milk_inv, 0.05),
            (v_restaurant_id, v_coffee_id, v_sugar_inv, 0.01)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Link Fresh Juices
    IF v_mango_juice_id IS NOT NULL THEN
        INSERT INTO recipe_ingredients (restaurant_id, menu_item_id, inventory_item_id, quantity_required)
        VALUES
            (v_restaurant_id, v_mango_juice_id, v_mango_inv, 0.2),
            (v_restaurant_id, v_mango_juice_id, v_sugar_inv, 0.02)
        ON CONFLICT DO NOTHING;
    END IF;

    IF v_passion_juice_id IS NOT NULL THEN
        INSERT INTO recipe_ingredients (restaurant_id, menu_item_id, inventory_item_id, quantity_required)
        VALUES
            (v_restaurant_id, v_passion_juice_id, v_passion_inv, 0.15),
            (v_restaurant_id, v_passion_juice_id, v_sugar_inv, 0.02)
        ON CONFLICT DO NOTHING;
    END IF;

    IF v_watermelon_juice_id IS NOT NULL THEN
        INSERT INTO recipe_ingredients (restaurant_id, menu_item_id, inventory_item_id, quantity_required)
        VALUES (v_restaurant_id, v_watermelon_juice_id, v_watermelon_inv, 0.3)
        ON CONFLICT DO NOTHING;
    END IF;

    IF v_mixed_juice_id IS NOT NULL THEN
        INSERT INTO recipe_ingredients (restaurant_id, menu_item_id, inventory_item_id, quantity_required)
        VALUES
            (v_restaurant_id, v_mixed_juice_id, v_mango_inv, 0.1),
            (v_restaurant_id, v_mixed_juice_id, v_orange_inv, 0.1),
            (v_restaurant_id, v_mixed_juice_id, v_passion_inv, 0.05),
            (v_restaurant_id, v_mixed_juice_id, v_sugar_inv, 0.02)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Link Traditional Drinks
    IF v_mursik_id IS NOT NULL THEN
        INSERT INTO recipe_ingredients (restaurant_id, menu_item_id, inventory_item_id, quantity_required)
        VALUES (v_restaurant_id, v_mursik_id, v_mursik_inv, 0.25)
        ON CONFLICT DO NOTHING;
    END IF;

    IF v_mageu_id IS NOT NULL THEN
        INSERT INTO recipe_ingredients (restaurant_id, menu_item_id, inventory_item_id, quantity_required)
        VALUES (v_restaurant_id, v_mageu_id, v_mageu_inv, 0.2)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Link Bottled Drinks (1:1 mapping)
    IF v_coke_id IS NOT NULL THEN
        INSERT INTO recipe_ingredients (restaurant_id, menu_item_id, inventory_item_id, quantity_required)
        VALUES (v_restaurant_id, v_coke_id, v_coke_inv, 1)
        ON CONFLICT DO NOTHING;
    END IF;

    IF v_fanta_id IS NOT NULL THEN
        INSERT INTO recipe_ingredients (restaurant_id, menu_item_id, inventory_item_id, quantity_required)
        VALUES (v_restaurant_id, v_fanta_id, v_fanta_inv, 1)
        ON CONFLICT DO NOTHING;
    END IF;

    IF v_sprite_id IS NOT NULL THEN
        INSERT INTO recipe_ingredients (restaurant_id, menu_item_id, inventory_item_id, quantity_required)
        VALUES (v_restaurant_id, v_sprite_id, v_sprite_inv, 1)
        ON CONFLICT DO NOTHING;
    END IF;

    IF v_krest_id IS NOT NULL THEN
        INSERT INTO recipe_ingredients (restaurant_id, menu_item_id, inventory_item_id, quantity_required)
        VALUES (v_restaurant_id, v_krest_id, v_krest_inv, 1)
        ON CONFLICT DO NOTHING;
    END IF;

    IF v_stoney_id IS NOT NULL THEN
        INSERT INTO recipe_ingredients (restaurant_id, menu_item_id, inventory_item_id, quantity_required)
        VALUES (v_restaurant_id, v_stoney_id, v_stoney_inv, 1)
        ON CONFLICT DO NOTHING;
    END IF;

    RAISE NOTICE 'Recipe ingredients linked successfully!';
END $$;

-- Verify the additions
SELECT 
    mc.name as category,
    mi.name as menu_item,
    mi.price,
    mi.cost_price,
    COUNT(ri.id) as ingredients_linked
FROM menu_items mi
JOIN menu_categories mc ON mi.category_id = mc.id
LEFT JOIN recipe_ingredients ri ON mi.id = ri.menu_item_id
WHERE mc.name = 'Drinks'
GROUP BY mc.name, mi.name, mi.price, mi.cost_price
ORDER BY mi.price;
