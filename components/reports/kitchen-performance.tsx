"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ChefHat, Clock, AlertTriangle, TrendingUp } from "lucide-react"
import type { Order } from "@/lib/types"

interface KitchenStats {
    ordersCooked: number
    avgCookTimeMinutes: number
    lateOrders: number // Orders taking > 15 mins
}

interface KitchenPerformanceProps {
    orders: Order[]
}

export function KitchenPerformance({ orders }: KitchenPerformanceProps) {
    // 1. Filter for Kitchen Orders (Completed)
    // Assuming 'ready' or 'completed' status means it passed through kitchen
    // For now, we'll look at orders that have a 'sent_to_kitchen_at' and 'ready_at' (if available)
    // Or just use status 'ready', 'served', 'completed'

    const kitchenOrders = orders.filter(o =>
        o.kitchen_status === 'ready' ||
        o.kitchen_status === 'served' ||
        (o.status === 'completed' && o.order_type !== 'takeaway') // Assumption
    )

    let totalCookTime = 0
    let ordersWithTime = 0
    let lateOrdersCount = 0

    kitchenOrders.forEach(order => {
        // Calculate cook time if timestamps exist
        // Note: We need to ensure these fields exist in our Order type or are fetched
        // If not, we might need to rely on mock data or just counts for now

        // Mocking calculation logic if fields were present:
        if ((order as any).sent_to_kitchen_at && (order as any).ready_at) {
            const start = new Date((order as any).sent_to_kitchen_at).getTime()
            const end = new Date((order as any).ready_at).getTime()
            const minutes = (end - start) / 60000

            if (minutes > 0) {
                totalCookTime += minutes
                ordersWithTime++

                if (minutes > 15) lateOrdersCount++
            }
        }
    })

    const avgCookTime = ordersWithTime > 0 ? totalCookTime / ordersWithTime : 0

    return (
        <div className="space-y-6">
            {/* Highlights */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Orders Cooked</CardTitle>
                        <ChefHat className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{kitchenOrders.length}</div>
                        <p className="text-xs text-muted-foreground">
                            Total orders processed
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Cook Time</CardTitle>
                        <Clock className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {ordersWithTime > 0 ? `${avgCookTime.toFixed(0)} min` : "N/A"}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Target: &lt; 15 mins
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Late Orders</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            {lateOrdersCount}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Took &gt; 15 mins
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Table (Recent Kitchen Orders) */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Kitchen Activity</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Order #</TableHead>
                                <TableHead>Items</TableHead>
                                <TableHead className="text-right">Time Taken</TableHead>
                                <TableHead className="text-right">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {kitchenOrders.slice(0, 5).map((order) => {
                                let timeTaken = "N/A"
                                let isLate = false
                                if ((order as any).sent_to_kitchen_at && (order as any).ready_at) {
                                    const start = new Date((order as any).sent_to_kitchen_at).getTime()
                                    const end = new Date((order as any).ready_at).getTime()
                                    const mins = (end - start) / 60000
                                    timeTaken = `${mins.toFixed(0)} min`
                                    isLate = mins > 15
                                }

                                return (
                                    <TableRow key={order.id}>
                                        <TableCell className="font-medium">#{order.id.slice(0, 6)}</TableCell>
                                        <TableCell>{(order as any).items_count || "Multiple"} items</TableCell>
                                        <TableCell className={`text-right ${isLate ? "text-red-600 font-bold" : ""}`}>
                                            {timeTaken}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                Completed
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                            {kitchenOrders.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                        No kitchen data available for this period.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
