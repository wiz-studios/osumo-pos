"use client"

import { useEffect, useMemo, useState } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Order } from "@/lib/types"
import { Plus, Minus, X } from "lucide-react"
import { menuCategories, menuItems, type StaticMenuItem } from "@/data/menu"

interface NewOrderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  restaurantId: string
  onOrderCreated: (order: Order) => void
}

interface CartItem {
  itemCode: string
  name: string
  quantity: number
  unitPrice: number
  subtotal: number
}

export function NewOrderDialog({ open, onOpenChange, restaurantId, onOrderCreated }: NewOrderDialogProps) {
  const [step, setStep] = useState<"type" | "menu" | "confirm">("type")
  const [orderType, setOrderType] = useState<"dine-in" | "takeaway" | "delivery">("dine-in")
  const [tableNumber, setTableNumber] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [activeCategory, setActiveCategory] = useState<string | null>(menuCategories[0]?.code ?? null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)
  const [availability, setAvailability] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!open) return

    const fetchData = async () => {
      const supabase = getSupabaseClient()
      const { data: availabilityRows } = await supabase
        .from("menu_item_availability")
        .select("item_code, available")
        .eq("restaurant_id", restaurantId)
      const map: Record<string, boolean> = {}
      availabilityRows?.forEach((row: any) => {
        map[row.item_code] = !!row.available
      })
      setAvailability(map)
    }

    fetchData()
  }, [open, restaurantId])

  const visibleItemsByCategory = useMemo(() => {
    return (categoryCode: string) =>
      menuItems
        .filter((i) => i.categoryCode === categoryCode)
        .filter((i) => (availability[i.code] ?? true) === true)
  }, [availability])

  const handleAddToCart = (item: StaticMenuItem) => {
    const existingItem = cart.find((c) => c.itemCode === item.code)
    if (existingItem) {
      setCart(
        cart.map((c) =>
          c.itemCode === item.code
            ? {
                ...c,
                quantity: c.quantity + 1,
                subtotal: (c.quantity + 1) * c.unitPrice,
              }
            : c,
        ),
      )
    } else {
      setCart([
        ...cart,
        {
          itemCode: item.code,
          name: item.name,
          quantity: 1,
          unitPrice: item.priceKes,
          subtotal: item.priceKes,
        },
      ])
    }
  }

  const handleUpdateQuantity = (itemCode: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(cart.filter((c) => c.itemCode !== itemCode))
    } else {
      setCart(
        cart.map((c) =>
          c.itemCode === itemCode
            ? {
                ...c,
                quantity,
                subtotal: quantity * c.unitPrice,
              }
            : c,
        ),
      )
    }
  }

  const handleRemoveFromCart = (itemCode: string) => {
    setCart(cart.filter((c) => c.itemCode !== itemCode))
  }

  const cartTotal = cart.reduce((sum, item) => sum + item.subtotal, 0)

  const ensureMenuItemId = async (supabase: any, staticItem: StaticMenuItem) => {
    // Try to find existing category by name
    const categoryName = menuCategories.find((c) => c.code === staticItem.categoryCode)?.name || "General"
    let categoryId: string | null = null
    {
      const { data: existingCat } = await supabase
        .from("menu_categories")
        .select("id")
        .eq("restaurant_id", restaurantId)
        .eq("name", categoryName)
        .maybeSingle?.() || { data: null }
      if (existingCat?.id) {
        categoryId = existingCat.id
      } else {
        const { data: newCat } = await supabase
          .from("menu_categories")
          .insert({
            restaurant_id: restaurantId,
            name: categoryName,
          })
          .select("id")
          .single()
        categoryId = newCat.id
      }
    }

    // Try to find existing item by name for this restaurant
    const { data: existingItem } = await supabase
      .from("menu_items")
      .select("id")
      .eq("restaurant_id", restaurantId)
      .eq("name", staticItem.name)
      .maybeSingle?.() || { data: null }
    if (existingItem?.id) return existingItem.id

    const { data: newItem } = await supabase
      .from("menu_items")
      .insert({
        restaurant_id: restaurantId,
        category_id: categoryId,
        name: staticItem.name,
        description: staticItem.description || null,
        price: staticItem.priceKes,
        prep_time_minutes: staticItem.prepTimeMinutes || null,
        is_vegan: staticItem.isVegan || false,
        is_spicy: staticItem.isSpicy || false,
        available: true,
      })
      .select("id")
      .single()
    return newItem.id
  }

  const handleCreateOrder = async () => {
    if (
      (orderType === "dine-in" && !tableNumber) ||
      ((orderType === "takeaway" || orderType === "delivery") && !customerName)
    ) {
      return
    }

    setLoading(true)
    const supabase = getSupabaseClient()

    // Resolve static codes to menu_items ids
    const orderItems = []
    for (const c of cart) {
      const staticItem = menuItems.find((i) => i.code === c.itemCode)!
      const menuItemId = await ensureMenuItemId(supabase, staticItem)
      orderItems.push({
        menu_item_id: menuItemId,
        quantity: c.quantity,
        unit_price: c.unitPrice,
      })
    }

    const { data: newOrder, error } = await supabase
      .from("orders")
      .insert({
        restaurant_id: restaurantId,
        table_number: orderType === "dine-in" ? Number.parseInt(tableNumber) : null,
        customer_name: customerName || null,
        order_type: orderType,
        total: cartTotal,
      })
      .select()
      .single()

    if (error) {
      setLoading(false)
      return
    }

    if (orderItems.length > 0) {
      const itemsToInsert = orderItems.map((item) => ({
        ...item,
        order_id: newOrder.id,
        subtotal: item.quantity * item.unit_price,
      }))

      await supabase.from("order_items").insert(itemsToInsert)
    }

    onOrderCreated(newOrder)
    setStep("type")
    setOrderType("dine-in")
    setTableNumber("")
    setCustomerName("")
    setCart([])
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === "type" && "Select Order Type"}
            {step === "menu" && "Add Items to Order"}
            {step === "confirm" && "Confirm Order"}
          </DialogTitle>
        </DialogHeader>

        {step === "type" && (
          <div className="space-y-4">
            <div>
              <Label>Order Type</Label>
              <Select value={orderType} onValueChange={(v) => setOrderType(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dine-in">Dine In</SelectItem>
                  <SelectItem value="takeaway">Takeaway</SelectItem>
                  <SelectItem value="delivery">Delivery</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {orderType === "dine-in" && (
              <div>
                <Label htmlFor="table">Table Number</Label>
                <Input
                  id="table"
                  type="number"
                  placeholder="1"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                />
              </div>
            )}

            {(orderType === "takeaway" || orderType === "delivery") && (
              <div>
                <Label htmlFor="customer">Customer Name</Label>
                <Input
                  id="customer"
                  placeholder="John Doe"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
            )}

            <Button onClick={() => setStep("menu")} className="w-full">
              Continue
            </Button>
          </div>
        )}

        {step === "menu" && (
          <div className="grid grid-cols-3 gap-4 h-[500px]">
            <div className="col-span-2 space-y-4">
              <Tabs value={activeCategory || ""} onValueChange={setActiveCategory}>
                <TabsList className="w-full justify-start overflow-x-auto">
                  {menuCategories.map((cat) => (
                    <TabsTrigger key={cat.code} value={cat.code}>
                      {cat.name}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {menuCategories.map((cat) => (
                  <TabsContent key={cat.code} value={cat.code}>
                    <div className="grid grid-cols-2 gap-2 overflow-y-auto max-h-[400px]">
                      {visibleItemsByCategory(cat.code).map((item) => (
                          <Card
                            key={item.code}
                            className="cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => handleAddToCart(item)}
                          >
                            <CardContent className="p-3 text-center">
                              <p className="font-medium text-sm">{item.name}</p>
                              <p className="text-sm font-bold text-primary">KES {item.priceKes}</p>
                              <Button size="sm" variant="outline" className="w-full mt-2 gap-1 bg-transparent">
                                <Plus size={14} />
                                Add
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </div>

            <div className="border-l border-border pl-4 space-y-4 overflow-y-auto">
              <h3 className="font-bold">Cart</h3>
              {cart.length > 0 ? (
                <>
                  <div className="space-y-2">
                    {cart.map((item) => (
                      <div key={item.itemCode} className="bg-muted p-2 rounded text-sm">
                        <div className="flex justify-between items-start">
                          <span className="font-medium">{item.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveFromCart(item.itemCode)}
                            className="h-4 w-4 p-0"
                          >
                            <X size={14} />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateQuantity(item.itemCode, item.quantity - 1)}
                            className="h-6 w-6 p-0"
                          >
                            <Minus size={12} />
                          </Button>
                          <span className="flex-1 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateQuantity(item.itemCode, item.quantity + 1)}
                            className="h-6 w-6 p-0"
                          >
                            <Plus size={12} />
                          </Button>
                        </div>
                        <p className="text-right mt-1 font-semibold">KES {item.subtotal.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-border pt-2 mt-auto">
                    <div className="flex justify-between font-bold mb-3">
                      <span>Total:</span>
                      <span>KES {cartTotal.toFixed(2)}</span>
                    </div>
                    <Button onClick={() => setStep("confirm")} className="w-full">
                      Confirm Order
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground text-sm">Cart is empty</p>
              )}
            </div>
          </div>
        )}

        {step === "confirm" && (
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order Type:</span>
                  <span className="font-medium">{orderType}</span>
                </div>
                {orderType === "dine-in" && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Table:</span>
                    <span className="font-medium">{tableNumber}</span>
                  </div>
                )}
                {(orderType === "takeaway" || orderType === "delivery") && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Customer:</span>
                    <span className="font-medium">{customerName}</span>
                  </div>
                )}
                <div className="border-t border-border pt-2 mt-2">
                  {cart.map((item) => (
                    <div key={item.itemCode} className="flex justify-between text-sm">
                      <span>
                        {item.quantity}x {item.name}
                      </span>
                      <span>KES {item.subtotal.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border pt-2 mt-2 flex justify-between font-bold">
                  <span>Total:</span>
                  <span>KES {cartTotal.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("menu")} className="flex-1">
                Back
              </Button>
              <Button onClick={handleCreateOrder} disabled={loading} className="flex-1">
                {loading ? "Creating..." : "Create Order"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
