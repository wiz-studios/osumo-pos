import type React from "react"
import { getSupabaseServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check for valid, authenticated user using getUser() which validates the session
  const supabase = await getSupabaseServer()
  const { data: { user }, error } = await supabase.auth.getUser()

  // Only redirect if we have a valid user (getUser() validates session automatically)
  // If there's an error or no user, the session is invalid/expired
  // Only redirect if we have a valid user (getUser() validates session automatically)
  // If there's an error or no user, the session is invalid/expired
  if (!error && user) {
    // Don't redirect if we're on the staff login page
    // We need to check the headers since we're in a server component layout
    const headersList = await import("next/headers").then(mod => mod.headers())
    const pathname = headersList.get("x-url") || ""

    if (!pathname.includes("/auth/staff-login")) {
      redirect("/dashboard")
    }
  }

  return <>{children}</>
}
