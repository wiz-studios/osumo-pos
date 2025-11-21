-- Update signup_bootstrap to include default menu categories
-- This ensures every new restaurant starts with standard categories

CREATE OR REPLACE FUNCTION public.signup_bootstrap(
  p_user_id uuid,
  p_first text,
  p_last text,
  p_restaurant_name text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_restaurant_id uuid;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'p_user_id is required';
  END IF;
  IF COALESCE(TRIM(p_restaurant_name), '') = '' THEN
    RAISE EXCEPTION 'p_restaurant_name is required';
  END IF;

  -- Ensure the owner exists in auth.users (FK will also enforce)
  PERFORM 1 FROM auth.users WHERE id = p_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Owner user (%) does not exist', p_user_id;
  END IF;

  -- Create restaurant
  INSERT INTO public.restaurants (name, owner_id)
  VALUES (p_restaurant_name, p_user_id)
  RETURNING id INTO v_restaurant_id;

  -- Create staff (manager)
  INSERT INTO public.staff (user_id, restaurant_id, role, first_name, last_name, active)
  VALUES (p_user_id, v_restaurant_id, 'manager', p_first, p_last, true);

  -- Create default menu categories
  INSERT INTO public.menu_categories (restaurant_id, name, display_order, is_visible) VALUES
    (v_restaurant_id, 'Lunch / Dinner', 1, true),
    (v_restaurant_id, 'Breakfast', 2, true),
    (v_restaurant_id, 'Drinks', 3, true),
    (v_restaurant_id, 'Sides & Snacks', 4, true),
    (v_restaurant_id, 'Specials (Daily Dish)', 5, true),
    (v_restaurant_id, 'Vegetarian', 6, true);

  RETURN v_restaurant_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;

-- Restrict execution to service role only
REVOKE ALL ON FUNCTION public.signup_bootstrap(uuid, text, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.signup_bootstrap(uuid, text, text, text) TO service_role;
