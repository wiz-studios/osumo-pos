-- SAFE DUPLICATE REMOVAL - Merges duplicates by updating foreign key references first
-- This keeps the NEWEST version of each drink and updates all references

DO $$
DECLARE
    v_deleted_count INT := 0;
    duplicate_record RECORD;
    keeper_id UUID;
BEGIN
    -- For each duplicate drink name, merge all duplicates into the newest one
    FOR duplicate_record IN (
        SELECT 
            mi.name,
            ARRAY_AGG(mi.id ORDER BY mi.created_at DESC) as all_ids
        FROM menu_items mi
        JOIN menu_categories mc ON mi.category_id = mc.id
        WHERE mc.name = 'Drinks'
        GROUP BY mi.name
        HAVING COUNT(*) > 1
    )
    LOOP
        -- The first ID in the array is the newest (keeper)
        keeper_id := duplicate_record.all_ids[1];
        
        RAISE NOTICE 'Processing: % (keeping ID: %)', duplicate_record.name, keeper_id;
        
        -- Update order_items to point to the keeper
        UPDATE order_items
        SET menu_item_id = keeper_id
        WHERE menu_item_id = ANY(duplicate_record.all_ids[2:]);
        
        -- Handle recipe_ingredients: delete duplicates' ingredients, keep keeper's
        DELETE FROM recipe_ingredients
        WHERE menu_item_id = ANY(duplicate_record.all_ids[2:]);
        
        -- Now safe to delete the duplicate menu items
        DELETE FROM menu_items
        WHERE id = ANY(duplicate_record.all_ids[2:]);
        
        v_deleted_count := v_deleted_count + (array_length(duplicate_record.all_ids, 1) - 1);
    END LOOP;
    
    RAISE NOTICE 'Successfully merged and deleted % duplicate drink items', v_deleted_count;
END $$;

-- Verify: Show final count of each drink (should all be 1)
SELECT 
    mi.name,
    COUNT(*) as count,
    mi.id,
    mi.created_at
FROM menu_items mi
JOIN menu_categories mc ON mi.category_id = mc.id
WHERE mc.name = 'Drinks'
GROUP BY mi.name, mi.id, mi.created_at
ORDER BY mi.name;

-- Show total unique drinks (should be 15)
SELECT COUNT(DISTINCT mi.name) as unique_drinks
FROM menu_items mi
JOIN menu_categories mc ON mi.category_id = mc.id
WHERE mc.name = 'Drinks';
