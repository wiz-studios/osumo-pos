-- Verify all drinks in the menu
SELECT 
    mi.name,
    mi.price,
    mi.cost_price,
    CASE 
        WHEN mi.price >= 200 THEN 'Alcoholic'
        ELSE 'Non-Alcoholic'
    END as type,
    COUNT(ri.id) as inventory_linked
FROM menu_items mi
JOIN menu_categories mc ON mi.category_id = mc.id
LEFT JOIN recipe_ingredients ri ON mi.id = ri.menu_item_id
WHERE mc.name = 'Drinks'
GROUP BY mi.name, mi.price, mi.cost_price
ORDER BY 
    CASE 
        WHEN mi.price >= 200 THEN 2
        ELSE 1
    END,
    mi.price;
