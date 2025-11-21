-- Insert sample menu items for Osumo restaurant
-- First, get category IDs (we'll use them in the inserts)

DO $$
DECLARE
  v_restaurant_id UUID := '986cf22f-1ff6-4d44-af8c-d73a2fce6042';
  v_lunch_dinner_id UUID;
  v_breakfast_id UUID;
  v_drinks_id UUID;
  v_sides_id UUID;
  v_specials_id UUID;
  v_vegetarian_id UUID;
BEGIN
  -- Get category IDs
  SELECT id INTO v_lunch_dinner_id FROM menu_categories WHERE restaurant_id = v_restaurant_id AND name = 'Lunch / Dinner';
  SELECT id INTO v_breakfast_id FROM menu_categories WHERE restaurant_id = v_restaurant_id AND name = 'Breakfast';
  SELECT id INTO v_drinks_id FROM menu_categories WHERE restaurant_id = v_restaurant_id AND name = 'Drinks';
  SELECT id INTO v_sides_id FROM menu_categories WHERE restaurant_id = v_restaurant_id AND name = 'Sides & Snacks';
  SELECT id INTO v_specials_id FROM menu_categories WHERE restaurant_id = v_restaurant_id AND name = 'Specials (Daily Dish)';
  SELECT id INTO v_vegetarian_id FROM menu_categories WHERE restaurant_id = v_restaurant_id AND name = 'Vegetarian';

  -- Insert Lunch / Dinner items
  INSERT INTO menu_items (restaurant_id, category_id, name, description, price, cost_price, prep_time_minutes, is_vegan, is_spicy, is_daily_special, available) VALUES
    (v_restaurant_id, v_lunch_dinner_id, 'Beef Stew + Rice', 'Slow-cooked beef in tomato gravy with steamed rice', 320, 160, 20, false, false, false, true),
    (v_restaurant_id, v_lunch_dinner_id, 'Githeri', 'Boiled maize and beans with onions and tomatoes', 150, 60, 15, true, false, false, true),
    (v_restaurant_id, v_lunch_dinner_id, 'Pilau', 'Spiced rice with tender beef or goat', 280, 140, 25, false, true, false, true),
    (v_restaurant_id, v_lunch_dinner_id, 'Ugali + Sukuma', 'Traditional maize meal with sautéed collard greens', 220, 90, 15, true, false, false, true),
    (v_restaurant_id, v_lunch_dinner_id, 'Fish Curry + Chapati', 'Tilapia in coconut curry sauce with fresh chapati', 380, 200, 20, false, true, false, true);

  -- Insert Breakfast items
  INSERT INTO menu_items (restaurant_id, category_id, name, description, price, cost_price, prep_time_minutes, is_vegan, is_spicy, is_daily_special, available) VALUES
    (v_restaurant_id, v_breakfast_id, 'Mandazi + Chai', 'Freshly fried mandazi with spiced tea', 120, 50, 10, false, false, false, true),
    (v_restaurant_id, v_breakfast_id, 'Chapati + Beans', 'Flaky chapati with stewed red beans', 180, 80, 15, true, false, false, true),
    (v_restaurant_id, v_breakfast_id, 'Boiled Eggs + Bread', 'Two boiled eggs with buttered brown bread', 100, 45, 8, false, false, false, true);

  -- Insert Drinks
  INSERT INTO menu_items (restaurant_id, category_id, name, description, price, cost_price, prep_time_minutes, is_vegan, is_spicy, is_daily_special, available) VALUES
    (v_restaurant_id, v_drinks_id, 'Coca-Cola 500ml', 'Chilled Coca-Cola in glass bottle', 100, 50, 2, true, false, false, true),
    (v_restaurant_id, v_drinks_id, 'Fresh Mango Juice', '100% natural mango juice, no sugar added', 180, 90, 5, true, false, false, true),
    (v_restaurant_id, v_drinks_id, 'Chai (Tea)', 'Hot spiced tea with milk and sugar', 60, 20, 4, false, false, false, true),
    (v_restaurant_id, v_drinks_id, 'Stoney Tangawizi', 'Chilled ginger beer', 120, 60, 2, true, true, false, true);

  -- Insert Sides & Snacks
  INSERT INTO menu_items (restaurant_id, category_id, name, description, price, cost_price, prep_time_minutes, is_vegan, is_spicy, is_daily_special, available) VALUES
    (v_restaurant_id, v_sides_id, 'Kachumbari', 'Fresh tomato, onion, and chili salad', 80, 30, 5, true, true, false, true),
    (v_restaurant_id, v_sides_id, 'Extra Ugali', 'Additional portion of ugali', 70, 30, 8, true, false, false, true),
    (v_restaurant_id, v_sides_id, 'Chips', 'Crispy fried potatoes with ketchup', 120, 50, 10, true, false, false, true),
    (v_restaurant_id, v_sides_id, 'Sambusa (Beef)', 'Deep-fried pastry filled with spiced minced beef', 60, 30, 12, false, true, false, true);

  -- Insert Specials (Daily Dish)
  INSERT INTO menu_items (restaurant_id, category_id, name, description, price, cost_price, prep_time_minutes, is_vegan, is_spicy, is_daily_special, available) VALUES
    (v_restaurant_id, v_specials_id, 'Ndengu Stew', 'Green grams stew with tomatoes and onions', 200, 80, 18, true, false, true, true),
    (v_restaurant_id, v_specials_id, 'Goat Chops (2 pcs)', 'Grilled goat chops marinated in garlic and herbs', 450, 240, 25, false, true, true, true);

  -- Insert Vegetarian items
  INSERT INTO menu_items (restaurant_id, category_id, name, description, price, cost_price, prep_time_minutes, is_vegan, is_spicy, is_daily_special, available) VALUES
    (v_restaurant_id, v_vegetarian_id, 'Maharagwe', 'Stewed red beans in tomato sauce', 180, 70, 15, true, false, false, true),
    (v_restaurant_id, v_vegetarian_id, 'Vegetable Pilau', 'Spiced rice with carrots, peas, and beans', 220, 100, 20, true, true, false, true),
    (v_restaurant_id, v_vegetarian_id, 'Ugali + Pumpkin Leaves', 'Maize meal with sautéed pumpkin leaves (seveve)', 200, 85, 15, true, false, false, true);

END $$;
