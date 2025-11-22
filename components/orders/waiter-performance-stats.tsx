"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Clock, TrendingUp } from "lucide-react"

interface WaiterStats {
    waiterId: string
    waiterName: string
    orderCount: number
    avgTimeToKitchen: number
}

interface WaiterPerformanceStatsProps {
    orders: Array<{
        id: string
        staff_id: string
        staff?: {
            id: string
            first_name: string | null
            last_name: string | null
        } | null
        created_at: string
        sent_to_kitchen_at: string
    }>
}

export function WaiterPerformanceStats({ orders }: WaiterPerformanceStatsProps) {
    // Calculate stats
    const waiterMap = new Map<string, WaiterStats>()
    let totalTimeToKitchen = 0
    let ordersWithTiming = 0

    orders.forEach(order => {
        const waiterId = order.staff_id
        const waiterName = order.staff
            ? `${order.staff.first_name || ''} ${order.staff.last_name || ''}`.trim() || 'Unknown'
            : 'Unknown'

        // Get or create waiter stats
        if (!waiterMap.has(waiterId)) {
            waiterMap.set(waiterId, {
                waiterId,
                waiterName,
                orderCount: 0,
                avgTimeToKitchen: 0
            })
        }

        const stats = waiterMap.get(waiterId)!
        stats.orderCount++

        // Calculate time to kitchen
        if (order.sent_to_kitchen_at && order.created_at) {
            const created = new Date(order.created_at).getTime()
            const sentToKitchen = new Date(order.sent_to_kitchen_at).getTime()
            const timeInMinutes = (sentToKitchen - created) / 60000

            totalTimeToKitchen += timeInMinutes
            ordersWithTiming++
        }
    })

    const waiterStats = Array.from(waiterMap.values())
    const avgTimeToKitchen = ordersWithTiming > 0 ? totalTimeToKitchen / ordersWithTiming : 0

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            {/* Total Active Orders */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        Active Orders
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{orders.length}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Currently in kitchen/cashier
                    </p>
                </CardContent>
            </Card>

            {/* Avg Time to Kitchen */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Clock className="h-4 w-4 text-orange-500" />
                        Avg Time to Kitchen
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {avgTimeToKitchen.toFixed(1)} min
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Order creation → kitchen
                    </p>
                </CardContent>
            </Card>

            {/* Orders by Waiter */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-500" />
                        Orders by Waiter
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-1">
                        {waiterStats.length > 0 ? (
                            waiterStats
                                .sort((a, b) => b.orderCount - a.orderCount)
                                .slice(0, 3)
                                .map(stat => (
                                    <div key={stat.waiterId} className="flex justify-between text-xs">
                                        <span className="truncate">{stat.waiterName}</span>
                                        <span className="font-semibold ml-2">{stat.orderCount}</span>
                                    </div>
                                ))
                        ) : (
                            <p className="text-xs text-muted-foreground">No data</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
