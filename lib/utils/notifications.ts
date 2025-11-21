import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function sendLowStockNotification(inventoryItemName: string, restaurantId: string, referenceId: string) {
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

  await supabase.from("notifications").insert({
    restaurant_id: restaurantId,
    notification_type: "low_stock",
    title: "Low Stock Alert",
    message: `${inventoryItemName} is below reorder level`,
    reference_id: referenceId,
  })
}

export async function sendOrderReadyNotification(orderId: string, restaurantId: string) {
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

  await supabase.from("notifications").insert({
    restaurant_id: restaurantId,
    notification_type: "order_ready",
    title: "Order Ready",
    message: `Order is ready for pickup or delivery`,
    reference_id: orderId,
  })
}

export async function sendStationFullNotification(stationName: string, restaurantId: string, stationId: string) {
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

  await supabase.from("notifications").insert({
    restaurant_id: restaurantId,
    notification_type: "station_full",
    title: "Station at Capacity",
    message: `${stationName} is operating at max capacity`,
    reference_id: stationId,
  })
}
