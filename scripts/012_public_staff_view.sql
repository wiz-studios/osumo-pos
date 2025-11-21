-- Add public SELECT policy for staff login page
-- This allows unauthenticated users to see the list of active staff members
-- (needed for the staff login page to work)

CREATE POLICY "public_view_active_staff" ON staff
  FOR SELECT
  USING (active = true);
