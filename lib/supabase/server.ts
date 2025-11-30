import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export const getSupabaseServer = async () => {
  // Create a new client per request to avoid stale cookie data
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // Cookie writes will fail in Server Components (layouts, pages) because
            // Next.js only allows cookie modifications in Server Actions or Route Handlers.
            // This is expected and safe - the session is still read correctly, and cookie
            // updates will happen on subsequent requests via client-side Supabase.
          }
        },
      },
    },
  )
}
