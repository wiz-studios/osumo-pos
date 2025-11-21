-- Drop the problematic RLS policies that cause infinite recursion
DROP POLICY IF EXISTS "staff_access_own_restaurant" ON staff;
DROP POLICY IF EXISTS "menu_categories_restaurant_access" ON menu_categories;
DROP POLICY IF EXISTS "menu_items_restaurant_access" ON menu_items;
DROP POLICY IF EXISTS "orders_restaurant_access" ON orders;
DROP POLICY IF EXISTS "order_items_restaurant_access" ON order_items;
DROP POLICY IF EXISTS "menu_categories_insert_update" ON menu_categories;
DROP POLICY IF EXISTS "menu_items_insert_update" ON menu_items;
DROP POLICY IF EXISTS "orders_insert" ON orders;
DROP POLICY IF EXISTS "orders_update" ON orders;
DROP POLICY IF EXISTS "payments_insert" ON payments;

-- Create simplified RLS policies that don't cause infinite recursion
-- Staff can only see their own record
CREATE POLICY "staff_access_own_record" ON staff
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "staff_insert_policy" ON staff
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Authenticated users can access menu items, orders, etc.
-- Restaurant-level access is enforced in the application layer for better control
CREATE POLICY "menu_categories_select" ON menu_categories
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "menu_categories_insert" ON menu_categories
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "menu_items_select" ON menu_items
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "menu_items_insert" ON menu_items
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "orders_select" ON orders
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "orders_insert" ON orders
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "orders_update" ON orders
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "order_items_select" ON order_items
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "order_items_insert" ON order_items
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "payments_select" ON payments
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "payments_insert" ON payments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "restaurants_select" ON restaurants
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "restaurants_insert" ON restaurants
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "audit_logs_select" ON audit_logs
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "audit_logs_insert" ON audit_logs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
