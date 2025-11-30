"use client"

import { useEffect, useState } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js"
import { WaiterOrderCard } from "@/components/orders/waiter-order-card"
import { WaiterPerformanceStats } from "@/components/orders/waiter-performance-stats"
import { VoidOrderDialog } from "@/components/orders/void-order-dialog"
import { useStaffRole } from "@/hooks/use-staff-role"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ClipboardList, History } from "lucide-react"
import { logOrderVoid } from "@/lib/activity-logger"

interface OrderWithItems {
  id: string
  staff_id: string
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
  created_at: string
  order_items: Array<{
    id: string
    quantity: number
    menu_item: {
      name: string
    }
  }>
}

/**
 * OrdersPage Component
 * 
 * Displays active orders for waiters and admins.
 * Allows waiters to track their orders' status (Cooking, Ready, etc.).
 * Supports real-time updates when kitchen status changes.
 * Admins can view all orders and history.
 */
export default function OrdersPage() {
  const { role, staffId, loading: roleLoading } = useStaffRole()
  const { toast } = useToast()
  const [orders, setOrders] = useState<OrderWithItems[]>([])
  const [historyOrders, setHistoryOrders] = useState<OrderWithItems[]>([])
  const [loading, setLoading] = useState(true)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'cooking' | 'ready' | 'at_cashier'>('all')
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active')

  // Void Dialog State
  const [voidDialogOpen, setVoidDialogOpen] = useState(false)
  const [orderToVoid, setOrderToVoid] = useState<OrderWithItems | null>(null)
  const [voiding, setVoiding] = useState(false)

  const isAdmin = role === 'manager' || role === 'admin'

  useEffect(() => {
    if (!roleLoading && role !== 'waiter' && !isAdmin) {
      // Non-waiters/admins see a different view or get redirected
      return
    }

    if (staffId || isAdmin) {
      fetchOrders()
      setupRealtime()
    }
  }, [staffId, roleLoading, role, isAdmin])

  const fetchOrders = async () => {
    const supabase = getSupabaseClient()

    try {
      let query = supabase
        .from('orders')
        .select(`
                    id,
                    staff_id,
                    staff:staff!staff_id (
                        id,
                        first_name,
                        last_name
                    ),
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

      // Filter by staff_id only for waiters (not admins)
      if (role === 'waiter' && staffId && !isAdmin) {
        query = query.eq('staff_id', staffId)
      }

      const { data, error } = await query

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

  const fetchOrderHistory = async () => {
    if (!isAdmin) return // Only admins can view history

    setHistoryLoading(true)
    const supabase = getSupabaseClient()

    try {
      // Get orders from last 7 days
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const { data, error } = await supabase
        .from('orders')
        .select(`
                    id,
                    staff_id,
                    staff:staff!staff_id (
                        id,
                        first_name,
                        last_name
                    ),
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
        .in('status', ['paid', 'cancelled', 'completed'])
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      setHistoryOrders(data as OrderWithItems[])
    } catch (error: any) {
      console.error('Error fetching order history:', error)
      toast({
        title: "Error",
        description: "Failed to load order history",
        variant: "destructive"
      })
    } finally {
      setHistoryLoading(false)
    }
  }

  /**
   * Subscribes to real-time changes in the 'orders' table.
   * Updates the UI instantly when an order's status changes (e.g., when kitchen marks as ready).
   */
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

  /**
   * Moves a ready order to the cashier queue for payment.
   */
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

  const handleVoidClick = (orderId: string) => {
    const order = orders.find(o => o.id === orderId)
    if (order) {
      setOrderToVoid(order)
      setVoidDialogOpen(true)
    }
  }

  const confirmVoid = async (reason: string) => {
    if (!orderToVoid || !staffId) return

    setVoiding(true)
    const supabase = getSupabaseClient()

    try {
      // 1. Update order status
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'cancelled',
          // We might want to track who cancelled it and why in the order itself too, 
          // but activity log is the primary place for this now.
        })
        .eq('id', orderToVoid.id)

      if (updateError) throw updateError

      // 2. Log activity
      await logOrderVoid({
        orderId: orderToVoid.id,
        reason: reason,
        orderTotal: orderToVoid.total,
        staffId: staffId,
        // We don't have restaurantId readily available in state here without fetching, 
        // but logActivity handles looking it up if missing, or we could fetch it.
        // For now, let's rely on the backend lookup or add it to state if needed.
      })

      // 3. Log event (legacy/redundant but good for consistency)
      await supabase.from('order_events').insert({
        order_id: orderToVoid.id,
        from_status: orderToVoid.status,
        to_status: 'cancelled',
        triggered_by: staffId,
        event_type: 'cancellation',
        metadata: {
          reason: reason,
          timestamp: new Date().toISOString()
        }
      })

      toast({
        title: "Order Voided",
        description: "Order has been cancelled successfully"
      })

      // 4. Optimistic Update
      setOrders(prev => prev.filter(o => o.id !== orderToVoid.id))
      setVoidDialogOpen(false)
      setOrderToVoid(null)

    } catch (error: any) {
      console.error('Error voiding order:', error)
      toast({
        title: "Error",
        description: "Failed to void order",
        variant: "destructive"
      })
    } finally {
      setVoiding(false)
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

  if (role !== 'waiter' && !isAdmin) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">This page is only accessible to waiters and admins.</p>
      </div>
    )
  }

  const filteredOrders = getFilteredOrders()

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <ClipboardList className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            {isAdmin ? 'Order Management' : 'Active Orders'}
          </h1>
          <p className="text-muted-foreground">
            {orders.length} active {orders.length === 1 ? 'order' : 'orders'}
          </p>
        </div>
      </div>

      {/* Admin Performance Stats */}
      {isAdmin && (
        <WaiterPerformanceStats orders={orders} />
      )}

      {/* Main Tabs - Active vs History */}
      <Tabs value={activeTab} onValueChange={(v) => {
        setActiveTab(v as 'active' | 'history')
        if (v === 'history' && historyOrders.length === 0) {
          fetchOrderHistory()
        }
      }}>
        <TabsList>
          <TabsTrigger value="active" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Active Orders
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Order History
            </TabsTrigger>
          )}
        </TabsList>

        {/* Active Orders Tab */}
        <TabsContent value="active" className="space-y-4">
          {/* Status Filters */}
          <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <TabsList className="w-full justify-start overflow-x-auto h-auto p-1">
              <TabsTrigger value="all">
                All ({orders.length})
              </TabsTrigger>
              <TabsTrigger value="cooking">
                Cooking ({orders.filter(o => o.status === 'in_kitchen' && o.kitchen_status !== 'ready').length})
              </TabsTrigger>
              <TabsTrigger value="ready">
                Ready ({orders.filter(o => o.status === 'in_kitchen' && o.kitchen_status === 'ready').length})
              </TabsTrigger>
              <TabsTrigger value="at_cashier">
                Cashier ({orders.filter(o => o.status === 'pending_payment').length})
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
                      onVoid={handleVoidClick}
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
        </TabsContent>

        {/* Order History Tab (Admin Only) */}
        <TabsContent value="history" className="mt-6">
          {historyLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-lg">Loading history...</div>
            </div>
          ) : historyOrders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {historyOrders.map(order => (
                <WaiterOrderCard
                  key={order.id}
                  order={order}
                  onSendToCashier={() => { }} // No action for historical orders
                  onVoid={() => { }} // No voiding historical orders
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg">No order history found</p>
              <p className="text-sm mt-2">Showing orders from the last 7 days</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Void Order Dialog */}
      <VoidOrderDialog
        open={voidDialogOpen}
        onOpenChange={setVoidDialogOpen}
        onConfirm={confirmVoid}
        processing={voiding}
        orderId={orderToVoid?.id || ''}
        orderNumber={orderToVoid?.id.slice(0, 8)} // Simple order number for now
      />
    </div>
  )
}
