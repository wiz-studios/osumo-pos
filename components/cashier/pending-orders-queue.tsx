"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Clock } from "lucide-react"

interface Order {
    id: string
    table_number: string | null
    order_type: string
    total: number
    sent_to_cashier_at: string
    order_items: Array<{
        id: string
    }>
}

interface PendingOrdersQueueProps {
    orders: Order[]
    selectedOrderId: string | null
    onSelectOrder: (order: Order) => void
}

export function PendingOrdersQueue({ orders, selectedOrderId, onSelectOrder }: PendingOrdersQueueProps) {
    const getWaitTime = (timestamp: string) => {
        const now = new Date()
        const sent = new Date(timestamp)
        const diffMs = now.getTime() - sent.getTime()
        const diffMins = Math.floor(diffMs / 60000)

        if (diffMins < 1) return "Just now"
        if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`
        const hours = Math.floor(diffMins / 60)
        const mins = diffMins % 60
        return `${hours}h ${mins}m ago`
    }

    const isUrgent = (timestamp: string) => {
        const diffMs = Date.now() - new Date(timestamp).getTime()
        const diffMins = Math.floor(diffMs / 60000)
        return diffMins > 5
    }

    if (orders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <Clock className="h-12 w-12 mb-3 opacity-50" />
                <p className="text-lg">No pending orders</p>
                <p className="text-sm">Orders will appear here when sent by waiters</p>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {orders.map((order) => {
                const isSelected = selectedOrderId === order.id
                const urgent = isUrgent(order.sent_to_cashier_at)

                return (
                    <Card
                        key={order.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${isSelected
                                ? 'border-2 border-primary bg-primary/5'
                                : urgent
                                    ? 'border-orange-300 bg-orange-50'
                                    : ''
                            }`}
                        onClick={() => onSelectOrder(order)}
                    >
                        <CardContent className="p-3 sm:p-4">
                            <div className="flex justify-between items-start gap-2">
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-base sm:text-lg truncate">
                                        {order.table_number 
                                            ? (order.table_number.toLowerCase().includes('table') 
                                                ? order.table_number 
                                                : `Table ${order.table_number}`)
                                            : 'TAKEAWAY'}
                                    </h3>
                                    <p className="text-xs sm:text-sm text-muted-foreground capitalize">
                                        {order.order_type}
                                    </p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <p className="text-lg sm:text-2xl font-bold text-primary">
                                        KES {order.total.toFixed(2)}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-2 sm:mt-3 flex items-center justify-between text-xs sm:text-sm">
                                <span className="text-muted-foreground">
                                    {order.order_items.length} item{order.order_items.length !== 1 ? 's' : ''}
                                </span>
                                <div className={`flex items-center gap-1 ${urgent ? 'text-orange-600 font-semibold' : 'text-muted-foreground'}`}>
                                    <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                                    <span>{getWaitTime(order.sent_to_cashier_at)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}
