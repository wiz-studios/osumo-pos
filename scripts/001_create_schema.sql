-- Create tables for NRB POS v0.3

-- Restaurants (multi-tenant)
CREATE TABLE restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  location TEXT,
  phone TEXT,
  timezone TEXT DEFAULT 'Africa/Nairobi',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Staff/Users
CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) UNIQUE,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id),
  role TEXT DEFAULT 'cashier', -- manager, cashier, kitchen
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Menu Categories
CREATE TABLE menu_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id),
  name TEXT NOT NULL,
  display_order INT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Menu Items
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id),
  category_id UUID NOT NULL REFERENCES menu_categories(id),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  image_url TEXT,
  available BOOLEAN DEFAULT true,
  prep_time_minutes INT DEFAULT 15,
  is_vegan BOOLEAN DEFAULT false,
  is_spicy BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id),
  table_number INT,
  customer_name TEXT,
  order_type TEXT NOT NULL DEFAULT 'dine-in', -- dine-in, takeaway, delivery
  status TEXT NOT NULL DEFAULT 'new', -- new, in_progress, completed, paid
  total NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT, -- cash, card, m-pesa, airtel
  payment_status TEXT DEFAULT 'unpaid', -- unpaid, partial, paid
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Order Items
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES menu_items(id),
  quantity INT NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  subtotal NUMERIC NOT NULL,
  notes TEXT,
  item_status TEXT DEFAULT 'new', -- new, in_progress, ready, served
  created_at TIMESTAMP DEFAULT NOW()
);

-- Payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL, -- cash, card, m-pesa, airtel
  reference TEXT,
  status TEXT DEFAULT 'completed', -- pending, completed, failed
  created_at TIMESTAMP DEFAULT NOW()
);

-- Audit Log
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id),
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Staff can only access their restaurant's data
CREATE POLICY "staff_access_own_restaurant" ON staff
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "menu_categories_restaurant_access" ON menu_categories
  FOR SELECT USING (
    restaurant_id IN (
      SELECT restaurant_id FROM staff WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "menu_items_restaurant_access" ON menu_items
  FOR SELECT USING (
    restaurant_id IN (
      SELECT restaurant_id FROM staff WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "orders_restaurant_access" ON orders
  FOR SELECT USING (
    restaurant_id IN (
      SELECT restaurant_id FROM staff WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "order_items_restaurant_access" ON order_items
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM orders WHERE restaurant_id IN (
        SELECT restaurant_id FROM staff WHERE user_id = auth.uid()
      )
    )
  );

-- Insert/Update/Delete policies (for managers)
CREATE POLICY "menu_categories_insert_update" ON menu_categories
  FOR INSERT WITH CHECK (
    restaurant_id IN (
      SELECT restaurant_id FROM staff 
      WHERE user_id = auth.uid() AND role = 'manager'
    )
  );

CREATE POLICY "menu_items_insert_update" ON menu_items
  FOR INSERT WITH CHECK (
    restaurant_id IN (
      SELECT restaurant_id FROM staff 
      WHERE user_id = auth.uid() AND role = 'manager'
    )
  );

CREATE POLICY "orders_insert" ON orders
  FOR INSERT WITH CHECK (
    restaurant_id IN (
      SELECT restaurant_id FROM staff 
      WHERE user_id = auth.uid() AND role IN ('manager', 'cashier')
    )
  );

CREATE POLICY "orders_update" ON orders
  FOR UPDATE USING (
    restaurant_id IN (
      SELECT restaurant_id FROM staff 
      WHERE user_id = auth.uid() AND role IN ('manager', 'cashier', 'kitchen')
    )
  );

CREATE POLICY "payments_insert" ON payments
  FOR INSERT WITH CHECK (
    order_id IN (
      SELECT id FROM orders WHERE restaurant_id IN (
        SELECT restaurant_id FROM staff 
        WHERE user_id = auth.uid() AND role IN ('manager', 'cashier')
      )
    )
  );

-- Create indexes for performance
CREATE INDEX idx_staff_restaurant ON staff(restaurant_id);
CREATE INDEX idx_staff_user ON staff(user_id);
CREATE INDEX idx_menu_items_restaurant ON menu_items(restaurant_id);
CREATE INDEX idx_menu_items_category ON menu_items(category_id);
CREATE INDEX idx_orders_restaurant ON orders(restaurant_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_payments_order ON payments(order_id);
