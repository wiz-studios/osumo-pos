"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts'
import { ArrowUpRight, ArrowDownRight, DollarSign, ShoppingBag, Activity, Users, CreditCard, Wallet, Utensils, Loader2 } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { useStaffRole } from "@/hooks/use-staff-role"

// --- Interfaces ---
interface DashboardOrder {
  id: string
  total: number
  created_at: string
  payment_method: string | null
  status: string
  order_items: Array<{
    quantity: number
    subtotal: number
    menu_item: {
      name: string
      category: {
        name: string
      } | null
    } | null
  }>
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1']

export default function DashboardPage() {
  const { role } = useStaffRole()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    orders: 0,
    qtySold: 0,
    sales: 0,
    avgPrice: 0
  })

  const [topItemsData, setTopItemsData] = useState<any[]>([])
  const [salesByCategoryData, setSalesByCategoryData] = useState<any[]>([])
  const [monthlyTrendData, setMonthlyTrendData] = useState<any[]>([])
  const [paymentMethodData, setPaymentMethodData] = useState<any[]>([])

  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = getSupabaseClient()
        const now = new Date()
        const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString()

        // Fetch orders with items and categories
        const { data: orders, error } = await supabase
          .from('orders')
          .select(`
            id,
            total,
            created_at,
            payment_method,
            status,
            order_items (
              quantity,
              subtotal,
              menu_item:menu_items (
                name,
                category:menu_categories (
                  name
                )
              )
            )
          `)
          .gte('created_at', startOfYear)
          .neq('status', 'cancelled') // Exclude cancelled orders

        if (error) throw error

        const typedOrders = (orders || []) as unknown as DashboardOrder[]

        if (!typedOrders.length) {
          setLoading(false)
          return
        }

        // --- Process Data ---

        // 1. Key Metrics
        const totalOrders = typedOrders.length
        const totalRevenue = typedOrders.reduce((sum, o) => sum + (o.total || 0), 0)
        const totalQty = typedOrders.reduce((sum, o) =>
          sum + (o.order_items?.reduce((is, i) => is + i.quantity, 0) || 0), 0
        )
        const avgPrice = totalOrders > 0 ? totalRevenue / totalOrders : 0

        setStats({
          orders: totalOrders,
          qtySold: totalQty,
          sales: totalRevenue,
          avgPrice: avgPrice
        })

        // 2. Top Items
        const itemMap = new Map<string, { name: string; sales: number; quantity: number }>()
        typedOrders.forEach(order => {
          order.order_items?.forEach((item) => {
            const name = item.menu_item?.name || 'Unknown'
            if (!itemMap.has(name)) {
              itemMap.set(name, { name, sales: 0, quantity: 0 })
            }
            const entry = itemMap.get(name)!
            entry.sales += item.subtotal || 0
            entry.quantity += item.quantity || 0
          })
        })
        const sortedItems = Array.from(itemMap.values())
          .sort((a, b) => b.sales - a.sales)
          .slice(0, 5)
        setTopItemsData(sortedItems)

        // 3. Sales by Category
        const catMap = new Map<string, { name: string; value: number }>()
        typedOrders.forEach(order => {
          order.order_items?.forEach((item) => {
            const catName = item.menu_item?.category?.name || 'Uncategorized'
            if (!catMap.has(catName)) {
              catMap.set(catName, { name: catName, value: 0 })
            }
            catMap.get(catName)!.value += item.subtotal || 0
          })
        })
        setSalesByCategoryData(Array.from(catMap.values()).sort((a, b) => b.value - a.value))

        // 4. Monthly Trend
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        const trendMap = new Map<string, { name: string; sales: number; orders: number }>()
        months.forEach(m => trendMap.set(m, { name: m, sales: 0, orders: 0 }))

        typedOrders.forEach(order => {
          const date = new Date(order.created_at)
          const month = months[date.getMonth()]
          const entry = trendMap.get(month)
          if (entry) {
            entry.sales += order.total || 0
            entry.orders += 1
          }
        })
        // Only show up to current month
        const currentMonthIndex = now.getMonth()
        setMonthlyTrendData(Array.from(trendMap.values()).slice(0, currentMonthIndex + 1))

        // 5. Payment Methods
        const payMap = new Map<string, { name: string; value: number }>()
        typedOrders.forEach(order => {
          const method = order.payment_method || 'Unspecified'
          // Normalize method names
          let cleanMethod = method.charAt(0).toUpperCase() + method.slice(1)
          if (cleanMethod.toLowerCase() === 'm-pesa') cleanMethod = 'M-Pesa'

          if (!payMap.has(cleanMethod)) {
            payMap.set(cleanMethod, { name: cleanMethod, value: 0 })
          }
          payMap.get(cleanMethod)!.value += 1
        })
        setPaymentMethodData(Array.from(payMap.values()))

      } catch (err) {
        console.error("Error fetching dashboard data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        Loading Dashboard...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6 font-sans">
      {/* Header */}
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Restaurant Sales Dashboard</h1>
        <div className="flex items-center gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-1 flex text-sm">
            <button className="px-3 py-1 bg-blue-600 text-white rounded-md">2025</button>
          </div>
          <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 font-bold">
            {role?.charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 justify-between">
        <Tabs defaultValue="all" className="w-full md:w-auto">
          <TabsList className="bg-slate-900 border border-slate-800 text-slate-400">
            <TabsTrigger value="all" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">All Items</TabsTrigger>
            <TabsTrigger value="food" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Food</TabsTrigger>
            <TabsTrigger value="drinks" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Drinks</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800">
            <DollarSign className="h-4 w-4 mr-2" /> Cash
          </Button>
          <Button variant="outline" size="sm" className="bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800">
            <CreditCard className="h-4 w-4 mr-2" /> Card
          </Button>
          <Button variant="outline" size="sm" className="bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800">
            <Wallet className="h-4 w-4 mr-2" /> M-Pesa
          </Button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Orders */}
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-400 text-sm font-medium mb-1">Orders</p>
                <h3 className="text-3xl font-bold text-white">
                  {stats.orders.toLocaleString()}
                </h3>
              </div>
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <ShoppingBag className="h-6 w-6 text-blue-500" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-emerald-500 flex items-center font-medium">
                <ArrowUpRight className="h-4 w-4 mr-1" /> --
              </span>
              <span className="text-slate-500 ml-2">MoM</span>
            </div>
          </CardContent>
        </Card>

        {/* Quantity Sold */}
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-400 text-sm font-medium mb-1">Quantity Sold</p>
                <h3 className="text-3xl font-bold text-white">
                  {stats.qtySold.toLocaleString()}
                </h3>
              </div>
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Utensils className="h-6 w-6 text-purple-500" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-emerald-500 flex items-center font-medium">
                <ArrowUpRight className="h-4 w-4 mr-1" /> --
              </span>
              <span className="text-slate-500 ml-2">MoM</span>
            </div>
          </CardContent>
        </Card>

        {/* Sales */}
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-400 text-sm font-medium mb-1">Sales</p>
                <h3 className="text-3xl font-bold text-white">
                  KES {stats.sales.toLocaleString()}
                </h3>
              </div>
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <DollarSign className="h-6 w-6 text-emerald-500" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-emerald-500 flex items-center font-medium">
                <ArrowUpRight className="h-4 w-4 mr-1" /> --
              </span>
              <span className="text-slate-500 ml-2">MoM</span>
            </div>
          </CardContent>
        </Card>

        {/* Avg Price */}
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-400 text-sm font-medium mb-1">Avg. Order Value</p>
                <h3 className="text-3xl font-bold text-white">
                  KES {stats.avgPrice.toFixed(0)}
                </h3>
              </div>
              <div className="p-2 bg-rose-500/10 rounded-lg">
                <Activity className="h-6 w-6 text-rose-500" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-rose-500 flex items-center font-medium">
                <ArrowDownRight className="h-4 w-4 mr-1" /> --
              </span>
              <span className="text-slate-500 ml-2">MoM</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Items Chart */}
        <Card className="bg-slate-900 border-slate-800 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white text-lg">Top Items by Sales and Quantity Sold</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {topItemsData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topItemsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                      itemStyle={{ color: '#e2e8f0' }}
                    />
                    <Legend />
                    <Bar dataKey="sales" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} name="Sales (KES)" />
                    <Bar dataKey="quantity" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={40} name="Quantity" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500">
                  No data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sales by Category */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-lg">Sales by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {salesByCategoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesByCategoryData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                    <XAxis type="number" stroke="#64748b" fontSize={12} hide />
                    <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} width={80} />
                    <Tooltip
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                    />
                    <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} name="Sales (KES)">
                      {salesByCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500">
                  No data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-lg">Monthly Trend - Sales & Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              {monthlyTrendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyTrendData}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="left" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="right" orientation="right" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                    />
                    <Area yAxisId="left" type="monotone" dataKey="sales" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSales)" strokeWidth={2} name="Sales (KES)" />
                    <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#e2e8f0" strokeWidth={2} dot={false} name="Orders" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500">
                  No data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-lg">Orders by Payment Method</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full flex items-center justify-center">
              {paymentMethodData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentMethodData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      nameKey="name"
                    >
                      {paymentMethodData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                    />
                    <Legend verticalAlign="middle" align="right" layout="vertical" />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-slate-500">
                  No data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
