import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { getSupabaseServer } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Verify the current user is authenticated and is a manager
    const supabase = await getSupabaseServer()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is a manager
    const { data: staffData } = await supabase.from("staff").select("role, restaurant_id").eq("user_id", user.id).single()

    if (!staffData || staffData.role !== "manager") {
      return NextResponse.json({ error: "Only managers can invite staff" }, { status: 403 })
    }

    const { email, role, restaurantId } = await request.json()

    if (!email || !role || !restaurantId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate restaurantId matches the manager's restaurant
    if (staffData.restaurant_id !== restaurantId) {
      return NextResponse.json({ error: "Invalid restaurant" }, { status: 403 })
    }

    // Validate role
    const validRoles = ["cashier", "kitchen", "manager"]
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    const admin = getSupabaseAdmin()

    // Generate temporary password
    const temporaryPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12)

    // Create auth user with temporary password
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: false,
    })

    if (authError) {
      console.error("Error creating user:", authError)
      return NextResponse.json({ error: "Failed to create user: " + authError.message }, { status: 500 })
    }

    if (!authData?.user?.id) {
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
    }

    // Create staff record
    const { error: staffError } = await admin.from("staff").insert({
      user_id: authData.user.id,
      restaurant_id: restaurantId,
      role,
      email,
      active: true,
    })

    if (staffError) {
      // Attempt to clean up the user if staff creation fails
      try {
        await admin.auth.admin.deleteUser(authData.user.id)
      } catch (deleteError) {
        console.error("Failed to cleanup user after staff creation failure:", deleteError)
      }

      console.error("Error creating staff record:", staffError)
      return NextResponse.json({ error: "Failed to create staff record: " + staffError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, userId: authData.user.id })
  } catch (err) {
    console.error("Invite staff error:", err)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

