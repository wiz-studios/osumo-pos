"use client"

import { useEffect, useState } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js"
import { WaiterOrderCard } from "@/components/orders/waiter-order-card"
import { useStaffRole } from "@/hooks/use-staff-role"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ClipboardList } from "lucide-react"

interface OrderWithItems {
  id: string
  table_number: string | null
  order_type: string
  status: string
  kitchen_status: 'new' | 'preparing' | 'ready'
  sent_to_kitchen_at: string
  ready_at: string | null
  total: number
  created_at: string
  order_items: Array<{
    id: string
    quantity: number
    menu_item: {
      name: string
    }
  }>
}

export default function OrdersPage() {
  const { role, staffId, loading: roleLoading } = useStaffRole()
  const { toast } = useToast()
  const [orders, setOrders] = useState<OrderWithItems[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'cooking' | 'ready' | 'at_cashier'>('all')

  useEffect(() => {
    if (!roleLoading && role !== 'waiter') {
      // Non-waiters see a different view or get redirected
      return
    }

    if (staffId) {
      fetchOrders()
      setupRealtime()
    }
  }, [staffId, roleLoading, role])

  const fetchOrders = async () => {
    const supabase = getSupabaseClient()

    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
                    id,
                    table_number,
                    order_type,
                    status,
                    kitchen_status,
                    sent_to_kitchen_at,
                    ready_at,
                    total,
                    created_at,
                    order_items (
                        id,
                        quantity,
                        menu_item:menu_items (
                            name
                        )
                    )
                `)
        .in('status', ['in_kitchen', 'pending_payment'])
        .order('sent_to_kitchen_at', { ascending: false })

      if (error) throw error

      setOrders(data as OrderWithItems[])
    } catch (error: any) {
      console.error('Error fetching orders:', error)
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const setupRealtime = () => {
    const supabase = getSupabaseClient()

    const channel = supabase
      .channel('active-orders')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: 'status=in.(in_kitchen,pending_payment)'
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          // Optimistic update
          setOrders(prev => {
            const exists = prev.find(o => o.id === payload.new.id)
            if (exists) {
              // Update existing order
              return prev.map(o =>
                o.id === payload.new.id ? { ...o, ...payload.new } : o
              )
            } else if (payload.new.status === 'in_kitchen') {
              // New order appeared, refetch to get full data
              fetchOrders()
              return prev
            } else {
              // Order moved to different status, remove from view
              return prev.filter(o => o.id !== payload.new.id)
            }
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const handleSendToCashier = async (orderId: string) => {
    const supabase = getSupabaseClient()

    try {
      // Update order status
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'pending_payment',
          sent_to_cashier_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .eq('kitchen_status', 'ready')  // DB-level validation
        .eq('status', 'in_kitchen')     // Prevent double-send

      if (updateError) throw updateError

      // Log event
      const { error: eventError } = await supabase
        .from('order_events')
        .insert({
          order_id: orderId,
          from_status: 'in_kitchen',
          to_status: 'pending_payment',
          triggered_by: staffId,
          event_type: 'status_change',
          metadata: {
            action: 'sent_to_cashier',
            timestamp: new Date().toISOString()
          }
        })

      if (eventError) console.error('Event logging error:', eventError)

      toast({
        title: "Sent to Cashier",
        description: "Order is now in cashier queue"
      })

      // Optimistic UI update
      setOrders(prev => prev.filter(o => o.id !== orderId))

    } catch (error: any) {
      console.error('Error sending to cashier:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to send order",
        variant: "destructive"
      })
    }
  }

  const getFilteredOrders = () => {
    switch (filter) {
      case 'cooking':
        return orders.filter(o => o.status === 'in_kitchen' && o.kitchen_status !== 'ready')
      case 'ready':
        return orders.filter(o => o.status === 'in_kitchen' && o.kitchen_status === 'ready')
      case 'at_cashier':
        return orders.filter(o => o.status === 'pending_payment')
      default:
        return orders
    }
  }

  if (roleLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading orders...</div>
      </div>
    )
  }

  if (role !== 'waiter') {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">This page is only accessible to waiters.</p>
      </div>
    )
  }

  const filteredOrders = getFilteredOrders()

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <ClipboardList className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Active Orders</h1>
          <p className="text-muted-foreground">
            {orders.length} active {orders.length === 1 ? 'order' : 'orders'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
        <TabsList>
          <TabsTrigger value="all">
            All ({orders.length})
          </TabsTrigger>
          <TabsTrigger value="cooking">
            Cooking ({orders.filter(o => o.status === 'in_kitchen' && o.kitchen_status !== 'ready').length})
          </TabsTrigger>
          <TabsTrigger value="ready">
            Ready for Bill ({orders.filter(o => o.status === 'in_kitchen' && o.kitchen_status === 'ready').length})
          </TabsTrigger>
          <TabsTrigger value="at_cashier">
            At Cashier ({orders.filter(o => o.status === 'pending_payment').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-6">
          {filteredOrders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOrders.map(order => (
                <WaiterOrderCard
                  key={order.id}
                  order={order}
                  onSendToCashier={handleSendToCashier}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg">No orders in this category</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
