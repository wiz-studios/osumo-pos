"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ShoppingCart, Trash2, Plus, Minus } from "lucide-react"
import { TableSelector } from "@/components/pos/table-selector"
import { MenuItem } from "@/lib/types"

interface CartItem {
    menuItem: MenuItem
    quantity: number
    notes: string
    id: string
}

interface CartViewProps {
    cart: CartItem[]
    onUpdateQuantity: (id: string, delta: number) => void
    onClear: () => void
    total: number
    staffRole: string | null
    orderType: 'dine-in' | 'takeaway'
    onOrderTypeChange: (type: 'dine-in' | 'takeaway') => void
    selectedTable: string
    onTableChange: (table: string) => void
    onSendToKitchen: () => void
    onCreateUnpaid: () => void
    onCheckout: () => void
    processing: boolean
}

export function CartView({
    cart,
    onUpdateQuantity,
    onClear,
    total,
    staffRole,
    orderType,
    onOrderTypeChange,
    selectedTable,
    onTableChange,
    onSendToKitchen,
    onCreateUnpaid,
    onCheckout,
    processing
}: CartViewProps) {
    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-4 p-2 border-b">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Current Order
                </h2>
                <Button variant="ghost" size="icon" onClick={onClear} disabled={cart.length === 0}>
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                </Button>
            </div>

            <ScrollArea className="flex-1 min-h-0 pr-2">
                {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-muted-foreground border-2 border-dashed rounded-lg bg-muted/10 m-2">
                        <ShoppingCart className="h-8 w-8 mb-2 opacity-20" />
                        <p>Cart is empty</p>
                        <p className="text-xs mt-1">Tap items to add to order</p>
                    </div>
                ) : (
                    <div className="space-y-3 max-h-[400px]">
                        {cart.map((item) => (
                            <div key={item.id} className="flex justify-between items-start p-2 rounded-lg bg-muted/30">
                                <div className="flex-1">
                                    <div className="font-medium">{item.menuItem.name}</div>
                                    {item.notes && (
                                        <div className="text-xs text-muted-foreground italic">"{item.notes}"</div>
                                    )}
                                    <div className="text-sm font-semibold mt-1">KES {item.menuItem.price * item.quantity}</div>
                                </div>
                                <div className="flex items-center gap-2 bg-background rounded-md border p-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() => onUpdateQuantity(item.id, -1)}
                                    >
                                        <Minus className="h-3 w-3" />
                                    </Button>
                                    <span className="w-4 text-center text-sm font-bold">{item.quantity}</span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() => onUpdateQuantity(item.id, 1)}
                                    >
                                        <Plus className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>

            <div className="mt-4 space-y-4 border-t pt-4 p-2">
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>KES {total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-xl">
                        <span>Total</span>
                        <span>KES {total.toFixed(2)}</span>
                    </div>
                </div>
                {staffRole === "waiter" ? (
                    <div className="space-y-3">
                        <TableSelector
                            orderType={orderType}
                            onOrderTypeChange={onOrderTypeChange}
                            selectedTable={selectedTable}
                            onTableChange={onTableChange}
                        />
                        <Button
                            className="w-full bg-orange-600 hover:bg-orange-700"
                            size="lg"
                            disabled={cart.length === 0 || processing}
                            onClick={onSendToKitchen}
                        >
                            {processing ? "Sending..." : "Send to Kitchen 🍳"}
                        </Button>
                        <Button
                            className="w-full"
                            size="lg"
                            variant="outline"
                            disabled={cart.length === 0 || processing}
                            onClick={onCreateUnpaid}
                        >
                            {processing ? "Creating..." : "Create Order (For Cashier)"}
                        </Button>
                        <p className="text-xs text-center text-muted-foreground">
                            Use "Send to Kitchen" for dine-in orders
                        </p>
                    </div>
                ) : (
                    <Button
                        className="w-full"
                        size="lg"
                        disabled={cart.length === 0}
                        onClick={onCheckout}
                    >
                        Checkout
                    </Button>
                )}
            </div>
        </div>
    )
}
