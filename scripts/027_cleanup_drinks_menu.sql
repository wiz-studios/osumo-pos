-- Robust cleanup for duplicate drinks + ingredient fixes
DO $$
DECLARE
    v_restaurant_id UUID;

    -- Menu item IDs
    v_mahamri_chai_id UUID;
    v_mandazi_chai_id UUID;

    -- Inventory items
    v_tea_leaves_inv UUID;
    v_milk_inv UUID;
    v_sugar_inv UUID;
    v_mango_inv UUID;
BEGIN
    SELECT id INTO v_restaurant_id
    FROM restaurants
    ORDER BY created_at
    LIMIT 1;

    ----------------------------------------------------------------------
    -- Inventory lookup (errors if missing because silent NULL = failure)
    ----------------------------------------------------------------------
    SELECT id INTO STRICT v_tea_leaves_inv FROM inventory_items WHERE name = 'Tea Leaves';
    SELECT id INTO STRICT v_milk_inv      FROM inventory_items WHERE name = 'Milk';
    SELECT id INTO STRICT v_sugar_inv     FROM inventory_items WHERE name = 'Sugar';
    SELECT id INTO STRICT v_mango_inv     FROM inventory_items WHERE name = 'Mango';

    ----------------------------------------------------------------------
    -- 1. Remove older duplicates of Chai (Tea), keep the one with ingredients
    ----------------------------------------------------------------------
    DELETE FROM menu_items
    WHERE id IN (
        SELECT id FROM (
            SELECT id,
                   ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at DESC) AS r
            FROM menu_items
            WHERE name = 'Chai (Tea)'
        ) t
        WHERE r > 1
    );
    RAISE NOTICE 'Removed duplicate Chai (Tea) items';

    ----------------------------------------------------------------------
    -- 2. Remove duplicate Mango Juices except latest
    ----------------------------------------------------------------------
    DELETE FROM menu_items
    WHERE id IN (
        SELECT id FROM (
            SELECT id,
                   ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at DESC) AS r
            FROM menu_items
            WHERE name = 'Fresh Mango Juice'
        ) t
        WHERE r > 1
    );
    RAISE NOTICE 'Removed duplicate Fresh Mango Juice items';

    ----------------------------------------------------------------------
    -- 3. Rebuild Mandazi + Chai ingredients (clean wipe)
    ----------------------------------------------------------------------
    SELECT id INTO v_mandazi_chai_id
    FROM menu_items
    WHERE name = 'Mandazi + Chai'
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_mandazi_chai_id IS NOT NULL THEN
        DELETE FROM recipe_ingredients WHERE menu_item_id = v_mandazi_chai_id;

        INSERT INTO recipe_ingredients (restaurant_id, menu_item_id, inventory_item_id, quantity_required)
        VALUES
            (v_restaurant_id, v_mandazi_chai_id, v_tea_leaves_inv, 0.005),
            (v_restaurant_id, v_mandazi_chai_id, v_milk_inv,       0.05),
            (v_restaurant_id, v_mandazi_chai_id, v_sugar_inv,      0.01);

        RAISE NOTICE 'Re-linked Mandazi + Chai ingredients';
    END IF;

    ----------------------------------------------------------------------
    -- 4. Mahamri + Chai – ensure ingredients exist
    ----------------------------------------------------------------------
    SELECT id INTO v_mahamri_chai_id
    FROM menu_items
    WHERE name = 'Mahamri + Chai'
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_mahamri_chai_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM recipe_ingredients WHERE menu_item_id = v_mahamri_chai_id
        ) THEN
            INSERT INTO recipe_ingredients (restaurant_id, menu_item_id, inventory_item_id, quantity_required)
            VALUES
                (v_restaurant_id, v_mahamri_chai_id, v_tea_leaves_inv, 0.005),
                (v_restaurant_id, v_mahamri_chai_id, v_milk_inv,       0.05),
                (v_restaurant_id, v_mahamri_chai_id, v_sugar_inv,      0.01);

            RAISE NOTICE 'Added missing Mahamri + Chai ingredients';
        ELSE
            RAISE NOTICE 'Mahamri + Chai ingredients already OK';
        END IF;
    END IF;

    RAISE NOTICE 'Cleanup complete!';
END $$;

-- Verification
SELECT 
    mc.name AS category,
    mi.name AS menu_item,
    mi.price,
    mi.cost_price,
    COUNT(ri.id) AS ingredients_linked
FROM menu_items mi
JOIN menu_categories mc ON mi.category_id = mc.id
LEFT JOIN recipe_ingredients ri ON mi.id = ri.menu_item_id
WHERE mc.name = 'Drinks'
GROUP BY mc.name, mi.name, mi.price, mi.cost_price
ORDER BY mi.price;
