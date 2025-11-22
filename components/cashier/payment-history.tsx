"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Printer, CreditCard, Banknote } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface PaymentHistoryOrder {
    id: string
    table_number: string | null
    order_type: string
    status: string
    total: number
    payment_method: string | null
    payment_details: any
    paid_at?: string
    receipt_number?: string | null
    sent_to_cashier_at: string
    order_items: Array<{
        id: string
        quantity: number
        unit_price: number
        subtotal: number
        menu_item: {
            name: string
        }
    }>
}

interface PaymentHistoryProps {
    orders: PaymentHistoryOrder[]
    onReprint: (order: PaymentHistoryOrder) => void
}

export function PaymentHistory({ orders, onReprint }: PaymentHistoryProps) {
    const formatTime = (timestamp: string) => {
        return new Date(timestamp).toLocaleTimeString('en-KE', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        })
    }

    const getPaymentIcon = (method: string | null) => {
        if (method === 'cash') return <Banknote className="h-4 w-4" />
        if (method === 'mpesa') return <CreditCard className="h-4 w-4" />
        return null
    }

    const getMpesaCode = (paymentDetails: any) => {
        if (!paymentDetails) return null
        return paymentDetails.transaction_code || paymentDetails.mpesa_transaction_code || null
    }

    if (orders.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <Printer className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg">No payment history</p>
                <p className="text-sm mt-2">Completed payments from the last 24 hours will appear here</p>
            </div>
        )
    }

    return (
        <ScrollArea className="h-[600px]">
            <div className="space-y-3">
                {orders.map((order) => {
                    const mpesaCode = getMpesaCode(order.payment_details)

                    return (
                        <Card key={order.id}>
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="font-bold text-base">
                                            {order.table_number
                                                ? (order.table_number.toLowerCase().includes('table')
                                                    ? order.table_number
                                                    : `Table ${order.table_number}`)
                                                : 'TAKEAWAY'}
                                        </h3>
                                        <p className="text-xs text-muted-foreground">
                                            {order.paid_at && formatTime(order.paid_at)}
                                            {order.receipt_number && ` • ${order.receipt_number}`}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-bold text-green-600">
                                            KES {order.total.toFixed(2)}
                                        </p>
                                    </div>
                                </div>

                                {/* Items */}
                                <div className="mb-3 space-y-1">
                                    {order.order_items.map((item) => (
                                        <div key={item.id} className="flex justify-between text-xs">
                                            <span className="text-muted-foreground">
                                                {item.quantity}× {item.menu_item.name}
                                            </span>
                                            <span>KES {item.subtotal.toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Payment Info */}
                                <div className="flex items-center justify-between pt-3 border-t">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="flex items-center gap-1">
                                            {getPaymentIcon(order.payment_method)}
                                            {order.payment_method === 'cash' ? 'Cash' : 'M-Pesa'}
                                        </Badge>
                                        {mpesaCode && (
                                            <span className="text-xs text-muted-foreground font-mono">
                                                TXN: {mpesaCode}
                                            </span>
                                        )}
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => onReprint(order)}
                                        className="flex items-center gap-1"
                                    >
                                        <Printer className="h-3 w-3" />
                                        Reprint
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </ScrollArea>
    )
}
