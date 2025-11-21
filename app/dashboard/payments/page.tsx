"use client"

import { useEffect, useState } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PaymentDialog } from "@/components/payments/payment-dialog"
import type { Order } from "@/lib/types"
import { CreditCard, Eye } from "lucide-react"

export default function PaymentsPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [filter, setFilter] = useState("unpaid")

  useEffect(() => {
    const fetchData = async () => {
      const supabase = getSupabaseClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data: staff } = await supabase.from("staff").select("restaurant_id").eq("user_id", user.id).single()

      const resId = staff?.restaurant_id
      setRestaurantId(resId)

      const { data: ordersData } = await supabase
        .from("orders")
        .select(`
          *,
          order_items(
            *,
            menu_item:menu_items(*)
          )
        `)
        .eq("restaurant_id", resId)
        .in("status", ["new", "in_progress", "completed"])
        .order("created_at", { ascending: false })

      setOrders(ordersData || [])
      setLoading(false)
    }

    fetchData()
  }, [])

  const handlePaymentOpen = (order: Order) => {
    setSelectedOrder(order)
    setPaymentDialogOpen(true)
  }

  const handlePaymentComplete = (updatedOrder: Order) => {
    setOrders(orders.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)))
    setPaymentDialogOpen(false)
  }

  const filteredOrders = orders.filter((order) => {
    if (filter === "all") return true
    if (filter === "unpaid") return order.payment_status === "unpaid"
    if (filter === "partial") return order.payment_status === "partial"
    if (filter === "paid") return order.payment_status === "paid"
    return true
  })

  const totals = {
    all: orders.reduce((sum, o) => sum + o.total, 0),
    paid: orders.filter((o) => o.payment_status === "paid").reduce((sum, o) => sum + o.total, 0),
    partial: orders.filter((o) => o.payment_status === "partial").reduce((sum, o) => sum + o.total, 0),
    unpaid: orders.filter((o) => o.payment_status === "unpaid").reduce((sum, o) => sum + o.total, 0),
  }

  if (loading) return <div className="p-6">Loading...</div>

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">Payments</h1>
        <div className="flex items-center gap-2 bg-muted px-4 py-2 rounded">
          <CreditCard size={18} />
          <span className="font-semibold">KES {totals.unpaid.toFixed(2)} Outstanding</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {totals.all.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">KES {totals.paid.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Partial</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">KES {totals.partial.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">KES {totals.unpaid.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="all">All Orders</TabsTrigger>
          <TabsTrigger value="unpaid">Unpaid</TabsTrigger>
          <TabsTrigger value="partial">Partial</TabsTrigger>
          <TabsTrigger value="paid">Paid</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-6 space-y-4">
          {filteredOrders.length > 0 ? (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <Card key={order.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">
                          {order.order_type === "dine-in"
                            ? `Table ${order.table_number}`
                            : order.customer_name || order.order_type}
                        </h3>
                        <p className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleString()}</p>
                        <div className="flex gap-2 mt-2">
                          <span className="text-xs px-2 py-1 rounded bg-muted">{order.order_type}</span>
                          {order.payment_method && (
                            <span className="text-xs px-2 py-1 rounded bg-muted">{order.payment_method}</span>
                          )}
                        </div>
                      </div>

                      <div className="text-right mr-4">
                        <p className="text-2xl font-bold">KES {order.total.toFixed(2)}</p>
                        <span
                          className={`inline-block text-xs px-2 py-1 rounded mt-1 ${
                            order.payment_status === "paid"
                              ? "bg-green-100 text-green-700"
                              : order.payment_status === "partial"
                                ? "bg-orange-100 text-orange-700"
                                : "bg-red-100 text-red-700"
                          }`}
                        >
                          {order.payment_status}
                        </span>
                      </div>

                      <Button onClick={() => handlePaymentOpen(order)} className="gap-2">
                        <Eye size={16} />
                        Process Payment
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">No orders in this category</CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {selectedOrder && (
        <PaymentDialog
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          order={selectedOrder}
          onPaymentComplete={handlePaymentComplete}
        />
      )}
    </div>
  )
}
