"use client"

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getSupabaseClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Clock, ChefHat, CheckCircle2 } from "lucide-react"
import { useState } from "react"

interface KitchenOrderCardProps {
    order: {
        id: string
        created_at: string
        table_number: string | null
        order_type: string
        kitchen_status: 'new' | 'preparing' | 'ready'
        sent_to_kitchen_at: string
        order_items: Array<{
            id: string
            quantity: number
            notes: string | null
            menu_item: {
                name: string
            }
        }>
    }
    onUpdate: () => void
}

export function KitchenOrderCard({ order, onUpdate }: KitchenOrderCardProps) {
    const { toast } = useToast()
    const [updating, setUpdating] = useState(false)

    const statusColors = {
        new: "bg-yellow-500 border-yellow-600 text-slate-900",
        preparing: "bg-green-500 border-green-600 text-white",
        ready: "bg-white border-slate-300 text-slate-900"
    }

    const updateStatus = async (newStatus: 'preparing' | 'ready') => {
        setUpdating(true)
        const supabase = getSupabaseClient()

        try {
            const updateData: any = { kitchen_status: newStatus }

            // Set ready_at timestamp when marking as ready
            if (newStatus === 'ready') {
                updateData.ready_at = new Date().toISOString()

                // If dine-in, send to cashier for payment
                if (order.order_type === 'dine-in') {
                    updateData.status = 'pending_payment'
                    updateData.sent_to_cashier_at = new Date().toISOString()
                }
            }

            const { error } = await supabase
                .from("orders")
                .update(updateData)
                .eq("id", order.id)

            if (error) throw error

            toast({
                title: "Status Updated",
                description: `Order marked as ${newStatus}`,
            })

            onUpdate()
        } catch (error: any) {
            console.error('Error updating kitchen status:', error)
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            })
        } finally {
            setUpdating(false)
        }
    }

    const formatTime = (timestamp: string) => {
        return new Date(timestamp).toLocaleTimeString('en-KE', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        })
    }

    const getTimeElapsed = (timestamp: string) => {
        const now = new Date()
        const sent = new Date(timestamp)
        const diffMs = now.getTime() - sent.getTime()
        const diffMins = Math.floor(diffMs / 60000)

        if (diffMins < 1) return "Just now"
        if (diffMins < 60) return `${diffMins}m ago`
        const hours = Math.floor(diffMins / 60)
        const mins = diffMins % 60
        return `${hours}h ${mins}m ago`
    }

    return (
        <Card className={`${statusColors[order.kitchen_status]} border-4 shadow-lg`}>
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-4xl font-bold">
                            {order.table_number || 'TAKEAWAY'}
                        </h2>
                        <div className="flex items-center gap-2 mt-2 text-lg opacity-80">
                            <Clock className="h-5 w-5" />
                            <span className="font-mono">{formatTime(order.sent_to_kitchen_at)}</span>
                            <span className="text-sm">({getTimeElapsed(order.sent_to_kitchen_at)})</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-sm font-semibold uppercase px-3 py-1 rounded-full bg-black/20">
                            {order.kitchen_status}
                        </span>
                        <div className="text-xs mt-1 opacity-70">
                            {order.order_items.length} {order.order_items.length === 1 ? 'item' : 'items'}
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="pb-4">
                <ul className="space-y-4">
                    {order.order_items.map((item) => (
                        <li key={item.id} className="text-2xl leading-tight">
                            <div className="font-bold flex items-baseline gap-2">
                                <span className="text-3xl">{item.quantity}×</span>
                                <span>{item.menu_item?.name || 'Unknown Item'}</span>
                            </div>
                            {item.notes && (
                                <div className="text-lg opacity-75 ml-10 mt-1 italic border-l-2 border-current pl-3">
                                    → {item.notes}
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            </CardContent>

            <CardFooter className="gap-3 pt-4 border-t-2 border-current/20">
                {order.kitchen_status === 'new' && (
                    <Button
                        size="lg"
                        className="flex-1 text-xl h-16 bg-green-600 hover:bg-green-700 text-white font-bold"
                        onClick={() => updateStatus('preparing')}
                        disabled={updating}
                    >
                        <ChefHat className="h-6 w-6 mr-2" />
                        {updating ? "Updating..." : "Start Cooking"}
                    </Button>
                )}
                {order.kitchen_status === 'preparing' && (
                    <Button
                        size="lg"
                        className="flex-1 text-xl h-16 bg-blue-600 hover:bg-blue-700 text-white font-bold"
                        onClick={() => updateStatus('ready')}
                        disabled={updating}
                    >
                        <CheckCircle2 className="h-6 w-6 mr-2" />
                        {updating ? "Updating..." : "Mark Ready ✓"}
                    </Button>
                )}
                {order.kitchen_status === 'ready' && (
                    <div className="flex-1 text-center text-xl font-bold opacity-60 py-4">
                        <CheckCircle2 className="h-8 w-8 mx-auto mb-2" />
                        READY FOR PICKUP
                    </div>
                )}
            </CardFooter>
        </Card>
    )
}
