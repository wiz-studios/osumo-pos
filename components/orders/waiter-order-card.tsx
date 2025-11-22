"use client"

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Flame, AlertTriangle } from "lucide-react"
import { useState } from "react"

interface WaiterOrderCardProps {
    order: {
        id: string
        staff_id?: string
        staff?: {
            id: string
            first_name: string | null
            last_name: string | null
        } | null
        table_number: string | null
        order_type: string
        status: string
        kitchen_status: 'new' | 'preparing' | 'ready'
        sent_to_kitchen_at: string
        ready_at: string | null
        total: number
        order_items: Array<{
            id: string
            quantity: number
            menu_item: {
                name: string
            }
        }>
    }
    onSendToCashier: (orderId: string) => void
}

export function WaiterOrderCard({ order, onSendToCashier }: WaiterOrderCardProps) {
    const [sending, setSending] = useState(false)

    const getStatusLabel = () => {
        if (order.status === 'pending_payment') return 'At Cashier'
        if (order.kitchen_status === 'ready') return 'Ready for Bill'
        if (order.kitchen_status === 'preparing') return 'Cooking'
        return 'New'
    }

    const getStatusColor = () => {
        if (order.status === 'pending_payment') return 'bg-orange-100 text-orange-700 border-orange-300'
        if (order.kitchen_status === 'ready') return 'bg-green-100 text-green-700 border-green-300'
        if (order.kitchen_status === 'preparing') return 'bg-blue-100 text-blue-700 border-blue-300'
        return 'bg-yellow-100 text-yellow-700 border-yellow-300'
    }

    const getReadyDuration = () => {
        if (!order.ready_at) return null
        const mins = Math.floor((Date.now() - new Date(order.ready_at).getTime()) / 60000)
        return mins
    }

    const getUrgencyLevel = (mins: number) => {
        if (mins < 5) return { color: 'text-green-600', icon: null, label: `Ready for ${mins} min${mins !== 1 ? 's' : ''}` }
        if (mins < 10) return { color: 'text-yellow-600', icon: Flame, label: `Ready for ${mins} mins` }
        return { color: 'text-red-600', icon: AlertTriangle, label: `Ready for ${mins} mins (URGENT!)` }
    }

    const formatTime = (timestamp: string) => {
        return new Date(timestamp).toLocaleTimeString('en-KE', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        })
    }

    const handleSend = async () => {
        setSending(true)
        try {
            await onSendToCashier(order.id)
        } finally {
            setSending(false)
        }
    }

    const readyMins = getReadyDuration()
    const urgency = readyMins !== null ? getUrgencyLevel(readyMins) : null

    return (
        <Card className={`${urgency && readyMins && readyMins >= 10 ? 'border-2 border-red-500' : ''}`}>
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-xl font-bold">
                            {order.table_number ? `Table ${order.table_number}` : 'TAKEAWAY'}
                        </h3>
                        <p className="text-sm text-muted-foreground capitalize">
                            {order.order_type}
                        </p>
                        {order.staff && (
                            <p className="text-xs text-muted-foreground mt-1">
                                Waiter: {order.staff.first_name || ''} {order.staff.last_name || ''}
                            </p>
                        )}
                    </div>
                    <Badge className={`${getStatusColor()} border`}>
                        {getStatusLabel()}
                        {order.kitchen_status === 'ready' && ' ✓'}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="space-y-3">
                {/* Items */}
                <div className="space-y-1">
                    {order.order_items.slice(0, 3).map((item) => (
                        <div key={item.id} className="text-sm">
                            <span className="font-semibold">{item.quantity}×</span>{' '}
                            {item.menu_item?.name || 'Unknown Item'}
                        </div>
                    ))}
                    {order.order_items.length > 3 && (
                        <p className="text-xs text-muted-foreground">
                            +{order.order_items.length - 3} more item{order.order_items.length - 3 !== 1 ? 's' : ''}
                        </p>
                    )}
                </div>

                {/* Time Info */}
                <div className="pt-2 border-t space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Sent: {formatTime(order.sent_to_kitchen_at)}</span>
                    </div>

                    {urgency && (
                        <div className={`flex items-center gap-2 text-sm font-semibold ${urgency.color}`}>
                            {urgency.icon && <urgency.icon className="h-4 w-4" />}
                            <span>{urgency.label}</span>
                        </div>
                    )}
                </div>

                {/* Total */}
                <div className="pt-2 border-t">
                    <p className="text-lg font-bold">KES {order.total.toFixed(2)}</p>
                </div>
            </CardContent>

            <CardFooter>
                {order.status === 'in_kitchen' && order.kitchen_status === 'ready' ? (
                    <Button
                        className="w-full bg-green-600 hover:bg-green-700"
                        onClick={handleSend}
                        disabled={sending}
                    >
                        {sending ? 'Sending...' : 'Send to Cashier'}
                    </Button>
                ) : order.status === 'pending_payment' ? (
                    <div className="w-full text-center text-sm text-muted-foreground py-2">
                        Waiting for cashier...
                    </div>
                ) : (
                    <Button
                        className="w-full"
                        disabled
                        variant="outline"
                        title="Kitchen hasn't marked this ready yet"
                    >
                        Send to Cashier
                    </Button>
                )}
            </CardFooter>
        </Card>
    )
}
