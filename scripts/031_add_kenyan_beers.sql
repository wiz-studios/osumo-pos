-- Add Kenyan Beers & Alcoholic Beverages to Drinks Menu
-- ⚠️ WARNING: These are alcoholic beverages - requires valid liquor license in Kenya

DO $$
DECLARE
    v_restaurant_id UUID;
    v_drinks_category_id UUID;
BEGIN
    -- Get restaurant and category IDs
    SELECT id INTO v_restaurant_id FROM restaurants LIMIT 1;
    SELECT id INTO v_drinks_category_id FROM menu_categories WHERE name = 'Drinks' LIMIT 1;

    -- Add bottled beer inventory items
    INSERT INTO inventory_items (restaurant_id, name, unit, quantity_in_stock, reorder_level, unit_cost, supplier)
    VALUES
        -- Tusker variants
        (v_restaurant_id, 'Tusker Lager 500ml', 'bottle', 100, 20, 120, 'EABL Distributors'),
        (v_restaurant_id, 'Tusker Lite 500ml', 'bottle', 80, 15, 120, 'EABL Distributors'),
        (v_restaurant_id, 'Tusker Malt 500ml', 'bottle', 60, 15, 130, 'EABL Distributors'),
        (v_restaurant_id, 'Tusker Safari 500ml', 'bottle', 50, 10, 125, 'EABL Distributors'),
        (v_restaurant_id, 'Tusker Cider 330ml', 'bottle', 40, 10, 140, 'EABL Distributors'),
        
        -- Guinness variants
        (v_restaurant_id, 'Guinness Foreign Extra Stout 500ml', 'bottle', 80, 15, 150, 'EABL Distributors'),
        (v_restaurant_id, 'Guinness Smooth 500ml', 'bottle', 60, 15, 150, 'EABL Distributors'),
        
        -- White Cap variants
        (v_restaurant_id, 'White Cap Lager 500ml', 'bottle', 70, 15, 110, 'EABL Distributors'),
        
        -- Pilsner variants
        (v_restaurant_id, 'Pilsner Lager 500ml', 'bottle', 90, 20, 115, 'EABL Distributors'),
        (v_restaurant_id, 'Pilsner Ice 500ml', 'bottle', 50, 10, 120, 'EABL Distributors'),
        
        -- Senator
        (v_restaurant_id, 'Senator Cold 500ml', 'bottle', 60, 15, 100, 'EABL Distributors'),
        
        -- Bell Lager
        (v_restaurant_id, 'Bell Lager 500ml', 'bottle', 50, 10, 110, 'Uganda Breweries'),
        
        -- International brands
        (v_restaurant_id, 'Heineken 330ml', 'bottle', 60, 15, 180, 'International Distributors'),
        (v_restaurant_id, 'Budweiser 330ml', 'bottle', 40, 10, 200, 'International Distributors'),
        (v_restaurant_id, 'Corona 330ml', 'bottle', 30, 10, 220, 'International Distributors'),
        (v_restaurant_id, 'Smirnoff Ice 275ml', 'bottle', 50, 10, 160, 'EABL Distributors')
    ON CONFLICT DO NOTHING;

    -- Add beer menu items
    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, cost_price, prep_time_minutes, available, image_url)
    VALUES
        -- Tusker variants (KES 250-300)
        (v_restaurant_id, v_drinks_category_id, 'Tusker Lager', 'Kenya''s favorite lager beer', 250, 120, 1, true, 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400'),
        (v_restaurant_id, v_drinks_category_id, 'Tusker Lite', 'Light and refreshing lager', 250, 120, 1, true, 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400'),
        (v_restaurant_id, v_drinks_category_id, 'Tusker Malt', 'Premium malt lager', 280, 130, 1, true, 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400'),
        (v_restaurant_id, v_drinks_category_id, 'Tusker Safari', 'Classic safari lager', 260, 125, 1, true, 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400'),
        (v_restaurant_id, v_drinks_category_id, 'Tusker Cider', 'Crisp apple cider', 300, 140, 1, true, 'https://images.unsplash.com/photo-1570689628268-f2c0c49e29c5?w=400'),
        
        -- Guinness variants (KES 320-350)
        (v_restaurant_id, v_drinks_category_id, 'Guinness Foreign Extra Stout', 'Rich and bold stout', 350, 150, 1, true, 'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400'),
        (v_restaurant_id, v_drinks_category_id, 'Guinness Smooth', 'Smooth and creamy stout', 350, 150, 1, true, 'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400'),
        
        -- White Cap (KES 230)
        (v_restaurant_id, v_drinks_category_id, 'White Cap Lager', 'Crisp and clean lager', 230, 110, 1, true, 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400'),
        
        -- Pilsner variants (KES 240-260)
        (v_restaurant_id, v_drinks_category_id, 'Pilsner Lager', 'Classic pilsner beer', 240, 115, 1, true, 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400'),
        (v_restaurant_id, v_drinks_category_id, 'Pilsner Ice', 'Extra cold pilsner', 260, 120, 1, true, 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400'),
        
        -- Senator (KES 220)
        (v_restaurant_id, v_drinks_category_id, 'Senator Cold', 'Affordable cold beer', 220, 100, 1, true, 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400'),
        
        -- Bell Lager (KES 230)
        (v_restaurant_id, v_drinks_category_id, 'Bell Lager', 'Ugandan premium lager', 230, 110, 1, true, 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400'),
        
        -- International brands (KES 400-500)
        (v_restaurant_id, v_drinks_category_id, 'Heineken', 'Dutch premium lager', 400, 180, 1, true, 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400'),
        (v_restaurant_id, v_drinks_category_id, 'Budweiser', 'American premium lager', 450, 200, 1, true, 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400'),
        (v_restaurant_id, v_drinks_category_id, 'Corona', 'Mexican premium beer', 500, 220, 1, true, 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400'),
        (v_restaurant_id, v_drinks_category_id, 'Smirnoff Ice', 'Vodka-based malt beverage', 320, 160, 1, true, 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=400')
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Beer menu and inventory added successfully!';
END $$;

-- Link beers to inventory (1:1 mapping - each beer = 1 bottle)
DO $$
DECLARE
    v_restaurant_id UUID;
    beer_record RECORD;
    inv_id UUID;
BEGIN
    SELECT id INTO v_restaurant_id FROM restaurants LIMIT 1;

    -- Link each beer to its corresponding inventory bottle
    FOR beer_record IN (
        SELECT id, name FROM menu_items 
        WHERE category_id = (SELECT id FROM menu_categories WHERE name = 'Drinks')
        AND name IN (
            'Tusker Lager', 'Tusker Lite', 'Tusker Malt', 'Tusker Safari', 'Tusker Cider',
            'Guinness Foreign Extra Stout', 'Guinness Smooth',
            'White Cap Lager', 'Pilsner Lager', 'Pilsner Ice',
            'Senator Cold', 'Bell Lager',
            'Heineken', 'Budweiser', 'Corona', 'Smirnoff Ice'
        )
    )
    LOOP
        -- Find matching inventory item (name matching logic)
        SELECT id INTO inv_id FROM inventory_items 
        WHERE name LIKE beer_record.name || '%' 
        LIMIT 1;

        IF inv_id IS NOT NULL THEN
            INSERT INTO recipe_ingredients (restaurant_id, menu_item_id, inventory_item_id, quantity_required)
            VALUES (v_restaurant_id, beer_record.id, inv_id, 1)
            ON CONFLICT DO NOTHING;
            
            RAISE NOTICE 'Linked: % to inventory', beer_record.name;
        END IF;
    END LOOP;
END $$;

-- Verify the additions
SELECT 
    mi.name as beer,
    mi.price,
    mi.cost_price,
    COUNT(ri.id) as inventory_linked
FROM menu_items mi
JOIN menu_categories mc ON mi.category_id = mc.id
LEFT JOIN recipe_ingredients ri ON mi.id = ri.menu_item_id
WHERE mc.name = 'Drinks'
AND mi.name IN (
    'Tusker Lager', 'Tusker Lite', 'Tusker Malt', 'Tusker Safari', 'Tusker Cider',
    'Guinness Foreign Extra Stout', 'Guinness Smooth',
    'White Cap Lager', 'Pilsner Lager', 'Pilsner Ice',
    'Senator Cold', 'Bell Lager',
    'Heineken', 'Budweiser', 'Corona', 'Smirnoff Ice'
)
GROUP BY mi.name, mi.price, mi.cost_price
ORDER BY mi.price;

-- Show total drinks count (should be 15 non-alcoholic + 16 beers = 31)
SELECT 
    COUNT(*) as total_drinks,
    COUNT(*) FILTER (WHERE mi.price < 200) as non_alcoholic,
    COUNT(*) FILTER (WHERE mi.price >= 200) as alcoholic
FROM menu_items mi
JOIN menu_categories mc ON mi.category_id = mc.id
WHERE mc.name = 'Drinks';
