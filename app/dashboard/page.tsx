import { requireAuth } from "@/lib/utils/protected-route"
import { getSupabaseServer } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const user = await requireAuth()

  const supabase = await getSupabaseServer()

  // First, try to find the user's restaurant by ownership (works right after signup)
  const { data: ownedRestaurant } = await supabase
    .from("restaurants")
    .select("id")
    .eq("owner_id", user.id)
    .single()

  let restaurantId = ownedRestaurant?.id as string | undefined

  if (!restaurantId) {
    // Fallback to staff membership lookup. Some schemas may not have user_id; ignore 42703 column errors
    const { data: staff, error: staffError } = await supabase
      .from("staff")
      .select("restaurant_id")
      .eq("user_id", user.id)
      .single()

    if (staffError && (staffError as any)?.code !== "42703") {
      console.warn("[v0] Staff lookup error:", staffError)
    }

    if (staff?.restaurant_id) {
      restaurantId = staff.restaurant_id
    }
  }

  if (!restaurantId) {
    redirect("/auth/login")
  }

  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .order("created_at", { ascending: false })

  if (ordersError) {
    console.warn("[v0] Error fetching orders:", ordersError)
  }

  const totalOrders = orders?.length || 0
  const totalRevenue = orders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0
  const activeOrders = orders?.filter((o) => o.status !== "paid" && o.status !== "completed").length || 0

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{totalOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">KES {totalRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{activeOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Order Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              KES {totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(0) : 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {orders?.slice(0, 5).map((order) => (
              <div key={order.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium text-foreground">Table {order.table_number || "Delivery"}</p>
                  <p className="text-sm text-muted-foreground">{order.order_type}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-foreground">KES {order.total}</p>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      order.status === "paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
