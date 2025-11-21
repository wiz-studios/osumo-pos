-- Create a secure function to get the current user's restaurant ID
-- This bypasses RLS to avoid recursion issues when fetching the user's own context

CREATE OR REPLACE FUNCTION get_my_restaurant_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_restaurant_id UUID;
BEGIN
  SELECT restaurant_id INTO v_restaurant_id
  FROM staff
  WHERE user_id = auth.uid();
  
  RETURN v_restaurant_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_my_restaurant_id() TO authenticated;
