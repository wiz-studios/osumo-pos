"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { getSupabaseClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import type { InventoryItem } from "@/lib/types"

interface AdjustStockDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function AdjustStockDialog({ open, onOpenChange, onSuccess }: AdjustStockDialogProps) {
    const { toast } = useToast()
    const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
    const [selectedItemId, setSelectedItemId] = useState("")
    const [adjustmentType, setAdjustmentType] = useState<"add" | "subtract">("add")
    const [quantity, setQuantity] = useState("")
    const [transactionType, setTransactionType] = useState<'purchase' | 'adjustment' | 'spoilage' | 'wastage'>("purchase")
    const [notes, setNotes] = useState("")
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (open) {
            fetchInventoryItems()
            resetForm()
        }
    }, [open])

    const fetchInventoryItems = async () => {
        const supabase = getSupabaseClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: staff } = await supabase.from("staff").select("restaurant_id").eq("user_id", user.id).single()
        if (!staff?.restaurant_id) return

        const { data } = await supabase
            .from("inventory_items")
            .select("*")
            .eq("restaurant_id", staff.restaurant_id)
            .order("name")

        if (data) setInventoryItems(data)
    }

    const resetForm = () => {
        setSelectedItemId("")
        setAdjustmentType("add")
        setQuantity("")
        setTransactionType("purchase")
        setNotes("")
    }

    const handleSubmit = async () => {
        if (!selectedItemId || !quantity || parseFloat(quantity) <= 0) {
            toast({
                title: "Validation Error",
                description: "Please select an item and enter a valid quantity.",
                variant: "destructive",
            })
            return
        }

        setLoading(true)
        const supabase = getSupabaseClient()

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Not authenticated")

            const { data: staff } = await supabase.from("staff").select("id, restaurant_id").eq("user_id", user.id).single()
            if (!staff) throw new Error("Staff not found")

            const adjustmentAmount = parseFloat(quantity) * (adjustmentType === "add" ? 1 : -1)

            // Update inventory stock
            const { data: item } = await supabase
                .from("inventory_items")
                .select("quantity_in_stock")
                .eq("id", selectedItemId)
                .single()

            if (!item) throw new Error("Item not found")

            const newStock = Math.max(0, item.quantity_in_stock + adjustmentAmount)

            await supabase
                .from("inventory_items")
                .update({
                    quantity_in_stock: newStock,
                    updated_at: new Date().toISOString(),
                    ...(adjustmentType === "add" && transactionType === "purchase" ? { last_restocked_at: new Date().toISOString() } : {})
                })
                .eq("id", selectedItemId)

            // Create transaction log
            await supabase.from("inventory_transactions").insert({
                restaurant_id: staff.restaurant_id,
                inventory_item_id: selectedItemId,
                transaction_type: adjustmentType === "subtract" ? (transactionType === "purchase" ? "adjustment" : transactionType) : transactionType,
                quantity: adjustmentAmount,
                notes,
                created_by: staff.id,
            })

            toast({
                title: "Stock Adjusted",
                description: `Successfully ${adjustmentType === "add" ? "added" : "removed"} ${quantity} units.`,
            })

            onSuccess()
            onOpenChange(false)
        } catch (error: any) {
            console.error("Stock adjustment error:", error)
            toast({
                title: "Adjustment Failed",
                description: error.message || "Failed to adjust stock.",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Adjust Stock</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Inventory Item</Label>
                        <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select item" />
                            </SelectTrigger>
                            <SelectContent>
                                {inventoryItems.map((item) => (
                                    <SelectItem key={item.id} value={item.id}>
                                        {item.name} ({item.quantity_in_stock} {item.unit})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Adjustment Type</Label>
                        <RadioGroup value={adjustmentType} onValueChange={(v) => setAdjustmentType(v as "add" | "subtract")}>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="add" id="add" />
                                <Label htmlFor="add" className="font-normal">Add Stock (+)</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="subtract" id="subtract" />
                                <Label htmlFor="subtract" className="font-normal">Remove Stock (-)</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    <div className="space-y-2">
                        <Label>Quantity</Label>
                        <Input
                            type="number"
                            placeholder="0"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            min="0"
                            step="0.1"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Reason</Label>
                        <Select value={transactionType} onValueChange={(v) => setTransactionType(v as any)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {adjustmentType === "add" ? (
                                    <>
                                        <SelectItem value="purchase">Delivery/Purchase</SelectItem>
                                        <SelectItem value="adjustment">Manual Adjustment</SelectItem>
                                    </>
                                ) : (
                                    <>
                                        <SelectItem value="spoilage">Spoilage</SelectItem>
                                        <SelectItem value="wastage">Wastage</SelectItem>
                                        <SelectItem value="adjustment">Manual Adjustment</SelectItem>
                                    </>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Notes (Optional)</Label>
                        <Textarea
                            placeholder="Add any additional details..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? "Adjusting..." : "Adjust Stock"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
