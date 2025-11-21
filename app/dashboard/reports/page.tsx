"use client"

import { useEffect, useState } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts"
import { Calendar, DollarSign, CreditCard, ShoppingBag, TrendingUp, Smartphone, Banknote } from "lucide-react"
import { startOfDay, endOfDay, subDays, format, isSameDay, parseISO } from "date-fns"
import type { Order, OrderItem } from "@/lib/types"

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

export default function ReportsPage() {
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<Order[]>([])
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [timeRange, setTimeRange] = useState("7days")

  useEffect(() => {
    fetchData()
  }, [timeRange])

  const fetchData = async () => {
    setLoading(true)
    const supabase = getSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    // Get staff/restaurant info
    const { data: staff } = await supabase.from("staff").select("restaurant_id").eq("user_id", user.id).single()

    if (!staff?.restaurant_id) return

    // Calculate date range
    const now = new Date()
    let startDate = subDays(now, 7)
    if (timeRange === "today") startDate = startOfDay(now)
    if (timeRange === "30days") startDate = subDays(now, 30)

    // Fetch orders
    const { data: ordersData, error: ordersError } = await supabase
      .from("orders")
      .select("*")
      .eq("restaurant_id", staff.restaurant_id)
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: true })

    if (ordersData) {
      setOrders(ordersData)

      // Fetch order items for these orders
      const orderIds = ordersData.map(o => o.id)
      if (orderIds.length > 0) {
        const { data: itemsData } = await supabase
          .from("order_items")
          .select("*, menu_item:menu_items(name)")
          .in("order_id", orderIds)

        if (itemsData) setOrderItems(itemsData)
      } else {
        setOrderItems([])
      }
    }

    setLoading(false)
  }

  // --- Aggregation Logic ---

  // 1. Today's Summary
  const today = new Date()
  const todayOrders = orders.filter(o => isSameDay(parseISO(o.created_at), today))
  const todayTotal = todayOrders.reduce((sum, o) => sum + (o.total || 0), 0)
  const todayCount = todayOrders.length
  const todayAvg = todayCount > 0 ? todayTotal / todayCount : 0
  const todayCash = todayOrders.filter(o => o.payment_method === "cash").reduce((sum, o) => sum + (o.total || 0), 0)
  const todayMpesa = todayOrders.filter(o => o.payment_method === "m-pesa").reduce((sum, o) => sum + (o.total || 0), 0)

  // 2. Sales Chart Data (Group by Day)
  const salesByDay = orders.reduce((acc, order) => {
    const date = format(parseISO(order.created_at), "EEE dd")
    if (!acc[date]) acc[date] = { date, total: 0, count: 0 }
    acc[date].total += order.total
    acc[date].count += 1
    return acc
  }, {} as Record<string, { date: string, total: number, count: number }>)

  const chartData = Object.values(salesByDay)

  // 3. Payment Method Breakdown
  const paymentMethods = orders.reduce((acc, order) => {
    const method = order.payment_method || "unknown"
    if (!acc[method]) acc[method] = 0
    acc[method] += order.total
    return acc
  }, {} as Record<string, number>)

  const paymentData = Object.entries(paymentMethods).map(([name, value]) => ({ name, value }))

  // 4. Top Selling Items
  const itemSales = orderItems.reduce((acc, item) => {
    const name = item.menu_item?.name || "Unknown Item"
    if (!acc[name]) acc[name] = { name, quantity: 0, revenue: 0 }
    acc[name].quantity += item.quantity
    acc[name].revenue += item.subtotal
    return acc
  }, {} as Record<string, { name: string, quantity: number, revenue: number }>)

  const topItems = Object.values(itemSales)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5)

  if (loading) return <div className="flex items-center justify-center h-screen">Loading Reports...</div>

  return (
    <div className="p-4 space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Sales Reports</h1>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="7days">Last 7 Days</SelectItem>
            <SelectItem value="30days">Last 30 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales (Today)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {todayTotal.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {todayCount} orders today
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {todayAvg.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">
              Per order average
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">M-Pesa Sales</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {todayMpesa.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Mobile money payments
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash Sales</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {todayCash.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Cash in drawer
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Sales Chart */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Sales Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `K${value}`}
                  />
                  <Tooltip
                    formatter={(value: number) => [`KES ${value.toLocaleString()}`, "Sales"]}
                    labelStyle={{ color: "black" }}
                  />
                  <Bar dataKey="total" fill="#adfa1d" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Payment Breakdown & Top Items */}
        <div className="col-span-3 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {paymentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `KES ${value.toLocaleString()}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Selling Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topItems.map((item, index) => (
                  <div key={index} className="flex items-center">
                    <div className="ml-4 space-y-1 flex-1">
                      <p className="text-sm font-medium leading-none">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity} sold
                      </p>
                    </div>
                    <div className="font-medium">KES {item.revenue.toLocaleString()}</div>
                  </div>
                ))}
                {topItems.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No sales data yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
