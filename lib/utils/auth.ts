import { getSupabaseServer } from "@/lib/supabase/server"

export const getCurrentUser = async () => {
  const supabase = await getSupabaseServer()
  
  // Use getUser() which validates the session and checks expiration
  // This is more reliable than getSession() which might return expired sessions
  const { data, error } = await supabase.auth.getUser()
  
  // If there's an error or no user, return null
  if (error || !data.user) {
    return null
  }
  
  return data.user
}

export const getUserRole = async () => {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = await getSupabaseServer()
  const { data } = await supabase.from("staff").select("role").eq("user_id", user.id).single()

  return data?.role as string | null
}
