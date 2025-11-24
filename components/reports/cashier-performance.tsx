"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Smartphone, Banknote, TrendingUp } from "lucide-react"
import type { Order } from "@/lib/types"

interface CashierStats {
    staffId: string
    staffName: string
    paymentsProcessed: number
    totalRevenue: number
    mpesaCount: number
    cashCount: number
    mpesaPercentage: number
}

interface CashierPerformanceProps {
    orders: Order[]
    staffList: any[]
}

export function CashierPerformance({ orders, staffList }: CashierPerformanceProps) {
    // 1. Aggregate Data
    const statsMap = new Map<string, CashierStats>()

    // Initialize with all cashiers
    staffList.filter(s => s.role === 'cashier' || s.role === 'manager').forEach(staff => {
        statsMap.set(staff.id, {
            staffId: staff.id,
            staffName: `${staff.first_name || ''} ${staff.last_name || ''}`.trim() || 'Unknown',
            paymentsProcessed: 0,
            totalRevenue: 0,
            mpesaCount: 0,
            cashCount: 0,
            mpesaPercentage: 0
        })
    })

    // Process orders (only paid ones)
    orders.filter(o => o.payment_status === 'paid').forEach(order => {
        // We need to know WHO processed the payment. 
        // Currently, `orders` table might not have `cashier_id` explicitly populated in all flows, 
        // but let's assume `staff_id` on the order is the one who closed it OR we use `cashier_id` if available.
        // For this MVP, we'll assume the `staff_id` on the order is the cashier if their role is cashier, 
        // OR we check if there's a specific field. 
        // *Correction*: The user prompt mentioned `cashier_id` in the `orders` table. Let's check if it exists in types.
        // If not, we might need to rely on `staff_id` if the user is a cashier.

        // Let's use staff_id for now, but filter by those who are actually cashiers/managers in our map.
        // In a real scenario, we'd want a dedicated `cashier_id` column on the order.

        const cashierId = (order as any).cashier_id || order.staff_id // Fallback

        if (!statsMap.has(cashierId)) return // Only count if they are in our cashier list

        const stat = statsMap.get(cashierId)!
        stat.paymentsProcessed += 1
        stat.totalRevenue += order.total || 0

        if (order.payment_method === 'm-pesa') {
            stat.mpesaCount += 1
        } else if (order.payment_method === 'cash') {
            stat.cashCount += 1
        }
    })

    // Calculate Percentages
    const cashierStats = Array.from(statsMap.values()).map(stat => ({
        ...stat,
        mpesaPercentage: stat.paymentsProcessed > 0 ? (stat.mpesaCount / stat.paymentsProcessed) * 100 : 0
    })).sort((a, b) => b.paymentsProcessed - a.paymentsProcessed)

    const topPerformer = cashierStats.length > 0 ? cashierStats[0] : null

    return (
        <div className="space-y-6">
            {/* Highlights */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Top Cashier</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{topPerformer?.staffName || "N/A"}</div>
                        <p className="text-xs text-muted-foreground">
                            {topPerformer?.paymentsProcessed} payments processed
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">M-Pesa Adoption</CardTitle>
                        <Smartphone className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {cashierStats.reduce((acc, curr) => acc + curr.mpesaCount, 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Total M-Pesa transactions
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Cash Transactions</CardTitle>
                        <Banknote className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {cashierStats.reduce((acc, curr) => acc + curr.cashCount, 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Total Cash transactions
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Cashier Performance</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Staff Name</TableHead>
                                <TableHead className="text-right">Payments</TableHead>
                                <TableHead className="text-right">Revenue Collected</TableHead>
                                <TableHead className="text-right">M-Pesa %</TableHead>
                                <TableHead className="text-right">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {cashierStats.map((stat) => (
                                <TableRow key={stat.staffId}>
                                    <TableCell className="font-medium">
                                        {stat.staffName}
                                        {stat.staffId === topPerformer?.staffId && stat.paymentsProcessed > 0 && (
                                            <Badge variant="secondary" className="ml-2 text-xs bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                                                🏆 Top
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">{stat.paymentsProcessed}</TableCell>
                                    <TableCell className="text-right">KES {stat.totalRevenue.toLocaleString()}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-blue-500" style={{ width: `${stat.mpesaPercentage}%` }} />
                                            </div>
                                            <span className="text-xs text-muted-foreground">{stat.mpesaPercentage.toFixed(0)}%</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {stat.paymentsProcessed > 0 ? (
                                            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Active</Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-muted-foreground">Inactive</Badge>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {cashierStats.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        No cashier data available for this period.
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
