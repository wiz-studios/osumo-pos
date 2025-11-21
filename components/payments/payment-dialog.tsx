"use client"

import { useState } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Order, Payment } from "@/lib/types"
import { Receipt } from "lucide-react"

interface PaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: Order
  onPaymentComplete: (order: Order) => void
}

export function PaymentDialog({ open, onOpenChange, order, onPaymentComplete }: PaymentDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "m-pesa" | "airtel">("cash")
  const [amount, setAmount] = useState(order.total.toString())
  const [reference, setReference] = useState("")
  const [loading, setLoading] = useState(false)
  const [payments, setPayments] = useState<Payment[]>([])
  const [showPrintReceipt, setShowPrintReceipt] = useState(false)

  const remainingBalance = order.total - (payments.reduce((sum, p) => sum + p.amount, 0) || 0)
  const amountValue = Number.parseFloat(amount) || 0

  const handleAddPayment = async () => {
    if (amountValue <= 0 || amountValue > remainingBalance) {
      return
    }

    setLoading(true)
    const supabase = getSupabaseClient()

    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        order_id: order.id,
        amount: amountValue,
        payment_method: paymentMethod,
        reference: reference || null,
        status: "completed",
      })
      .select()
      .single()

    if (paymentError) {
      setLoading(false)
      return
    }

    setPayments([...payments, payment])

    // Calculate new payment status
    const totalPaid = (payments.reduce((sum, p) => sum + p.amount, 0) || 0) + amountValue
    const newPaymentStatus = totalPaid >= order.total ? "paid" : totalPaid > 0 ? "partial" : "unpaid"

    // Update order
    const { data: updatedOrder, error: updateError } = await supabase
      .from("orders")
      .update({
        payment_status: newPaymentStatus,
        payment_method: paymentMethod,
        status: newPaymentStatus === "paid" ? "paid" : order.status,
      })
      .eq("id", order.id)
      .select()
      .single()

    if (!updateError && updatedOrder) {
      onPaymentComplete({
        ...order,
        ...updatedOrder,
        order_items: order.order_items,
      })
      setAmount("")
      setReference("")
      setShowPrintReceipt(true)
    }

    setLoading(false)
  }

  const handlePrint = () => {
    window.print()
  }

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Process Payment</DialogTitle>
        </DialogHeader>

        {showPrintReceipt ? (
          <div className="space-y-4">
            <Receipt className="mx-auto text-green-600" size={48} />
            <h3 className="text-center font-bold text-lg">Payment Successful!</h3>
            <Card>
              <CardContent className="pt-6 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Order Amount:</span>
                  <span>KES {order.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Paid:</span>
                  <span className="font-bold">KES {totalPaid.toFixed(2)}</span>
                </div>
                {totalPaid < order.total && (
                  <div className="flex justify-between text-orange-600">
                    <span>Outstanding Balance:</span>
                    <span>{(order.total - totalPaid).toFixed(2)}</span>
                  </div>
                )}
              </CardContent>
            </Card>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handlePrint} className="flex-1 bg-transparent">
                Print Receipt
              </Button>
              <Button
                onClick={() => {
                  onOpenChange(false)
                  setShowPrintReceipt(false)
                  setPayments([])
                }}
                className="flex-1"
              >
                Done
              </Button>
            </div>
          </div>
        ) : (
          <Tabs defaultValue="payment" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="payment">Add Payment</TabsTrigger>
              <TabsTrigger value="history">Payment History</TabsTrigger>
            </TabsList>

            <TabsContent value="payment" className="space-y-4">
              <Card>
                <CardContent className="pt-6 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Order Total</Label>
                      <p className="text-2xl font-bold">KES {order.total.toFixed(2)}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Paid</Label>
                      <p className="text-2xl font-bold text-green-600">KES {totalPaid.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="bg-red-50 border border-red-200 p-3 rounded">
                    <Label className="text-muted-foreground">Balance Outstanding</Label>
                    <p className="text-3xl font-bold text-red-600">KES {remainingBalance.toFixed(2)}</p>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="method">Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="m-pesa">M-Pesa</SelectItem>
                      <SelectItem value="airtel">Airtel Money</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="amount">Amount (KES)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    step="0.01"
                    max={remainingBalance}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Max: KES {remainingBalance.toFixed(2)}</p>
                </div>

                {(paymentMethod === "m-pesa" || paymentMethod === "airtel") && (
                  <div>
                    <Label htmlFor="reference">Reference Number</Label>
                    <Input
                      id="reference"
                      placeholder="e.g., 12345678"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                    />
                  </div>
                )}

                <Button
                  onClick={handleAddPayment}
                  disabled={loading || amountValue <= 0 || amountValue > remainingBalance}
                  className="w-full"
                >
                  {loading ? "Processing..." : "Add Payment"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              {payments.length > 0 ? (
                <div className="space-y-3">
                  {payments.map((payment) => (
                    <Card key={payment.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-semibold">{payment.payment_method.toUpperCase()}</p>
                            {payment.reference && (
                              <p className="text-sm text-muted-foreground">Ref: {payment.reference}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {new Date(payment.created_at).toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold">KES {payment.amount.toFixed(2)}</p>
                            <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">
                              {payment.status}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No payments recorded yet</p>
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
}
