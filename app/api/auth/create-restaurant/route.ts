import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { userId, firstName, lastName, restaurantName, email } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 })
    }

    const admin = getSupabaseAdmin()

    // Validate user exists in this project
    const userLookup = await admin.auth.admin.getUserById(userId)
    if (userLookup.error || !userLookup.data?.user) {
      return NextResponse.json({ error: "Invalid userId (user not found)" }, { status: 400 })
    }

    // Call transactional RPC to create restaurant and staff atomically
    const { data: rpcData, error: rpcError } = await admin.rpc("signup_bootstrap", {
      p_user_id: userId,
      p_first: firstName || "",
      p_last: lastName || "",
      p_restaurant_name: restaurantName || `${firstName || ""} ${lastName || ""}'s Restaurant`,
    })

    if (rpcError) {
      console.error("[v0] RPC signup_bootstrap error:", rpcError)
      return NextResponse.json({ error: "Failed to create restaurant: " + rpcError.message }, { status: 500 })
    }

    const restaurantId = rpcData as string

    return NextResponse.json({ success: true, restaurant_id: restaurantId })
  } catch (err) {
    console.error("[v0] Signup error:", err)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
