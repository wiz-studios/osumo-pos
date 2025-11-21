"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Minus, Plus } from "lucide-react"
import type { MenuItem } from "@/lib/types"

interface ItemModifierDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    item: MenuItem | null
    onAddToCart: (item: MenuItem, quantity: number, notes: string) => void
}

export function ItemModifierDialog({
    open,
    onOpenChange,
    item,
    onAddToCart,
}: ItemModifierDialogProps) {
    const [quantity, setQuantity] = useState(1)
    const [notes, setNotes] = useState("")

    useEffect(() => {
        if (open) {
            setQuantity(1)
            setNotes("")
        }
    }, [open])

    if (!item) return null

    const handleAddToCart = () => {
        onAddToCart(item, quantity, notes)
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{item.name}</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="flex items-center justify-between">
                        <span className="text-lg font-semibold">Price</span>
                        <span className="text-lg font-bold">KES {item.price}</span>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Special Instructions</Label>
                        <Textarea
                            id="notes"
                            placeholder="e.g., No onions, extra spicy..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="resize-none"
                        />
                    </div>

                    <div className="flex items-center justify-between border-t pt-4">
                        <span className="font-medium">Quantity</span>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-full"
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                disabled={quantity <= 1}
                            >
                                <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center font-bold text-lg">{quantity}</span>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-full"
                                onClick={() => setQuantity(quantity + 1)}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                <DialogFooter className="sm:justify-between gap-2">
                    <div className="flex-1 flex items-center font-bold text-lg">
                        Total: KES {(item.price * quantity).toFixed(2)}
                    </div>
                    <Button onClick={handleAddToCart} size="lg" className="flex-1">
                        Add to Order
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
