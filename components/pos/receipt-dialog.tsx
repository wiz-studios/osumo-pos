"use client"

import { Dialog, DialogContent, DialogFooter, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle, Printer } from "lucide-react"
import type { Order, OrderItem } from "@/lib/types"

interface ReceiptDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    order: Order | null
    items: OrderItem[]
    onClose: () => void
}

export function ReceiptDialog({
    open,
    onOpenChange,
    order,
    items,
    onClose,
}: ReceiptDialogProps) {
    if (!order) return null

    const handlePrint = () => {
        window.print()
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-sm">
                <DialogTitle className="sr-only">Payment Receipt</DialogTitle>
                <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
                    <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                        <CheckCircle className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold">Payment Successful</h2>
                        <p className="text-sm text-muted-foreground">
                            Order #{order.id.slice(0, 8)} has been paid.
                        </p>
                    </div>

                    {/* Receipt Preview */}
                    <div className="w-full bg-muted/30 p-4 rounded-md text-left font-mono text-xs space-y-2 border border-dashed">
                        <div className="text-center border-b pb-2 mb-2">
                            <p className="font-bold text-sm">OSUMO RESTAURANT</p>
                            <p>KRA PIN: P05123456789Z</p>
                            <p>{new Date(order.created_at).toLocaleString()}</p>
                        </div>

                        <div className="space-y-1">
                            {items.map((item) => (
                                <div key={item.id} className="flex justify-between">
                                    <span>{item.quantity}x {item.menu_item?.name || "Item"}</span>
                                    <span>{item.subtotal.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>

                        <div className="border-t pt-2 space-y-1">
                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span>{(order.total + (order.discount || 0)).toFixed(2)}</span>
                            </div>
                            {order.discount ? (
                                <div className="flex justify-between text-red-500">
                                    <span>Discount</span>
                                    <span>-{order.discount.toFixed(2)}</span>
                                </div>
                            ) : null}
                            <div className="flex justify-between font-bold text-sm pt-1 border-t border-dashed">
                                <span>TOTAL</span>
                                <span>{order.total.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Age Verification Warning */}
                        {items.some(i => i.menu_item?.requires_id) && (
                            <div className="border-t pt-2 text-center text-[10px] font-bold uppercase">
                                ❗ Age-restricted item(s) — ID verified
                            </div>
                        )}

                        <div className="border-t pt-2 text-center">
                            <p>Paid via {order.payment_method?.toUpperCase()}</p>
                            <p className="mt-2">Thank you! Karibu tena!</p>
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button variant="outline" className="w-full sm:w-auto" onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" />
                        Print Receipt
                    </Button>
                    <Button className="w-full sm:w-1/2" onClick={onClose}>
                        Done
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
