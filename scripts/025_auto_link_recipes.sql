-- Automatically link menu items to inventory ingredients based on naming patterns
-- This creates recipe_ingredients entries for common menu items

-- First, let's get the restaurant_id (assuming single restaurant for now)
-- You may need to adjust this if you have multiple restaurants

DO $$
DECLARE
  v_restaurant_id UUID;
  v_beans_menu_item_id UUID;
  v_beans_inventory_id UUID;
  v_beef_stew_menu_item_id UUID;
  v_beef_inventory_id UUID;
  v_onions_inventory_id UUID;
  v_tomatoes_inventory_id UUID;
  v_chapati_menu_item_id UUID;
  v_chapati_flour_inventory_id UUID;
  v_cooking_oil_inventory_id UUID;
BEGIN
  -- Get the restaurant_id (first restaurant in the system)
  SELECT id INTO v_restaurant_id FROM restaurants LIMIT 1;

  -- Get inventory item IDs
  SELECT id INTO v_beans_inventory_id FROM inventory_items WHERE name ILIKE '%beans%' OR name ILIKE '%maharagwe%' LIMIT 1;
  SELECT id INTO v_beef_inventory_id FROM inventory_items WHERE name ILIKE '%beef%stew%' OR name ILIKE '%beef%meat%' LIMIT 1;
  SELECT id INTO v_onions_inventory_id FROM inventory_items WHERE name ILIKE '%onion%' LIMIT 1;
  SELECT id INTO v_tomatoes_inventory_id FROM inventory_items WHERE name ILIKE '%tomato%' LIMIT 1;
  SELECT id INTO v_chapati_flour_inventory_id FROM inventory_items WHERE name ILIKE '%chapati%flour%' OR name ILIKE '%wheat%flour%' LIMIT 1;
  SELECT id INTO v_cooking_oil_inventory_id FROM inventory_items WHERE name ILIKE '%cooking%oil%' OR name ILIKE '%vegetable%oil%' LIMIT 1;

  -- Get menu item IDs
  SELECT id INTO v_beans_menu_item_id FROM menu_items WHERE name ILIKE '%maharagwe%' OR name ILIKE '%beans%' LIMIT 1;
  SELECT id INTO v_beef_stew_menu_item_id FROM menu_items WHERE name ILIKE '%beef%stew%' LIMIT 1;
  SELECT id INTO v_chapati_menu_item_id FROM menu_items WHERE name ILIKE '%chapati%' LIMIT 1;

  -- Link Maharagwe/Beans to Beans inventory
  IF v_beans_menu_item_id IS NOT NULL AND v_beans_inventory_id IS NOT NULL THEN
    INSERT INTO recipe_ingredients (restaurant_id, menu_item_id, inventory_item_id, quantity_required)
    VALUES (v_restaurant_id, v_beans_menu_item_id, v_beans_inventory_id, 0.2)
    ON CONFLICT DO NOTHING;
    RAISE NOTICE 'Linked Beans menu item to Beans inventory (0.2 kg per serving)';
  END IF;

  -- Link Beef Stew to Beef, Onions, Tomatoes
  IF v_beef_stew_menu_item_id IS NOT NULL THEN
    IF v_beef_inventory_id IS NOT NULL THEN
      INSERT INTO recipe_ingredients (restaurant_id, menu_item_id, inventory_item_id, quantity_required)
      VALUES (v_restaurant_id, v_beef_stew_menu_item_id, v_beef_inventory_id, 0.2)
      ON CONFLICT DO NOTHING;
      RAISE NOTICE 'Linked Beef Stew to Beef (0.2 kg per serving)';
    END IF;
    
    IF v_onions_inventory_id IS NOT NULL THEN
      INSERT INTO recipe_ingredients (restaurant_id, menu_item_id, inventory_item_id, quantity_required)
      VALUES (v_restaurant_id, v_beef_stew_menu_item_id, v_onions_inventory_id, 0.05)
      ON CONFLICT DO NOTHING;
      RAISE NOTICE 'Linked Beef Stew to Onions (0.05 kg per serving)';
    END IF;
    
    IF v_tomatoes_inventory_id IS NOT NULL THEN
      INSERT INTO recipe_ingredients (restaurant_id, menu_item_id, inventory_item_id, quantity_required)
      VALUES (v_restaurant_id, v_beef_stew_menu_item_id, v_tomatoes_inventory_id, 0.1)
      ON CONFLICT DO NOTHING;
      RAISE NOTICE 'Linked Beef Stew to Tomatoes (0.1 kg per serving)';
    END IF;
  END IF;

  -- Link Chapati to Chapati Flour and Cooking Oil
  IF v_chapati_menu_item_id IS NOT NULL THEN
    IF v_chapati_flour_inventory_id IS NOT NULL THEN
      INSERT INTO recipe_ingredients (restaurant_id, menu_item_id, inventory_item_id, quantity_required)
      VALUES (v_restaurant_id, v_chapati_menu_item_id, v_chapati_flour_inventory_id, 0.1)
      ON CONFLICT DO NOTHING;
      RAISE NOTICE 'Linked Chapati to Chapati Flour (0.1 kg per serving)';
    END IF;
    
    IF v_cooking_oil_inventory_id IS NOT NULL THEN
      INSERT INTO recipe_ingredients (restaurant_id, menu_item_id, inventory_item_id, quantity_required)
      VALUES (v_restaurant_id, v_chapati_menu_item_id, v_cooking_oil_inventory_id, 0.02)
      ON CONFLICT DO NOTHING;
      RAISE NOTICE 'Linked Chapati to Cooking Oil (0.02 litre per serving)';
    END IF;
  END IF;

  RAISE NOTICE 'Recipe linking complete!';
END $$;

-- Verify the links were created
SELECT 
  mi.name as menu_item,
  ii.name as ingredient,
  ri.quantity_required,
  ii.unit
FROM recipe_ingredients ri
JOIN menu_items mi ON ri.menu_item_id = mi.id
JOIN inventory_items ii ON ri.inventory_item_id = ii.id
ORDER BY mi.name, ii.name;
