-- Find ALL duplicate menu items in the Drinks category
SELECT 
    mi.id,
    mi.name,
    mi.price,
    mi.cost_price,
    mi.created_at,
    COUNT(*) OVER (PARTITION BY mi.name) as duplicate_count
FROM menu_items mi
JOIN menu_categories mc ON mi.category_id = mc.id
WHERE mc.name = 'Drinks'
ORDER BY mi.name, mi.created_at;

-- Show summary of duplicates
SELECT 
    mi.name,
    COUNT(*) as count
FROM menu_items mi
JOIN menu_categories mc ON mi.category_id = mc.id
WHERE mc.name = 'Drinks'
GROUP BY mi.name
HAVING COUNT(*) > 1
ORDER BY mi.name;
