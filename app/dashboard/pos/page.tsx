
"use client"

import { useEffect, useState } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ShoppingCart, Search, Plus, Minus, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import type { MenuCategory, MenuItem, Order, OrderItem, RecipeIngredient } from "@/lib/types"
import { ItemModifierDialog } from "@/components/pos/item-modifier-dialog"
import { CheckoutDialog } from "@/components/pos/checkout-dialog"
import { ReceiptDialog } from "@/components/pos/receipt-dialog"
import { TableSelector } from "@/components/pos/table-selector"
import { useToast } from "@/hooks/use-toast"

interface CartItem {
    menuItem: MenuItem
    quantity: number
    notes: string
    id: string // unique id for cart item (combination of item id + notes)
}

export default function POSPage() {
    const { toast } = useToast()
    const [categories, setCategories] = useState<MenuCategory[]>([])
    const [items, setItems] = useState<MenuItem[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [activeCategory, setActiveCategory] = useState<string>("")
    const [restaurantId, setRestaurantId] = useState<string | null>(null)
    const [staffId, setStaffId] = useState<string | null>(null)
    const [staffRole, setStaffRole] = useState<string | null>(null)

    // Cart state
    const [cart, setCart] = useState<CartItem[]>([])
    const [isCartLoaded, setIsCartLoaded] = useState(false)
    const [processingOrder, setProcessingOrder] = useState(false)

    // Dialog state
    const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
    const [isModifierOpen, setIsModifierOpen] = useState(false)
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
    const [isReceiptOpen, setIsReceiptOpen] = useState(false)
    const [lastOrder, setLastOrder] = useState<Order | null>(null)
    const [lastOrderItems, setLastOrderItems] = useState<OrderItem[]>([])

    // Table selection state (for Send to Kitchen)
    const [orderType, setOrderType] = useState<'dine-in' | 'takeaway'>('dine-in')
    const [selectedTable, setSelectedTable] = useState<string>('')


    // Cart is now memory-only (no localStorage persistence)
    useEffect(() => {
        setIsCartLoaded(true)
    }, [])

    useEffect(() => {
        const fetchData = async () => {
            const supabase = getSupabaseClient()

            // Check if user is logged in via staff PIN (localStorage)
            const staffIdFromStorage = localStorage.getItem('current_staff_id')
            const roleFromStorage = localStorage.getItem('current_staff_role')

            if (staffIdFromStorage) {
                // Staff PIN login - get restaurant ID from staff record
                const { data: staff } = await supabase
                    .from("staff")
                    .select("id, restaurant_id, role")
                    .eq("id", staffIdFromStorage)
                    .single()

                if (staff?.restaurant_id) {
                    setRestaurantId(staff.restaurant_id)
                    setStaffId(staff.id)
                    setStaffRole(staff.role || roleFromStorage)
                    await Promise.all([
                        fetchCategories(staff.restaurant_id),
                        fetchItems(staff.restaurant_id)
                    ])
                }
                setLoading(false)
                return
            }

            // Fallback to Supabase auth (admin login)
            const {
                data: { user },
            } = await supabase.auth.getUser()

            if (!user) {
                setLoading(false)
                return
            }

            const { data: staff } = await supabase.from("staff").select("id, restaurant_id, role").eq("user_id", user.id).single()

            if (staff?.restaurant_id) {
                setRestaurantId(staff.restaurant_id)
                setStaffId(staff.id)
                setStaffRole(staff.role)
                await Promise.all([
                    fetchCategories(staff.restaurant_id),
                    fetchItems(staff.restaurant_id)
                ])
            }
            setLoading(false)
        }

        fetchData()
    }, [])


    const fetchCategories = async (resId: string) => {
        const supabase = getSupabaseClient()
        const { data } = await supabase
            .from("menu_categories")
            .select("*")
            .eq("restaurant_id", resId)
            .eq("is_visible", true)
            .order("display_order", { ascending: true })

        if (data && data.length > 0) {
            setCategories(data)
            setActiveCategory(data[0].id)
        }
    }

    const fetchItems = async (resId: string) => {
        const supabase = getSupabaseClient()
        const { data } = await supabase
            .from("menu_items")
            .select("*")
            .eq("restaurant_id", resId)
            .eq("available", true)
            .order("name")

        if (data) setItems(data)
    }

    const handleItemClick = (item: MenuItem) => {
        setSelectedItem(item)
        setIsModifierOpen(true)
    }

    const addToCart = (item: MenuItem, quantity: number, notes: string) => {
        const cartItemId = `${item.id}-${notes}`
        setCart(prev => {
            const existing = prev.find(i => i.id === cartItemId)
            if (existing) {
                return prev.map(i => i.id === cartItemId ? { ...i, quantity: i.quantity + quantity } : i)
            }
            return [...prev, { menuItem: item, quantity, notes, id: cartItemId }]
        })
    }

    const updateCartQuantity = (cartItemId: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === cartItemId) {
                const newQuantity = Math.max(0, item.quantity + delta)
                return { ...item, quantity: newQuantity }
            }
            return item
        }).filter(item => item.quantity > 0))
    }

    const clearCart = () => setCart([])

    const cartTotal = cart.reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0)

    const handleCreateUnpaidOrder = async () => {
        if (!restaurantId || !staffId || cart.length === 0) return

        setProcessingOrder(true)
        const supabase = getSupabaseClient()

        try {
            // Create order with unpaid status
            const { data: order, error: orderError } = await supabase
                .from("orders")
                .insert({
                    restaurant_id: restaurantId,
                    staff_id: staffId,
                    order_type: "dine-in", // Default, can be updated later
                    status: "new",
                    payment_status: "unpaid",
                    total: cartTotal,
                })
                .select()
                .single()

            if (orderError || !order) throw orderError || new Error("Failed to create order")

            // Create order items
            const orderItemsPayload = cart.map(item => ({
                order_id: order.id,
                menu_item_id: item.menuItem.id,
                quantity: item.quantity,
                unit_price: item.menuItem.price,
                subtotal: item.menuItem.price * item.quantity,
                notes: item.notes,
                item_status: "new"
            }))

            const { error: itemsError } = await supabase
                .from("order_items")
                .insert(orderItemsPayload)

            if (itemsError) throw itemsError

            toast({
                title: "Order Created",
                description: "Order has been sent to cashier for payment processing.",
            })

            clearCart()
        } catch (error: any) {
            console.error("Error creating unpaid order:", error)
            toast({
                title: "Error",
                description: error.message || "Failed to create order.",
                variant: "destructive",
            })
        } finally {
            setProcessingOrder(false)
        }
    }

    const handleSendToKitchen = async () => {
        // Validation
        if (!restaurantId || !staffId || cart.length === 0) {
            toast({
                title: "Error",
                description: "Cannot create empty order",
                variant: "destructive"
            })
            return
        }

        if (orderType === 'dine-in' && !selectedTable) {
            toast({
                title: "Table Required",
                description: "Please assign a table for dine-in orders",
                variant: "destructive"
            })
            return
        }

        setProcessingOrder(true)
        const supabase = getSupabaseClient()

        try {
            // Create order with in_kitchen status
            const { data: order, error: orderError } = await supabase
                .from("orders")
                .insert({
                    restaurant_id: restaurantId,
                    staff_id: staffId,
                    order_type: orderType === 'dine-in' ? 'dine-in' : 'takeaway',
                    table_number: orderType === 'dine-in' ? selectedTable : null,
                    status: "in_kitchen",
                    kitchen_status: "new",
                    payment_status: "unpaid",
                    sent_to_kitchen_at: new Date().toISOString(),
                    total: cartTotal
                })
                .select()
                .single()

            if (orderError || !order) throw orderError || new Error("Failed to create order")

            // Create order items
            const orderItemsPayload = cart.map(item => ({
                order_id: order.id,
                menu_item_id: item.menuItem.id,
                quantity: item.quantity,
                unit_price: item.menuItem.price,
                subtotal: item.menuItem.price * item.quantity,
                notes: item.notes,
                item_status: "new"
            }))

            const { error: itemsError } = await supabase
                .from("order_items")
                .insert(orderItemsPayload)

            if (itemsError) throw itemsError

            // Log event to order_events table
            await supabase.from("order_events").insert({
                order_id: order.id,
                from_status: null,
                to_status: "in_kitchen",
                triggered_by: staffId,
                event_type: "status_change",
                metadata: {
                    table: selectedTable,
                    order_type: orderType,
                    item_count: cart.length
                }
            })

            // Success feedback with order reference
            const orderRef = `#K${order.id.slice(0, 4).toUpperCase()}`
            toast({
                title: "Order Sent to Kitchen! 🍳",
                description: `Order ${orderRef} for ${orderType === 'dine-in' ? selectedTable : 'Takeaway'}`
            })

            clearCart()
            setSelectedTable('')
        } catch (error: any) {
            console.error("Send to kitchen error:", error)
            toast({
                title: "Failed to Send Order",
                description: error.message || "An error occurred",
                variant: "destructive"
            })
        } finally {
            setProcessingOrder(false)
        }
    }


    const handleCheckoutComplete = async (paymentData: any) => {
        if (!restaurantId || cart.length === 0) return

        setProcessingOrder(true)
        const supabase = getSupabaseClient()

        try {
            // 1. Create Order
            const { data: order, error: orderError } = await supabase
                .from("orders")
                .insert({
                    restaurant_id: restaurantId,
                    staff_id: staffId,
                    order_type: paymentData.orderType || "dine-in",
                    table_number: paymentData.tableName || null,
                    status: "paid",
                    payment_status: "paid",
                    payment_method: paymentData.method,
                    total: paymentData.total,
                    discount: paymentData.discount,
                })
                .select()
                .single()

            if (orderError || !order) throw orderError || new Error("Failed to create order")

            // 2. Create Order Items
            const orderItemsPayload = cart.map(item => ({
                order_id: order.id,
                menu_item_id: item.menuItem.id,
                quantity: item.quantity,
                unit_price: item.menuItem.price,
                subtotal: item.menuItem.price * item.quantity,
                notes: item.notes,
                item_status: "new"
            }))

            const { data: savedItems, error: itemsError } = await supabase
                .from("order_items")
                .insert(orderItemsPayload)
                .select("*, menu_item:menu_items(*)")

            if (itemsError) throw itemsError

            // 3. Create Payment Record
            const { error: paymentError } = await supabase
                .from("payments")
                .insert({
                    order_id: order.id,
                    amount: paymentData.total,
                    payment_method: paymentData.method,
                    status: "completed",
                    cash_received: paymentData.details.cashReceived,
                    change_given: paymentData.details.changeGiven,
                    mpesa_phone: paymentData.details.mpesaPhone,
                    reference: paymentData.details.mpesaTxn,
                })

            if (paymentError) throw paymentError

            // 4. Generate KRA Invoice
            const { generateInvoiceNumber, calculateVAT, generateQRCode, getNextSequenceNumber } = await import("@/lib/kra-helpers")

            // Get restaurant details for KRA
            const { data: restaurant } = await supabase
                .from("restaurants")
                .select("business_name, kra_pin, vat_registered")
                .eq("id", restaurantId)
                .single()

            // Get next sequence number for today
            const sequenceNumber = await getNextSequenceNumber(supabase, restaurantId, new Date())
            const invoiceNumber = generateInvoiceNumber(new Date(), sequenceNumber)

            // Calculate VAT if registered
            let taxableAmount = null
            let vatAmount = null
            if (restaurant?.vat_registered) {
                const vatCalc = calculateVAT(paymentData.total)
                taxableAmount = vatCalc.taxableAmount
                vatAmount = vatCalc.vatAmount
            }

            // Generate QR code
            const qrCodeData = await generateQRCode({
                invoiceNumber,
                kraPin: restaurant?.kra_pin || "Not Set",
                totalAmount: paymentData.total
            })

            // Save invoice
            const { error: invoiceError } = await supabase
                .from("invoices")
                .insert({
                    restaurant_id: restaurantId,
                    order_id: order.id,
                    invoice_number: invoiceNumber,
                    invoice_date: new Date().toISOString().split('T')[0],
                    sequence_number: sequenceNumber,
                    total_amount: paymentData.total,
                    taxable_amount: taxableAmount,
                    vat_amount: vatAmount,
                    qr_code_data: qrCodeData,
                    is_mock_tims: true
                })

            if (invoiceError) throw invoiceError

            // 5. Deduct Inventory Stock
            const menuItemIds = cart.map(c => c.menuItem.id)
            const { data: recipes } = await supabase
                .from("recipe_ingredients")
                .select("inventory_item_id, quantity_required, menu_item_id")
                .in("menu_item_id", menuItemIds)

            if (recipes && recipes.length > 0) {
                // Calculate total deductions per inventory item
                const deductions = new Map<string, number>()
                cart.forEach(cartItem => {
                    const itemRecipes = recipes.filter((r: RecipeIngredient) => r.menu_item_id === cartItem.menuItem.id)
                    itemRecipes.forEach((recipe: RecipeIngredient) => {
                        const currentDeduction = deductions.get(recipe.inventory_item_id) || 0
                        deductions.set(recipe.inventory_item_id, currentDeduction + (recipe.quantity_required * cartItem.quantity))
                    })
                })

                // Update stock and create transactions
                for (const [inventoryItemId, quantityToDeduct] of deductions) {
                    // Use the deduct function
                    await supabase.rpc('deduct_inventory_stock', {
                        p_inventory_item_id: inventoryItemId,
                        p_quantity: quantityToDeduct
                    })

                    // Log transaction
                    await supabase.from("inventory_transactions").insert({
                        restaurant_id: restaurantId,
                        inventory_item_id: inventoryItemId,
                        transaction_type: 'sale',
                        quantity: -quantityToDeduct,
                        reference_id: order.id,
                        notes: `Auto-deducted from order #${order.id.slice(0, 8)}`,
                        created_by: staffId
                    })
                }
            }

            // Success
            setLastOrder(order)
            // Manually construct order items with menu item data for receipt since insert select might be shallow
            const receiptItems = cart.map(c => ({
                id: c.id, // temp id
                order_id: order.id,
                menu_item_id: c.menuItem.id,
                quantity: c.quantity,
                unit_price: c.menuItem.price,
                subtotal: c.menuItem.price * c.quantity,
                notes: c.notes,
                item_status: "new" as const,
                created_at: new Date().toISOString(),
                menu_item: c.menuItem
            }))
            setLastOrderItems(receiptItems)

            setIsCheckoutOpen(false)
            setIsReceiptOpen(true)
            clearCart()

        } catch (error: any) {
            console.error("Order submission error:", error)
            console.error("Order submission error (stringified):", JSON.stringify(error, null, 2))
            toast({
                title: "Order Failed",
                description: error.message || "There was a problem placing your order.",
                variant: "destructive",
            })
        } finally {
            setProcessingOrder(false)
        }
    }

    const filteredItems = items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = activeCategory ? item.category_id === activeCategory : true
        return matchesSearch && matchesCategory
    })

    if (loading) return <div className="flex items-center justify-center h-screen">Loading POS...</div>

    return (
        <div className="flex h-[calc(100vh-4rem)] gap-4 p-4 overflow-hidden">
            {/* Left Side: Menu */}
            <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                {/* Search and Filter */}
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search items..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                </div>

                {/* Categories */}
                <ScrollArea className="w-full whitespace-nowrap pb-2">
                    <div className="flex w-max space-x-2 p-1">
                        {categories.map((category) => (
                            <Button
                                key={category.id}
                                variant={activeCategory === category.id ? "default" : "outline"}
                                onClick={() => setActiveCategory(category.id)}
                                className="rounded-full"
                            >
                                {category.name}
                            </Button>
                        ))}
                    </div>
                </ScrollArea>

                {/* Items Grid */}
                <div className="flex-1 overflow-hidden">
                    <ScrollArea className="h-full">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-4 pr-4">
                            {filteredItems.map((item) => (
                                <Card
                                    key={item.id}
                                    className="cursor-pointer hover:bg-accent transition-colors active:scale-95 overflow-hidden"
                                    onClick={() => handleItemClick(item)}
                                >
                                    {item.image_url && (
                                        <div className="relative w-full h-32 overflow-hidden">
                                            <Image
                                                src={item.image_url}
                                                alt={item.name}
                                                fill
                                                className="object-cover"
                                                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                                            />
                                        </div>
                                    )}
                                    <CardContent className={`p-4 flex flex-col justify-between ${item.image_url ? 'h-24' : 'h-32'}`}>
                                        <div>
                                            <h3 className="font-bold leading-tight line-clamp-2">{item.name}</h3>
                                            {item.is_daily_special && (
                                                <Badge variant="destructive" className="mt-1 text-[10px] px-1 py-0">Special</Badge>
                                            )}
                                        </div>
                                        <div className="flex justify-between items-end">
                                            <span className="font-semibold text-lg">KES {item.price}</span>
                                            {item.prep_time_minutes > 0 && (
                                                <span className="text-xs text-muted-foreground">{item.prep_time_minutes}m</span>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                            {filteredItems.length === 0 && (
                                <div className="col-span-full text-center py-12 text-muted-foreground">
                                    No items found in this category.
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </div>

            {/* Right Side: Cart */}
            <div className="w-96 border-l pl-4 flex flex-col hidden md:flex bg-card rounded-lg shadow-sm">
                <div className="flex items-center justify-between mb-4 p-2 border-b">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5" />
                        Current Order
                    </h2>
                    <Button variant="ghost" size="icon" onClick={clearCart} disabled={cart.length === 0}>
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                </div>

                <ScrollArea className="flex-1 pr-4 max-h-[calc(100vh-20rem)]">
                    {cart.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground border-2 border-dashed rounded-lg bg-muted/10 m-2">
                            <ShoppingCart className="h-8 w-8 mb-2 opacity-20" />
                            <p>Cart is empty</p>
                            <p className="text-xs mt-1">Tap items to add to order</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
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
                                            onClick={() => updateCartQuantity(item.id, -1)}
                                        >
                                            <Minus className="h-3 w-3" />
                                        </Button>
                                        <span className="w-4 text-center text-sm font-bold">{item.quantity}</span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={() => updateCartQuantity(item.id, 1)}
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
                            <span>KES {cartTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-xl">
                            <span>Total</span>
                            <span>KES {cartTotal.toFixed(2)}</span>
                        </div>
                    </div>
                    {staffRole === "waiter" ? (
                        <div className="space-y-3">
                            <TableSelector
                                orderType={orderType}
                                onOrderTypeChange={setOrderType}
                                selectedTable={selectedTable}
                                onTableChange={setSelectedTable}
                            />
                            <Button
                                className="w-full bg-orange-600 hover:bg-orange-700"
                                size="lg"
                                disabled={cart.length === 0 || processingOrder}
                                onClick={handleSendToKitchen}
                            >
                                {processingOrder ? "Sending..." : "Send to Kitchen 🍳"}
                            </Button>
                            <Button
                                className="w-full"
                                size="lg"
                                variant="outline"
                                disabled={cart.length === 0 || processingOrder}
                                onClick={handleCreateUnpaidOrder}
                            >
                                {processingOrder ? "Creating..." : "Create Order (For Cashier)"}
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
                            onClick={() => setIsCheckoutOpen(true)}
                        >
                            Checkout
                        </Button>
                    )}
                </div>
            </div>

            <ItemModifierDialog
                open={isModifierOpen}
                onOpenChange={setIsModifierOpen}
                item={selectedItem}
                onAddToCart={addToCart}
            />

            <CheckoutDialog
                open={isCheckoutOpen}
                onOpenChange={setIsCheckoutOpen}
                cart={cart}
                subtotal={cartTotal}
                onComplete={handleCheckoutComplete}
                processing={processingOrder}
            />

            <ReceiptDialog
                open={isReceiptOpen}
                onOpenChange={setIsReceiptOpen}
                order={lastOrder}
                items={lastOrderItems}
                onClose={() => setIsReceiptOpen(false)}
            />
        </div>
    )
}
