"use client"

import { useEffect, useState } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { KitchenOrderCard } from "@/components/kitchen/kitchen-order-card"
import { Clock, ChefHat } from "lucide-react"
import { useStaffRole } from "@/hooks/use-staff-role"
import { useRouter } from "next/navigation"

interface KitchenOrder {
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

export default function KitchenPage() {
  const router = useRouter()
  const { role, loading: roleLoading } = useStaffRole()
  const [orders, setOrders] = useState<KitchenOrder[]>([])
  const [currentTime, setCurrentTime] = useState(new Date())
  const [loading, setLoading] = useState(true)

  // Redirect if not kitchen staff
  useEffect(() => {
    if (!roleLoading && role !== 'kitchen') {
      router.push('/dashboard')
    }
  }, [role, roleLoading, router])

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
      const { data, error } = await supabase
        .from('orders')
        .select(`
                    id,
                    created_at,
                    table_number,
                    order_type,
                    kitchen_status,
                    sent_to_kitchen_at,
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
        .order('sent_to_kitchen_at', { ascending: true })

      if (error) throw error

      setOrders(data as KitchenOrder[])
    } catch (error) {
      console.error('Error fetching kitchen orders:', error)
    } finally {
      setLoading(false)
    }
  }

  if (roleLoading || loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <div className="text-white text-2xl">Loading Kitchen Display...</div>
      </div>
    )
  }

  if (role !== 'kitchen') {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      {/* Header */}
      <header className="mb-8 flex justify-between items-center border-b border-slate-700 pb-4">
        <div className="flex items-center gap-4">
          <ChefHat className="h-12 w-12 text-orange-500" />
          <div>
            <h1 className="text-5xl font-bold text-white">Kitchen Display</h1>
            <p className="text-xl text-slate-400 mt-1">
              {orders.length} active {orders.length === 1 ? 'order' : 'orders'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2 justify-end">
            <Clock className="h-6 w-6 text-slate-400" />
            <p className="text-5xl font-mono font-bold text-white">
              {currentTime.toLocaleTimeString('en-KE', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              })}
            </p>
          </div>
          <p className="text-lg text-slate-400 mt-1">
            {currentTime.toLocaleDateString('en-KE', {
              weekday: 'long',
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })}
          </p>
        </div>
      </header>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {orders.map(order => (
          <KitchenOrderCard
            key={order.id}
            order={order}
            onUpdate={fetchOrders}
          />
        ))}
      </div>

      {/* Empty State */}
      {orders.length === 0 && (
        <div className="text-center py-32">
          <ChefHat className="h-24 w-24 mx-auto text-slate-700 mb-4" />
          <p className="text-4xl font-bold text-slate-600">No Active Orders</p>
          <p className="text-2xl text-slate-700 mt-3">
            New orders will appear here automatically
          </p>
        </div>
      )}
    </div>
  )
}
