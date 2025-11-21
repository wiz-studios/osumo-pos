import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export const updateSession = async (request: NextRequest) => {
  const supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  try {
    // Refresh session if needed and validate it
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error("Session refresh error:", error)
    }
    
    // Validate session is actually valid
    if (session && session.expires_at) {
      const expiresAt = new Date(session.expires_at * 1000)
      if (expiresAt < new Date()) {
        console.warn("Session expired:", expiresAt)
      }
    }
  } catch (err) {
    console.error("Middleware error:", err)
  }

  return supabaseResponse
}
