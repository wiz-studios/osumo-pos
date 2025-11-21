-- Fix RLS policies for staff table

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "staff_access_own_restaurant" ON staff;

-- Allow staff to view all staff members in their restaurant
CREATE POLICY "staff_view_restaurant_members" ON staff
  FOR SELECT USING (
    restaurant_id IN (
      SELECT restaurant_id FROM staff WHERE user_id = auth.uid()
    )
  );

-- Allow managers to insert new staff members
CREATE POLICY "managers_insert_staff" ON staff
  FOR INSERT WITH CHECK (
    restaurant_id IN (
      SELECT restaurant_id FROM staff 
      WHERE user_id = auth.uid() AND role = 'manager'
    )
  );

-- Allow managers to update staff members
CREATE POLICY "managers_update_staff" ON staff
  FOR UPDATE USING (
    restaurant_id IN (
      SELECT restaurant_id FROM staff 
      WHERE user_id = auth.uid() AND role = 'manager'
    )
  );

-- Allow managers to delete staff members (optional, but good for completeness)
CREATE POLICY "managers_delete_staff" ON staff
  FOR DELETE USING (
    restaurant_id IN (
      SELECT restaurant_id FROM staff 
      WHERE user_id = auth.uid() AND role = 'manager'
    )
  );
