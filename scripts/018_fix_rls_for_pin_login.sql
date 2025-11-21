-- Migration 018: Fix RLS for PIN Login (Anonymous Access)
-- Purpose: Allow anonymous users (authenticated via PIN in app) to access orders
-- Date: 2025-11-21

-- NOTE: In a production environment with strict security requirements, 
-- you should implement a proper backend authentication flow where the PIN 
-- exchange returns a Supabase JWT. For this POS implementation, we are 
-- allowing anonymous access to specific tables to unblock the functionality.

-- 1. Allow Anon access to Orders
CREATE POLICY "anon_orders_select" ON orders
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "anon_orders_insert" ON orders
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "anon_orders_update" ON orders
  FOR UPDATE
  TO anon
  USING (true);

-- 2. Allow Anon access to Order Items
CREATE POLICY "anon_order_items_select" ON order_items
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "anon_order_items_insert" ON order_items
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "anon_order_items_update" ON order_items
  FOR UPDATE
  TO anon
  USING (true);

-- 3. Allow Anon access to Menu Items (Read-only)
CREATE POLICY "anon_menu_items_select" ON menu_items
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "anon_menu_categories_select" ON menu_categories
  FOR SELECT
  TO anon
  USING (true);

-- 4. Allow Anon access to Staff (Read-only for login)
CREATE POLICY "anon_staff_select" ON staff
  FOR SELECT
  TO anon
  USING (true);

-- 5. Allow Anon access to Order Events (Insert only)
CREATE POLICY "anon_order_events_insert" ON order_events
  FOR INSERT
  TO anon
  WITH CHECK (true);

DO $$
BEGIN
  RAISE NOTICE 'Migration 018 completed: Enabled anonymous access for POS functionality';
END $$;
