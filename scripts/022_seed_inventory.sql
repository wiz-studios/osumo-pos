-- Seed Inventory Items
-- This script inserts 20 common Nairobi restaurant ingredients into the inventory_items table
-- It assumes there is at least one restaurant in the restaurants table and uses the first one found.

DO $$
DECLARE
    v_restaurant_id UUID;
BEGIN
    -- Get the first restaurant ID
    SELECT id INTO v_restaurant_id FROM restaurants LIMIT 1;

    IF v_restaurant_id IS NULL THEN
        RAISE NOTICE 'No restaurant found. Please create a restaurant first.';
        RETURN;
    END IF;

    -- Insert Meat & Protein
    INSERT INTO inventory_items (restaurant_id, name, unit, unit_cost, quantity_in_stock, reorder_level, supplier)
    VALUES
    (v_restaurant_id, 'Chicken Breast', 'kg', 450, 10, 3, 'Mama Lucy Butchery'),
    (v_restaurant_id, 'Beef Stew Meat', 'kg', 600, 8, 2, 'Eastleigh Market'),
    (v_restaurant_id, 'Goat Chops', 'piece', 250, 20, 5, 'Jua Kali Supplier');

    -- Insert Staples
    INSERT INTO inventory_items (restaurant_id, name, unit, unit_cost, quantity_in_stock, reorder_level, supplier)
    VALUES
    (v_restaurant_id, 'Maize Flour (Ugali)', 'kg', 120, 50, 10, 'Unga Limited'),
    (v_restaurant_id, 'Rice', 'kg', 150, 30, 5, 'Nakumatt Wholesale'),
    (v_restaurant_id, 'Beans (Maharagwe)', 'kg', 180, 20, 5, 'Local Market');

    -- Insert Vegetables & Sauces
    INSERT INTO inventory_items (restaurant_id, name, unit, unit_cost, quantity_in_stock, reorder_level, supplier)
    VALUES
    (v_restaurant_id, 'Tomatoes', 'kg', 80, 15, 3, 'Wakulima Market'),
    (v_restaurant_id, 'Onions', 'kg', 60, 20, 5, 'Local Vendor'),
    (v_restaurant_id, 'Cooking Oil', 'litre', 300, 10, 2, 'Kobil');

    -- Insert Drinks & Condiments
    INSERT INTO inventory_items (restaurant_id, name, unit, unit_cost, quantity_in_stock, reorder_level, supplier)
    VALUES
    (v_restaurant_id, 'Coca-Cola 500ml', 'bottle', 50, 50, 10, 'Coca-Cola Distributor'),
    (v_restaurant_id, 'Salt', 'kg', 40, 5, 1, 'Supermarket'),
    (v_restaurant_id, 'Spices (Pilau Mix)', 'packet', 200, 10, 2, 'Spice Shop');

    -- Insert Bakery & Snacks
    INSERT INTO inventory_items (restaurant_id, name, unit, unit_cost, quantity_in_stock, reorder_level, supplier)
    VALUES
    (v_restaurant_id, 'Chapati Flour', 'kg', 100, 20, 5, 'Local Mill'),
    (v_restaurant_id, 'Bread', 'loaf', 50, 30, 10, 'Bakery');
    
    -- Additional common items to reach ~20 items
    INSERT INTO inventory_items (restaurant_id, name, unit, unit_cost, quantity_in_stock, reorder_level, supplier)
    VALUES
    (v_restaurant_id, 'Milk', 'litre', 60, 12, 4, 'Brookside'),
    (v_restaurant_id, 'Sugar', 'kg', 140, 10, 2, 'Local Market'),
    (v_restaurant_id, 'Tea Leaves', 'kg', 300, 5, 1, 'Ketepa'),
    (v_restaurant_id, 'Potatoes', 'kg', 50, 40, 10, 'Wakulima Market'),
    (v_restaurant_id, 'Cabbage', 'head', 40, 10, 3, 'Local Vendor'),
    (v_restaurant_id, 'Carrots', 'kg', 50, 10, 2, 'Local Vendor');

    RAISE NOTICE 'Inventory seeded successfully for restaurant %', v_restaurant_id;
END $$;
