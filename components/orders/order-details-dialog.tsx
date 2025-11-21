"use client"

import { useState } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Order } from "@/lib/types"

interface OrderDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: Order
  onOrderUpdated: (order: Order) => void
}

export function OrderDetailsDialog({ open, onOpenChange, order, onOrderUpdated }: OrderDetailsDialogProps) {
  const [status, setStatus] = useState(order.status)
  const [paymentStatus, setPaymentStatus] = useState(order.payment_status)
  const [loading, setLoading] = useState(false)

  const handleUpdateOrder = async () => {
    setLoading(true)
    const supabase = getSupabaseClient()

    const { data: updatedOrder, error } = await supabase
      .from("orders")
      .update({
        status,
        payment_status: paymentStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id)
      .select()
      .single()

    if (!error && updatedOrder) {
      onOrderUpdated({
        ...order,
        ...updatedOrder,
        order_items: order.order_items,
      })
    }

    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Order Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order ID:</span>
                <span className="font-mono text-sm">{order.id.slice(0, 8)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type:</span>
                <span className="font-medium">{order.order_type}</span>
              </div>
              {order.table_number && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Table:</span>
                  <span className="font-medium">{order.table_number}</span>
                </div>
              )}
              {order.customer_name && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer:</span>
                  <span className="font-medium">{order.customer_name}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created:</span>
                <span className="text-sm">{new Date(order.created_at).toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <h3 className="font-semibold">Items</h3>
            {order.order_items?.map((item) => (
              <div key={item.id} className="flex justify-between text-sm bg-muted p-2 rounded">
                <span>
                  {item.quantity}x {item.menu_item?.name || "Item"}
                </span>
                <span className="font-medium">KES {item.subtotal.toFixed(2)}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold pt-2 border-t">
              <span>Total:</span>
              <span>KES {order.total.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Order Status</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Payment Status</label>
              <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                Close
              </Button>
              <Button onClick={handleUpdateOrder} disabled={loading} className="flex-1">
                {loading ? "Updating..." : "Update Order"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
