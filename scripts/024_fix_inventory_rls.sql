-- Fix Row Level Security policies for inventory_items table
-- This allows authenticated users to update inventory items for their restaurant

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can update inventory for their restaurant" ON inventory_items;
DROP POLICY IF EXISTS "Users can view inventory for their restaurant" ON inventory_items;
DROP POLICY IF EXISTS "Users can insert inventory for their restaurant" ON inventory_items;
DROP POLICY IF EXISTS "Users can delete inventory for their restaurant" ON inventory_items;

-- Create policy for SELECT operations
CREATE POLICY "Users can view inventory for their restaurant"
ON inventory_items
FOR SELECT
USING (
  restaurant_id IN (
    SELECT restaurant_id 
    FROM staff 
    WHERE user_id = auth.uid()
  )
);

-- Create policy for INSERT operations
CREATE POLICY "Users can insert inventory for their restaurant"
ON inventory_items
FOR INSERT
WITH CHECK (
  restaurant_id IN (
    SELECT restaurant_id 
    FROM staff 
    WHERE user_id = auth.uid()
  )
);

-- Create policy for UPDATE operations (THIS IS THE KEY FIX)
CREATE POLICY "Users can update inventory for their restaurant"
ON inventory_items
FOR UPDATE
USING (
  restaurant_id IN (
    SELECT restaurant_id 
    FROM staff 
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  restaurant_id IN (
    SELECT restaurant_id 
    FROM staff 
    WHERE user_id = auth.uid()
  )
);

-- Create policy for DELETE operations
CREATE POLICY "Users can delete inventory for their restaurant"
ON inventory_items
FOR DELETE
USING (
  restaurant_id IN (
    SELECT restaurant_id 
    FROM staff 
    WHERE user_id = auth.uid()
  )
);
