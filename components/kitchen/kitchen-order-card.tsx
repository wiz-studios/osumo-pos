"use client"

import { Button } from "@/components/ui/button"
import { getSupabaseClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Clock, Play, Check, AlertTriangle, Flame } from "lucide-react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

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
    const [elapsedMinutes, setElapsedMinutes] = useState(0)

    // Calculate elapsed time every minute
    useEffect(() => {
        const calculateTime = () => {
            const sentTime = new Date(order.sent_to_kitchen_at).getTime()
            const now = new Date().getTime()
            const diff = Math.floor((now - sentTime) / 60000)
            setElapsedMinutes(diff)
        }

        calculateTime()
        const interval = setInterval(calculateTime, 60000) // Update every minute

        return () => clearInterval(interval)
    }, [order.sent_to_kitchen_at])

    // Determine urgency color and icon
    const getUrgency = () => {
        if (order.kitchen_status === 'ready') return { color: "text-slate-500", icon: Check }
        if (elapsedMinutes < 5) return { color: "text-green-400", icon: Clock }
        if (elapsedMinutes < 10) return { color: "text-yellow-400", icon: Clock }
        return { color: "text-red-500 animate-pulse", icon: Flame }
    }

    const { color: urgencyColor, icon: UrgencyIcon } = getUrgency()

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

    // Format Table Name
    const tableName = order.order_type === 'takeaway'
        ? `Takeaway #${order.table_number || '?'}`
        : (String(order.table_number).toLowerCase().startsWith('table')
            ? order.table_number
            : `Table ${order.table_number}`)

    return (
        <div className="group flex flex-col p-3 bg-[#1A1A2E] border-l-4 border-l-transparent hover:border-l-blue-500 rounded-r-lg transition-all duration-200 mb-2 last:mb-0 hover:bg-[#222236]">
            <div className="flex items-start justify-between gap-3">
                {/* Left: Table Info */}
                <div className="min-w-[80px]">
                    <h3 className="text-white font-bold text-sm leading-tight">{tableName}</h3>
                    <span className="text-xs text-slate-500 font-mono mt-1 block">
                        #{order.id.slice(0, 4)}
                    </span>
                </div>

                {/* Middle: Items List */}
                <div className="flex-1">
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                        {order.order_items.map((item) => (
                            <div key={item.id} className="flex items-baseline gap-1 text-sm">
                                <span className="font-bold text-orange-400">{item.quantity}x</span>
                                <span className="text-slate-300">{item.menu_item.name}</span>
                                {item.notes && (
                                    <span className="text-xs text-yellow-500/80 italic">({item.notes})</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Time & Action */}
                <div className="flex items-center gap-3 min-w-[100px] justify-end">
                    {/* Time */}
                    <div className={cn("flex items-center gap-1.5 text-xs font-medium", urgencyColor)}>
                        <UrgencyIcon className="h-3.5 w-3.5" />
                        <span>{elapsedMinutes}m</span>
                    </div>

                    {/* Action Button */}
                    {order.kitchen_status === 'new' && (
                        <Button
                            size="icon"
                            className="h-9 w-9 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20"
                            onClick={() => updateStatus('preparing')}
                            disabled={updating}
                        >
                            <Play className="h-4 w-4 fill-current" />
                        </Button>
                    )}
                    {order.kitchen_status === 'preparing' && (
                        <Button
                            size="icon"
                            className="h-9 w-9 rounded-full bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/20"
                            onClick={() => updateStatus('ready')}
                            disabled={updating}
                        >
                            <Check className="h-5 w-5" strokeWidth={3} />
                        </Button>
                    )}
                    {order.kitchen_status === 'ready' && (
                        <div className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center">
                            <Check className="h-5 w-5 text-slate-600" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
