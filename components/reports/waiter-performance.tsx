"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Users, DollarSign, ShoppingBag, TrendingUp, AlertCircle } from "lucide-react"
import type { Order } from "@/lib/types"

interface WaiterStats {
    staffId: string
    staffName: string
    ordersTaken: number
    totalSales: number
    avgOrderValue: number
    voidedOrders: number // Placeholder for now, as we might not have void data yet
}

interface WaiterPerformanceProps {
    orders: Order[]
    staffList: any[] // We'll type this properly
}

export function WaiterPerformance({ orders, staffList }: WaiterPerformanceProps) {
    // 1. Aggregate Data
    const statsMap = new Map<string, WaiterStats>()

    // Initialize with all waiters to show even those with 0 orders
    staffList.filter(s => s.role === 'waiter').forEach(staff => {
        statsMap.set(staff.id, {
            staffId: staff.id,
            staffName: `${staff.first_name || ''} ${staff.last_name || ''}`.trim() || 'Unknown',
            ordersTaken: 0,
            totalSales: 0,
            avgOrderValue: 0,
            voidedOrders: 0
        })
    })

    // Process orders
    orders.forEach(order => {
        if (!order.staff_id) return

        // If waiter not in list (maybe deleted or role changed), add them
        if (!statsMap.has(order.staff_id)) {
            // Try to find name from order if populated, otherwise Unknown
            // For now, we rely on the staffList passed in or basic info
            statsMap.set(order.staff_id, {
                staffId: order.staff_id,
                staffName: 'Unknown Waiter', // We might need to fetch this if not in staffList
                ordersTaken: 0,
                totalSales: 0,
                avgOrderValue: 0,
                voidedOrders: 0
            })
        }

        const stat = statsMap.get(order.staff_id)!
        stat.ordersTaken += 1
        stat.totalSales += order.total || 0

        // Check for voided/cancelled if status exists (assuming 'cancelled' for now)
        if (order.status === 'cancelled' as any) {
            stat.voidedOrders += 1
        }
    })

    // Calculate Averages
    const waiterStats = Array.from(statsMap.values()).map(stat => ({
        ...stat,
        avgOrderValue: stat.ordersTaken > 0 ? stat.totalSales / stat.ordersTaken : 0
    })).sort((a, b) => b.totalSales - a.totalSales) // Sort by sales desc

    // Top Performer
    const topPerformer = waiterStats.length > 0 ? waiterStats[0] : null

    return (
        <div className="space-y-6">
            {/* Highlights */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Top Performer</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{topPerformer?.staffName || "N/A"}</div>
                        <p className="text-xs text-muted-foreground">
                            KES {topPerformer?.totalSales.toLocaleString()} sales
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Waiters</CardTitle>
                        <Users className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{waiterStats.filter(w => w.ordersTaken > 0).length}</div>
                        <p className="text-xs text-muted-foreground">
                            Taking orders today
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                        <ShoppingBag className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {waiterStats.reduce((sum, w) => sum + w.ordersTaken, 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Processed by waiters
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Waiter Performance</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Staff Name</TableHead>
                                <TableHead className="text-right">Orders</TableHead>
                                <TableHead className="text-right">Total Sales</TableHead>
                                <TableHead className="text-right">Avg Order Value</TableHead>
                                <TableHead className="text-right">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {waiterStats.map((stat) => (
                                <TableRow key={stat.staffId}>
                                    <TableCell className="font-medium">
                                        {stat.staffName}
                                        {stat.staffId === topPerformer?.staffId && (
                                            <Badge variant="secondary" className="ml-2 text-xs bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                                                🏆 Top
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">{stat.ordersTaken}</TableCell>
                                    <TableCell className="text-right">KES {stat.totalSales.toLocaleString()}</TableCell>
                                    <TableCell className="text-right">KES {stat.avgOrderValue.toFixed(0)}</TableCell>
                                    <TableCell className="text-right">
                                        {stat.ordersTaken > 0 ? (
                                            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Active</Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-muted-foreground">Inactive</Badge>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {waiterStats.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        No waiter data available for this period.
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
