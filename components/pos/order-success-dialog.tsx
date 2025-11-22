"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"

interface OrderSuccessDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    orderType: 'kitchen' | 'cashier'
    orderRef?: string
    tableOrType?: string
    itemCount?: number
    total?: number
}

export function OrderSuccessDialog({
    open,
    onOpenChange,
    orderType,
    orderRef,
    tableOrType,
    itemCount,
    total
}: OrderSuccessDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex flex-col items-center gap-4 py-4">
                        <div className="rounded-full bg-emerald-100 p-3">
                            <CheckCircle2 className="h-12 w-12 text-emerald-600" />
                        </div>
                        <DialogTitle className="text-2xl text-center">
                            {orderType === 'kitchen' ? '🍳 Order Sent to Kitchen!' : '✅ Order Created!'}
                        </DialogTitle>
                    </div>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {orderRef && (
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground">Order Reference</p>
                            <p className="text-2xl font-bold font-mono">{orderRef}</p>
                        </div>
                    )}

                    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                        {tableOrType && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Location:</span>
                                <span className="font-semibold">{tableOrType}</span>
                            </div>
                        )}
                        {itemCount !== undefined && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Items:</span>
                                <span className="font-semibold">{itemCount} item{itemCount > 1 ? 's' : ''}</span>
                            </div>
                        )}
                        {total !== undefined && (
                            <div className="flex justify-between text-lg">
                                <span className="text-muted-foreground">Total:</span>
                                <span className="font-bold">KES {total.toFixed(2)}</span>
                            </div>
                        )}
                    </div>

                    <div className="text-center text-sm text-muted-foreground">
                        {orderType === 'kitchen'
                            ? 'Kitchen has been notified and will start preparing your order.'
                            : 'Order is ready for payment at the cashier counter.'}
                    </div>
                </div>

                <Button
                    onClick={() => onOpenChange(false)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                    size="lg"
                >
                    Continue
                </Button>
            </DialogContent>
        </Dialog>
    )
}
