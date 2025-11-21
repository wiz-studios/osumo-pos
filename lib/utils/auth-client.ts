import { getSupabaseClient } from "@/lib/supabase/client"

export const signOut = async () => {
  // Clear all staff identity data from localStorage
  localStorage.removeItem('current_staff_id')
  localStorage.removeItem('current_staff_role')
  localStorage.removeItem('current_staff_name')
  
  // Sign out from Supabase auth
  const supabase = getSupabaseClient()
  await supabase.auth.signOut()
}

