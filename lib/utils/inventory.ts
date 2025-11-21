import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function deductInventoryOnOrderCompletion(orderId: string, restaurantId: string) {
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
      },
    },
  })

  // Get order items
  const { data: orderItems, error: itemsError } = await supabase
    .from("order_items")
    .select("menu_item_id, quantity")
    .eq("order_id", orderId)

  if (itemsError) throw itemsError

  // For each item, get its recipe and deduct ingredients
  for (const item of orderItems || []) {
    const { data: recipe } = await supabase
      .from("recipe_ingredients")
      .select("inventory_item_id, quantity_required")
      .eq("menu_item_id", item.menu_item_id)

    for (const ingredient of recipe || []) {
      const deductAmount = ingredient.quantity_required * item.quantity

      // Update inventory
      await supabase
        .from("inventory_items")
        .update({
          quantity_in_stock: `quantity_in_stock - ${deductAmount}` as any,
        })
        .eq("id", ingredient.inventory_item_id)

      // Log transaction
      const { data: user } = await supabase.auth.getUser()
      await supabase.from("inventory_transactions").insert({
        restaurant_id: restaurantId,
        inventory_item_id: ingredient.inventory_item_id,
        transaction_type: "order_deduction",
        quantity: -deductAmount,
        reference_id: orderId,
        created_by: user?.id,
      })
    }
  }
}

export async function checkLowStockAndNotify(restaurantId: string) {
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
      },
    },
  })

  // Get low stock items
  const { data: lowStockItems } = await supabase
    .from("inventory_items")
    .select("id, name, quantity_in_stock, reorder_level")
    .eq("restaurant_id", restaurantId)
    .lte("quantity_in_stock", "reorder_level")

  // Create notifications for each low stock item
  for (const item of lowStockItems || []) {
    await supabase.from("notifications").insert({
      restaurant_id: restaurantId,
      notification_type: "low_stock",
      title: "Low Stock Alert",
      message: `${item.name} is below reorder level (${item.quantity_in_stock} remaining)`,
      reference_id: item.id,
    })
  }
}
