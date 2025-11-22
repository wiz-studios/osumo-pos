"use client"

import { useEffect, useState } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { KitchenOrderCard } from "@/components/kitchen/kitchen-order-card"
import { Clock, ChefHat, Flame, CheckCircle2, History, Plus } from "lucide-react"
import { useStaffRole } from "@/hooks/use-staff-role"
import { useRouter } from "next/navigation"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface KitchenOrder {
  id: string
  created_at: string
  table_number: string | null
  order_type: string
  kitchen_status: 'new' | 'preparing' | 'ready'
  sent_to_kitchen_at: string
  ready_at?: string
  order_items: Array<{
    id: string
    quantity: number
    notes: string | null
    menu_item: {
      name: string
    }
  }>
}

export default function KitchenPage() {
  const router = useRouter()
  const { role, loading: roleLoading } = useStaffRole()
  const [orders, setOrders] = useState<KitchenOrder[]>([])
  const [currentTime, setCurrentTime] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const [showAllHistory, setShowAllHistory] = useState(false)

  const isAdmin = role === 'manager' || role === 'admin'

  // Redirect if not kitchen staff or admin
  useEffect(() => {
    if (!roleLoading && role !== 'kitchen' && !isAdmin) {
      router.push('/dashboard')
    }
  }, [role, roleLoading, router, isAdmin])

  useEffect(() => {
    fetchOrders()

    // Real-time subscription
    const supabase = getSupabaseClient()
    const channel = supabase
      .channel('kitchen-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `status=in.(in_kitchen,pending_payment)`
        },
        () => {
          console.log('Kitchen order update detected')
          fetchOrders()
        }
      )
      .subscribe()

    // Fallback polling every 5 seconds
    const pollInterval = setInterval(fetchOrders, 5000)

    // Update clock every second
    const clockInterval = setInterval(() => setCurrentTime(new Date()), 1000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(pollInterval)
      clearInterval(clockInterval)
    }
  }, [])

  const fetchOrders = async () => {
    const supabase = getSupabaseClient()

    try {
      // Filter for orders created today (resets daily)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { data, error } = await supabase
        .from('orders')
        .select(`
                    id,
                    created_at,
                    table_number,
                    order_type,
                    kitchen_status,
                    sent_to_kitchen_at,
                    ready_at,
                    order_items (
                        id,
                        quantity,
                        notes,
                        menu_item:menu_items (
                            name
                        )
                    )
                `)
        .in('status', ['in_kitchen', 'pending_payment'])
        .gte('created_at', today.toISOString()) // Only show today's orders
        .order('sent_to_kitchen_at', { ascending: true })

      if (error) throw error

      setOrders(data as KitchenOrder[])
    } catch (error) {
      console.error('Error fetching kitchen orders:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter orders
  const newOrders = orders.filter(o => o.kitchen_status === 'new')
  const preparingOrders = orders.filter(o => o.kitchen_status === 'preparing')
  const readyOrders = orders.filter(o => {
    if (o.kitchen_status !== 'ready') return false
    if (showAllHistory) return true

    // Auto-hide if ready for more than 2 minutes
    if (!o.ready_at) return true
    const readyTime = new Date(o.ready_at).getTime()
    const now = new Date().getTime()
    return (now - readyTime) < 120000 // 2 minutes
  })

  if (roleLoading || loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0F0F1A]">
        <div className="text-slate-500 text-xl animate-pulse font-light">Loading Kitchen...</div>
      </div>
    )
  }

  if (role !== 'kitchen') {
    return null
  }

  return (
    <div className="min-h-screen bg-[#0F0F1A] text-slate-300 p-6 flex flex-col font-sans">
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-orange-500/10 rounded-lg flex items-center justify-center">
            <ChefHat className="h-6 w-6 text-orange-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Kitchen Display</h1>
            <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">
              {newOrders.length + preparingOrders.length} Active Orders
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* History Toggle */}
          {readyOrders.length > 0 && (
            <div className="flex items-center space-x-2">
              <Switch
                id="history-mode"
                checked={showAllHistory}
                onCheckedChange={setShowAllHistory}
                className="data-[state=checked]:bg-slate-700"
              />
              <Label htmlFor="history-mode" className="text-xs text-slate-500 cursor-pointer font-medium">
                Show History
              </Label>
            </div>
          )}

          {/* Clock */}
          <div className="text-right border-l border-slate-800 pl-6">
            <div className="text-3xl font-bold text-white leading-none tracking-tight">
              {currentTime.toLocaleTimeString('en-KE', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              })}
            </div>
          </div>
        </div>
      </header>

      {/* 3-Column Grid */}
      <div className="flex-1 grid grid-cols-3 gap-6 min-h-0">

        {/* Column 1: NEW ORDERS */}
        <div className="flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-yellow-500/50">
            <div className="flex items-center gap-2 text-yellow-500 font-bold text-sm uppercase tracking-wider">
              <Clock className="h-4 w-4" />
              New Orders
            </div>
            <span className="bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded-full text-xs font-bold">
              {newOrders.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-800">
            {newOrders.map(order => (
              <KitchenOrderCard key={order.id} order={order} onUpdate={fetchOrders} />
            ))}
            {newOrders.length === 0 && (
              <div className="mt-10 flex flex-col items-center justify-center text-slate-700">
                <Plus className="h-8 w-8 mb-2 opacity-20" />
                <p className="text-sm font-medium">New orders will appear here</p>
              </div>
            )}
          </div>
        </div>

        {/* Column 2: PREPARING */}
        <div className="flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-blue-500/50">
            <div className="flex items-center gap-2 text-blue-500 font-bold text-sm uppercase tracking-wider">
              <Flame className="h-4 w-4" />
              Preparing
            </div>
            <span className="bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full text-xs font-bold">
              {preparingOrders.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-800">
            {preparingOrders.map(order => (
              <KitchenOrderCard key={order.id} order={order} onUpdate={fetchOrders} />
            ))}
            {preparingOrders.length === 0 && (
              <div className="mt-10 flex flex-col items-center justify-center text-slate-700">
                <Flame className="h-8 w-8 mb-2 opacity-20" />
                <p className="text-sm font-medium">Nothing cooking</p>
              </div>
            )}
          </div>
        </div>

        {/* Column 3: DONE */}
        <div className="flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-green-500/50">
            <div className="flex items-center gap-2 text-green-500 font-bold text-sm uppercase tracking-wider">
              <CheckCircle2 className="h-4 w-4" />
              Done
            </div>
            <span className="bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full text-xs font-bold">
              {readyOrders.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-800">
            {readyOrders.map(order => (
              <KitchenOrderCard key={order.id} order={order} onUpdate={fetchOrders} />
            ))}
            {readyOrders.length === 0 && (
              <div className="mt-10 flex flex-col items-center justify-center text-slate-700">
                <CheckCircle2 className="h-8 w-8 mb-2 opacity-20" />
                <p className="text-sm font-medium">All clear</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
