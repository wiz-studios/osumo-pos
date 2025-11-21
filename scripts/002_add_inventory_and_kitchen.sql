-- Inventory management tables
CREATE TABLE inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  unit TEXT NOT NULL, -- kg, liters, pieces, etc.
  quantity_in_stock NUMERIC NOT NULL DEFAULT 0,
  reorder_level NUMERIC NOT NULL,
  unit_cost NUMERIC NOT NULL,
  supplier TEXT,
  last_restocked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(restaurant_id, name)
);

-- Recipes - link menu items to ingredients
CREATE TABLE recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  quantity_required NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(menu_item_id, inventory_item_id)
);

-- Inventory transactions for tracking usage and wastage
CREATE TABLE inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL, -- 'order_deduction', 'restock', 'wastage', 'adjustment'
  quantity NUMERIC NOT NULL,
  reference_id UUID, -- order_id if from order
  notes TEXT,
  created_by UUID NOT NULL REFERENCES staff(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Kitchen stations
CREATE TABLE kitchen_stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- "Grill", "Prep", "Fryer", etc.
  station_type TEXT NOT NULL, -- 'general', 'grill', 'fryer', 'prep', 'dessert'
  max_active_orders INTEGER DEFAULT 5,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(restaurant_id, name)
);

-- Link menu items to stations
CREATE TABLE menu_item_stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  kitchen_station_id UUID NOT NULL REFERENCES kitchen_stations(id) ON DELETE CASCADE,
  UNIQUE(menu_item_id, kitchen_station_id)
);

-- Kitchen staff assignments
CREATE TABLE kitchen_staff_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  kitchen_station_id UUID NOT NULL REFERENCES kitchen_stations(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(staff_id, kitchen_station_id)
);

-- Menu availability by time
CREATE TABLE menu_item_time_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL, -- 0-6 (Sunday-Saturday)
  available_from TIME NOT NULL,
  available_until TIME NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(menu_item_id, day_of_week)
);

-- Price modifiers for promotions
CREATE TABLE price_modifiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- "Happy Hour", "Weekend Special", etc.
  modifier_type TEXT NOT NULL, -- 'percentage', 'fixed_amount'
  modifier_value NUMERIC NOT NULL,
  applies_to_menu_items BOOLEAN DEFAULT FALSE,
  menu_item_ids UUID[] DEFAULT '{}',
  valid_from TIMESTAMP WITH TIME ZONE,
  valid_until TIMESTAMP WITH TIME ZONE,
  day_of_week_filter INTEGER[], -- NULL for all days, or [0,1,2,3,4,5,6]
  start_time TIME,
  end_time TIME,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  recipient_staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL, -- 'low_stock', 'order_ready', 'new_order', 'station_full'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  reference_id UUID,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE kitchen_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_item_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE kitchen_staff_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_item_time_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_modifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for inventory
CREATE POLICY "inventory_select" ON inventory_items
  FOR SELECT USING (
    restaurant_id IN (
      SELECT restaurant_id FROM staff WHERE id = auth.uid()
    )
  );

CREATE POLICY "inventory_insert" ON inventory_items
  FOR INSERT WITH CHECK (
    restaurant_id IN (
      SELECT restaurant_id FROM staff WHERE id = auth.uid() AND role IN ('manager', 'admin')
    )
  );

-- RLS for kitchen_stations
CREATE POLICY "kitchen_stations_select" ON kitchen_stations
  FOR SELECT USING (
    restaurant_id IN (
      SELECT restaurant_id FROM staff WHERE id = auth.uid()
    )
  );

-- RLS for notifications
CREATE POLICY "notifications_select" ON notifications
  FOR SELECT USING (
    recipient_staff_id = auth.uid() OR
    restaurant_id IN (
      SELECT restaurant_id FROM staff WHERE id = auth.uid() AND role IN ('manager', 'admin')
    )
  );

CREATE POLICY "notifications_insert" ON notifications
  FOR INSERT WITH CHECK (
    restaurant_id IN (
      SELECT restaurant_id FROM staff WHERE id = auth.uid()
    )
  );
