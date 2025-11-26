"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AlertTriangle } from "lucide-react"

interface VoidOrderDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: (reason: string) => void
    processing: boolean
    orderId: string
    orderNumber?: string
}

export function VoidOrderDialog({
    open,
    onOpenChange,
    onConfirm,
    processing,
    orderId,
    orderNumber
}: VoidOrderDialogProps) {
    const [reason, setReason] = useState("")

    const handleConfirm = () => {
        if (!reason.trim()) return
        onConfirm(reason)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        Void Order #{orderNumber || orderId.slice(0, 8)}
                    </DialogTitle>
                    <DialogDescription>
                        Are you sure you want to void this order? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="reason">Reason for Voiding <span className="text-destructive">*</span></Label>
                        <Textarea
                            id="reason"
                            placeholder="e.g. Customer cancelled, Mistake in order..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={3}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={processing}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleConfirm}
                        disabled={!reason.trim() || processing}
                    >
                        {processing ? "Voiding..." : "Void Order"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
