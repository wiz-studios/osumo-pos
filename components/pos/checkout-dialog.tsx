"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CreditCard, Banknote, Smartphone, Wallet, UtensilsCrossed, ShoppingBag } from "lucide-react"
import type { MenuItem } from "@/lib/types"
import { cn } from "@/lib/utils"
import { getSupabaseClient } from "@/lib/supabase/client"

interface CartItem {
    menuItem: MenuItem
    quantity: number
    notes: string
    id: string
}

interface CheckoutDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    cart: CartItem[]
    subtotal: number
    onComplete: (paymentData: any) => void
    processing: boolean
}

/**
 * CheckoutDialog Component
 * 
 * Handles the final step of the order process.
 * Allows selecting order type (dine-in/takeaway), table (if dine-in), and payment method.
 * Calculates totals including discounts and change due.
 */
export function CheckoutDialog({
    open,
    onOpenChange,
    cart,
    subtotal,
    onComplete,
    processing,
}: CheckoutDialogProps) {
    // Table & Order Type state
    const [orderType, setOrderType] = useState<"dine_in" | "takeaway" | null>(null)
    const [selectedTable, setSelectedTable] = useState<string>("")
    const [tables, setTables] = useState<any[]>([])
    const [restaurantId, setRestaurantId] = useState<string | null>(null)

    const [discount, setDiscount] = useState<string>("")
    const [paymentMethod, setPaymentMethod] = useState<"cash" | "m-pesa" | "card">("cash")

    // Cash state
    const [cashReceived, setCashReceived] = useState<string>("")

    // M-Pesa state
    const [mpesaPhone, setMpesaPhone] = useState("")
    const [mpesaTxn, setMpesaTxn] = useState("")

    const discountAmount = parseFloat(discount) || 0
    const total = Math.max(0, subtotal - discountAmount)
    const change = Math.max(0, (parseFloat(cashReceived) || 0) - total)

    // Fetch tables and restaurant ID on mount
    useEffect(() => {
        const fetchTables = async () => {
            const supabase = getSupabaseClient()
            const staffIdFromStorage = localStorage.getItem('current_staff_id')

            if (staffIdFromStorage) {
                const { data: staff } = await supabase
                    .from("staff")
                    .select("restaurant_id")
                    .eq("id", staffIdFromStorage)
                    .single()

                if (staff?.restaurant_id) {
                    setRestaurantId(staff.restaurant_id)
                    // Only fetch active tables for the current restaurant
                    const { data: tablesData } = await supabase
                        .from("tables")
                        .select("*")
                        .eq("restaurant_id", staff.restaurant_id)
                        .eq("is_active", true)
                        .order("name")

                    if (tablesData) setTables(tablesData)
                }
            }
        }

        fetchTables()
    }, [])

    useEffect(() => {
        if (open) {
            setOrderType(null)
            setSelectedTable("")
            setDiscount("")
            setCashReceived("")
            setMpesaPhone("")
            setMpesaTxn("")
            setPaymentMethod("cash")
        }
    }, [open])

    /**
     * Compiles payment data and triggers the completion callback.
     */
    const handleComplete = () => {
        const paymentData = {
            total,
            discount: discountAmount,
            method: paymentMethod,
            orderType,
            tableName: orderType === "dine_in" ? selectedTable : null,
            details: {
                cashReceived: paymentMethod === "cash" ? parseFloat(cashReceived) : undefined,
                changeGiven: paymentMethod === "cash" ? change : undefined,
                mpesaPhone: paymentMethod === "m-pesa" ? mpesaPhone : undefined,
                mpesaTxn: paymentMethod === "m-pesa" ? mpesaTxn : undefined,
            }
        }
        onComplete(paymentData)
    }

    /**
     * Validates if the payment can be processed based on the selected method and inputs.
     */
    const isPaymentValid = () => {
        // Must select order type
        if (!orderType) return false

        // If dine-in, must select table
        if (orderType === "dine_in" && !selectedTable) return false

        if (paymentMethod === "cash") {
            return (parseFloat(cashReceived) || 0) >= total
        }
        if (paymentMethod === "m-pesa") {
            return mpesaPhone.length >= 10 && mpesaTxn.length > 0
        }
        return true
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl h-[80vh] flex flex-col p-0 gap-0 overflow-hidden">
                <div className="flex flex-1 overflow-hidden">
                    {/* Left: Order Summary */}
                    <div className="w-1/3 border-r bg-muted/10 flex flex-col">
                        <div className="p-4 border-b">
                            <h3 className="font-semibold">Order Summary</h3>
                        </div>
                        <ScrollArea className="flex-1 p-4">
                            <div className="space-y-4">
                                {/* Order Type Selection */}
                                <div className="space-y-2 pb-4 border-b">
                                    <Label className="text-sm font-semibold">Order Type</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button
                                            type="button"
                                            variant={orderType === "dine_in" ? "default" : "outline"}
                                            className="h-20 flex flex-col gap-2"
                                            onClick={() => setOrderType("dine_in")}
                                        >
                                            <UtensilsCrossed className="h-6 w-6" />
                                            Dine-in
                                        </Button>
                                        <Button
                                            type="button"
                                            variant={orderType === "takeaway" ? "default" : "outline"}
                                            className="h-20 flex flex-col gap-2"
                                            onClick={() => { setOrderType("takeaway"); setSelectedTable(""); }}
                                        >
                                            <ShoppingBag className="h-6 w-6" />
                                            Takeaway
                                        </Button>
                                    </div>
                                </div>

                                {/* Table Selection (only for dine-in) */}
                                {orderType === "dine_in" && (
                                    <div className="space-y-2 pb-4 border-b">
                                        <Label className="text-sm font-semibold">Select Table</Label>
                                        <Select value={selectedTable} onValueChange={setSelectedTable}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Choose a table..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {tables.map((table) => (
                                                    <SelectItem key={table.id} value={table.name}>
                                                        {table.name} (Seats {table.capacity})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                {/* Cart Items */}
                                {cart.map((item) => (
                                    <div key={item.id} className="flex justify-between text-sm">
                                        <div>
                                            <span className="font-medium">{item.quantity}x</span> {item.menuItem.name}
                                        </div>
                                        <span>{(item.menuItem.price * item.quantity).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                        <div className="p-4 border-t space-y-3 bg-background">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span>{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                                <Label htmlFor="discount" className="text-sm text-muted-foreground">Discount</Label>
                                <div className="relative w-24">
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold">KES</span>
                                    <Input
                                        id="discount"
                                        className="h-8 pl-9 text-right"
                                        placeholder="0"
                                        value={discount}
                                        onChange={(e) => setDiscount(e.target.value)}
                                    />
                                </div>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-bold text-lg">
                                <span>Total Due</span>
                                <span>KES {total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Payment */}
                    <div className="flex-1 flex flex-col bg-background">
                        <div className="p-6 flex-1">
                            <DialogHeader className="mb-6">
                                <DialogTitle>Payment Method</DialogTitle>
                            </DialogHeader>

                            <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as any)} className="w-full">
                                <TabsList className="grid w-full grid-cols-3 mb-6">
                                    <TabsTrigger value="cash" className="flex gap-2">
                                        <Banknote className="h-4 w-4" /> Cash
                                    </TabsTrigger>
                                    <TabsTrigger value="m-pesa" className="flex gap-2">
                                        <Smartphone className="h-4 w-4" /> M-Pesa
                                    </TabsTrigger>
                                    <TabsTrigger value="card" className="flex gap-2">
                                        <CreditCard className="h-4 w-4" /> Card
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="cash" className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-base">Amount Received</Label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-lg">KES</span>
                                                <Input
                                                    className="pl-12 h-14 text-xl font-bold"
                                                    placeholder="0.00"
                                                    value={cashReceived}
                                                    onChange={(e) => setCashReceived(e.target.value)}
                                                    autoFocus
                                                />
                                            </div>
                                        </div>

                                        <div className="p-4 rounded-lg bg-muted flex justify-between items-center">
                                            <span className="font-medium">Change to Return</span>
                                            <span className={cn("text-xl font-bold", change < 0 ? "text-destructive" : "text-green-600")}>
                                                KES {change.toFixed(2)}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2">
                                            {[100, 200, 500, 1000].map((amount) => (
                                                <Button
                                                    key={amount}
                                                    variant="outline"
                                                    onClick={() => setCashReceived(amount.toString())}
                                                >
                                                    {amount}
                                                </Button>
                                            ))}
                                            <Button variant="outline" onClick={() => setCashReceived(total.toString())}>
                                                Exact
                                            </Button>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="m-pesa" className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Customer Phone Number</Label>
                                            <Input
                                                placeholder="07..."
                                                value={mpesaPhone}
                                                onChange={(e) => setMpesaPhone(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Transaction ID</Label>
                                            <Input
                                                placeholder="e.g. LGR93H3J"
                                                value={mpesaTxn}
                                                onChange={(e) => setMpesaTxn(e.target.value.toUpperCase())}
                                            />
                                        </div>
                                        <div className="p-4 rounded-lg bg-blue-50 text-blue-700 text-sm">
                                            <p className="font-semibold mb-1">M-Pesa Instructions:</p>
                                            <p>Ask customer to Paybill: <strong>123456</strong></p>
                                            <p>Account: <strong>Table 1</strong></p>
                                            <p>Amount: <strong>KES {total.toFixed(2)}</strong></p>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="card" className="space-y-6">
                                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                                        <CreditCard className="h-16 w-16 mb-4 opacity-20" />
                                        <p>Process payment on the card terminal.</p>
                                        <p className="text-sm">Record the transaction reference below (optional).</p>
                                    </div>
                                    <Input placeholder="Transaction Reference" />
                                </TabsContent>
                            </Tabs>
                        </div>

                        <div className="p-6 border-t bg-muted/10">
                            <Button
                                className="w-full h-12 text-lg font-bold"
                                size="lg"
                                disabled={!isPaymentValid() || processing}
                                onClick={handleComplete}
                            >
                                {processing ? "Processing..." : `Complete Payment (KES ${total.toFixed(2)})`}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
