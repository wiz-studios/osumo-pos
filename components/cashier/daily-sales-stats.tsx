"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, ShoppingCart, TrendingUp, CreditCard, Banknote } from "lucide-react"

interface DailySalesStatsProps {
    orders: Array<{
        total: number
        payment_method: string | null
    }>
}

export function DailySalesStats({ orders }: DailySalesStatsProps) {
    // Calculate metrics
    const totalSales = orders.reduce((sum, order) => sum + order.total, 0)
    const ordersProcessed = orders.length
    const avgOrderValue = ordersProcessed > 0 ? totalSales / ordersProcessed : 0

    // Payment method breakdown
    const cashOrders = orders.filter(o => o.payment_method === 'cash')
    const mpesaOrders = orders.filter(o => o.payment_method === 'mpesa')
    const cashTotal = cashOrders.reduce((sum, o) => sum + o.total, 0)
    const mpesaTotal = mpesaOrders.reduce((sum, o) => sum + o.total, 0)

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Total Sales */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        Total Sales
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">KES {totalSales.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground mt-1">Today's revenue</p>
                </CardContent>
            </Card>

            {/* Orders Processed */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4 text-blue-600" />
                        Orders Processed
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{ordersProcessed}</div>
                    <p className="text-xs text-muted-foreground mt-1">Completed today</p>
                </CardContent>
            </Card>

            {/* Avg Order Value */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-orange-600" />
                        Avg Order Value
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">KES {avgOrderValue.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground mt-1">Per order</p>
                </CardContent>
            </Card>

            {/* Payment Breakdown */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-purple-600" />
                        Payment Methods
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-1">
                                <Banknote className="h-3 w-3" />
                                Cash
                            </span>
                            <span className="font-semibold">KES {cashTotal.toFixed(0)}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-1">
                                <CreditCard className="h-3 w-3" />
                                M-Pesa
                            </span>
                            <span className="font-semibold">KES {mpesaTotal.toFixed(0)}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
