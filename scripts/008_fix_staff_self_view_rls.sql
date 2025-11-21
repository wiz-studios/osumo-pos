-- Fix RLS recursion issue by adding a direct self-view policy

-- Allow users to always see their own staff profile (breaks recursion for the general policy)
CREATE POLICY "staff_view_own_profile" ON staff
  FOR SELECT USING (
    user_id = auth.uid()
  );
