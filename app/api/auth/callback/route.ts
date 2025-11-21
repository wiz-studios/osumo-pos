import { getSupabaseServer } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// Validate redirect URL to prevent open redirect vulnerability
function validateRedirectUrl(url: string): string {
  // Only allow relative URLs that start with /
  // Reject URLs starting with // (protocol-relative) or containing :// (absolute URLs)
  if (url.startsWith("/") && !url.startsWith("//") && !url.includes("://")) {
    return url
  }
  return "/dashboard"
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const nextParam = searchParams.get("next") || "/dashboard"

  // Validate code parameter
  if (!code || typeof code !== "string" || code.length < 20) {
    return NextResponse.redirect(
      new URL(`/auth/login?error=${encodeURIComponent("Invalid authentication code")}`, request.url),
    )
  }

  // Validate and sanitize redirect URL
  const safeNext = validateRedirectUrl(nextParam)

  try {
    const supabase = await getSupabaseServer()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error("OAuth callback error:", error)
      return NextResponse.redirect(
        new URL(`/auth/login?error=${encodeURIComponent(error.message)}`, request.url),
      )
    }

    // Success - redirect to safe next page
    return NextResponse.redirect(new URL(safeNext, request.url))
  } catch (err) {
    console.error("OAuth callback exception:", err)
    return NextResponse.redirect(
      new URL(`/auth/login?error=${encodeURIComponent("Authentication failed. Please try again.")}`, request.url),
    )
  }
}
