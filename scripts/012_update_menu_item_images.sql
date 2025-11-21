-- Update menu items with image URLs
-- This script updates existing menu items with their image paths

DO $$
DECLARE
  v_restaurant_id UUID := '986cf22f-1ff6-4d44-af8c-d73a2fce6042';
BEGIN
  -- Update Vegetarian items
  UPDATE menu_items 
  SET image_url = '/images/menu/maharagwe.jpg'
  WHERE restaurant_id = v_restaurant_id AND name = 'Maharagwe';

  UPDATE menu_items 
  SET image_url = '/images/menu/vegetable-pilau.jpg'
  WHERE restaurant_id = v_restaurant_id AND name = 'Vegetable Pilau';

  UPDATE menu_items 
  SET image_url = '/images/menu/ugali-pumpkin-leaves.jpg'
  WHERE restaurant_id = v_restaurant_id AND name = 'Ugali + Pumpkin Leaves';

  -- Update Specials (Daily Dish) items
  UPDATE menu_items 
  SET image_url = '/images/menu/ndengu-stew.jpg'
  WHERE restaurant_id = v_restaurant_id AND name = 'Ndengu Stew';

  UPDATE menu_items 
  SET image_url = '/images/menu/goat-chops.jpg'
  WHERE restaurant_id = v_restaurant_id AND name = 'Goat Chops (2 pcs)';

  -- Update Sides & Snacks items
  UPDATE menu_items 
  SET image_url = '/images/menu/kachumbari.jpg'
  WHERE restaurant_id = v_restaurant_id AND name = 'Kachumbari';

  UPDATE menu_items 
  SET image_url = '/images/menu/extra-ugali.jpg'
  WHERE restaurant_id = v_restaurant_id AND name = 'Extra Ugali';

  UPDATE menu_items 
  SET image_url = '/images/menu/chips.jpg'
  WHERE restaurant_id = v_restaurant_id AND name = 'Chips';

  UPDATE menu_items 
  SET image_url = '/images/menu/beef-sambusa.jpg'
  WHERE restaurant_id = v_restaurant_id AND name = 'Sambusa (Beef)';

  -- Update Drinks items
  UPDATE menu_items 
  SET image_url = '/images/menu/coke-500ml.jpg'
  WHERE restaurant_id = v_restaurant_id AND name = 'Coca-Cola 500ml';

  UPDATE menu_items 
  SET image_url = '/images/menu/mango-juice.jpg'
  WHERE restaurant_id = v_restaurant_id AND name = 'Fresh Mango Juice';

  UPDATE menu_items 
  SET image_url = '/images/menu/chai.jpg'
  WHERE restaurant_id = v_restaurant_id AND name = 'Chai (Tea)';

  UPDATE menu_items 
  SET image_url = '/images/menu/stoney-tangawizi.jpg'
  WHERE restaurant_id = v_restaurant_id AND name = 'Stoney Tangawizi';

  -- Update Breakfast items
  UPDATE menu_items 
  SET image_url = '/images/menu/mandazi-chai.jpg'
  WHERE restaurant_id = v_restaurant_id AND name = 'Mandazi + Chai';

  UPDATE menu_items 
  SET image_url = '/images/menu/chapati-beans.jpg'
  WHERE restaurant_id = v_restaurant_id AND name = 'Chapati + Beans';

  UPDATE menu_items 
  SET image_url = '/images/menu/boiled-eggs-bread.jpg'
  WHERE restaurant_id = v_restaurant_id AND name = 'Boiled Eggs + Bread';

  -- Update Lunch / Dinner items
  UPDATE menu_items 
  SET image_url = '/images/menu/beef-stew-rice.jpg'
  WHERE restaurant_id = v_restaurant_id AND name = 'Beef Stew + Rice';

  UPDATE menu_items 
  SET image_url = '/images/menu/githeri.jpg'
  WHERE restaurant_id = v_restaurant_id AND name = 'Githeri';

  UPDATE menu_items 
  SET image_url = '/images/menu/pilau.jpg'
  WHERE restaurant_id = v_restaurant_id AND name = 'Pilau';

  UPDATE menu_items 
  SET image_url = '/images/menu/ugali-sukuma.jpg'
  WHERE restaurant_id = v_restaurant_id AND name = 'Ugali + Sukuma';

  UPDATE menu_items 
  SET image_url = '/images/menu/fish-curry-chapati.jpg'
  WHERE restaurant_id = v_restaurant_id AND name = 'Fish Curry + Chapati';

  RAISE NOTICE 'Menu item images updated successfully';
END $$;

