import { getSupabaseClient } from "@/lib/supabase/client"
import type { Order } from "@/lib/types"

export const createOrder = async (
  restaurantId: string,
  orderType: "dine-in" | "takeaway" | "delivery",
  tableNumber?: number,
  customerName?: string,
  items?: Array<{ menuItemId: string; quantity: number; unitPrice: number }>,
) => {
  const supabase = getSupabaseClient()

  const total = items?.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0) || 0

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      restaurant_id: restaurantId,
      table_number: tableNumber,
      customer_name: customerName,
      order_type: orderType,
      total,
    })
    .select()
    .single()

  if (orderError) throw orderError

  if (items && items.length > 0) {
    const orderItems = items.map((item) => ({
      order_id: order.id,
      menu_item_id: item.menuItemId,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      subtotal: item.unitPrice * item.quantity,
    }))

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

    if (itemsError) throw itemsError
  }

  return order
}

export const updateOrderStatus = async (orderId: string, status: Order["status"]) => {
  const supabase = getSupabaseClient()
  const { error } = await supabase
    .from("orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", orderId)

  if (error) throw error
}

export const addItemToOrder = async (orderId: string, menuItemId: string, quantity: number, unitPrice: number) => {
  const supabase = getSupabaseClient()
  const { error } = await supabase.from("order_items").insert({
    order_id: orderId,
    menu_item_id: menuItemId,
    quantity,
    unit_price: unitPrice,
    subtotal: unitPrice * quantity,
  })

  if (error) throw error
}
