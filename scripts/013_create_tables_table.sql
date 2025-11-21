-- Create tables table for table management
CREATE TABLE IF NOT EXISTS tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id),
  name TEXT NOT NULL,
  capacity INT DEFAULT 4,
  is_active BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'free', -- 'free', 'occupied', 'dirty'
  x INT DEFAULT 0, -- For Phase B: position on floor map
  y INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add RLS policies for tables
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view tables (needed for POS)
CREATE POLICY "public_view_tables" ON tables
  FOR SELECT
  USING (true);

-- Allow authenticated users to insert/update tables
CREATE POLICY "authenticated_modify_tables" ON tables
  FOR ALL
  USING (auth.role() = 'authenticated');

-- Insert sample tables for Osumo restaurant
INSERT INTO tables (restaurant_id, name, capacity, is_active) VALUES
  ('986cf22f-1ff6-4d44-af8c-d73a2fce6042', 'Table 1', 4, true),
  ('986cf22f-1ff6-4d44-af8c-d73a2fce6042', 'Table 2', 4, true),
  ('986cf22f-1ff6-4d44-af8c-d73a2fce6042', 'Table 3', 6, true),
  ('986cf22f-1ff6-4d44-af8c-d73a2fce6042', 'Table 4', 4, true),
  ('986cf22f-1ff6-4d44-af8c-d73a2fce6042', 'Table 5', 4, true),
  ('986cf22f-1ff6-4d44-af8c-d73a2fce6042', 'Table 6', 8, true),
  ('986cf22f-1ff6-4d44-af8c-d73a2fce6042', 'Table 7', 6, true),
  ('986cf22f-1ff6-4d44-af8c-d73a2fce6042', 'Table 8', 4, true),
  ('986cf22f-1ff6-4d44-af8c-d73a2fce6042', 'Table 9', 4, true),
  ('986cf22f-1ff6-4d44-af8c-d73a2fce6042', 'Table 10', 6, true),
  ('986cf22f-1ff6-4d44-af8c-d73a2fce6042', 'VIP Booth', 8, true),
  ('986cf22f-1ff6-4d44-af8c-d73a2fce6042', 'Patio', 6, true),
  ('986cf22f-1ff6-4d44-af8c-d73a2fce6042', 'Near TV', 4, true),
  ('986cf22f-1ff6-4d44-af8c-d73a2fce6042', 'Bar Counter', 2, true),
  ('986cf22f-1ff6-4d44-af8c-d73a2fce6042', 'Outdoor 1', 6, true),
  ('986cf22f-1ff6-4d44-af8c-d73a2fce6042', 'Outdoor 2', 6, true),
  ('986cf22f-1ff6-4d44-af8c-d73a2fce6042', 'Private Room', 10, true),
  ('986cf22f-1ff6-4d44-af8c-d73a2fce6042', 'Window Seat', 2, true),
  ('986cf22f-1ff6-4d44-af8c-d73a2fce6042', 'Family Table', 8, true),
  ('986cf22f-1ff6-4d44-af8c-d73a2fce6042', 'High Top', 4, true);
