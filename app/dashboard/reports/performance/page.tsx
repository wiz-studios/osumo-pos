"use client"

import { useState, useEffect } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { startOfDay, subDays, parseISO } from "date-fns"
import { WaiterPerformance } from "@/components/reports/waiter-performance"
import { CashierPerformance } from "@/components/reports/cashier-performance"
import { KitchenPerformance } from "@/components/reports/kitchen-performance"
import type { Order, StaffMember } from "@/lib/types"

export default function PerformancePage() {
    const [loading, setLoading] = useState(true)
    const [timeRange, setTimeRange] = useState("today")
    const [orders, setOrders] = useState<Order[]>([])
    const [staffList, setStaffList] = useState<StaffMember[]>([])

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

        // 1. Fetch All Staff (to map names)
        const { data: allStaff } = await supabase
            .from("staff")
            .select("*")
            .eq("restaurant_id", staff.restaurant_id)

        if (allStaff) setStaffList(allStaff)

        // 2. Calculate date range
        const now = new Date()
        let startDate = startOfDay(now) // Default today

        if (timeRange === "7days") startDate = subDays(now, 7)
        if (timeRange === "30days") startDate = subDays(now, 30)

        // 3. Fetch Orders
        const { data: ordersData } = await supabase
            .from("orders")
            .select("*")
            .eq("restaurant_id", staff.restaurant_id)
            .gte("created_at", startDate.toISOString())
            .order("created_at", { ascending: true })

        if (ordersData) setOrders(ordersData)

        setLoading(false)
    }

    if (loading) {
        return <div className="flex items-center justify-center h-screen">Loading Performance Data...</div>
    }

    return (
        <div className="p-4 space-y-6 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Worker Performance</h1>
                    <p className="text-muted-foreground">Track staff efficiency and sales metrics</p>
                </div>
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

            <Tabs defaultValue="waiters" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="waiters">Waiters</TabsTrigger>
                    <TabsTrigger value="cashiers">Cashiers</TabsTrigger>
                    <TabsTrigger value="kitchen">Kitchen</TabsTrigger>
                </TabsList>

                <TabsContent value="waiters" className="space-y-4">
                    <WaiterPerformance orders={orders} staffList={staffList} />
                </TabsContent>

                <TabsContent value="cashiers" className="space-y-4">
                    <CashierPerformance orders={orders} staffList={staffList} />
                </TabsContent>

                <TabsContent value="kitchen" className="space-y-4">
                    <KitchenPerformance orders={orders} />
                </TabsContent>
            </Tabs>
        </div >
    )
}
