import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ error: "Missing or invalid userId" }, { status: 400 })
    }

    const admin = getSupabaseAdmin()

    // Delete the user account
    const { error } = await admin.auth.admin.deleteUser(userId)

    if (error) {
      console.error("Error deleting user:", error)
      return NextResponse.json({ error: "Failed to delete user: " + error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Cleanup user error:", err)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

