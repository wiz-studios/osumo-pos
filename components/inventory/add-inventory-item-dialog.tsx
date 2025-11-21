"use client"

import { useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

const inventoryItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  unit: z.string().min(1, "Unit is required"),
  quantity_in_stock: z.coerce.number().min(0, "Quantity must be non-negative"),
  reorder_level: z.coerce.number().min(0, "Reorder level must be non-negative"),
  unit_cost: z.coerce.number().min(0, "Unit cost must be non-negative"),
  supplier: z.string().optional(),
})

type InventoryItemFormValues = z.infer<typeof inventoryItemSchema>

interface AddInventoryItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function AddInventoryItemDialog({ open, onOpenChange, onSuccess }: AddInventoryItemDialogProps) {
  const { toast } = useToast()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InventoryItemFormValues>({
    resolver: zodResolver(inventoryItemSchema),
    defaultValues: {
      name: "",
      unit: "kg",
      quantity_in_stock: 0,
      reorder_level: 10,
      unit_cost: 0,
      supplier: "",
    },
  })

  const onSubmit = async (data: InventoryItemFormValues) => {
    setLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { data: staffData } = await supabase.from("staff").select("restaurant_id").eq("id", user.id).single()

      const { error } = await supabase.from("inventory_items").insert({
        ...data,
        restaurant_id: staffData?.restaurant_id,
      })

      if (error) throw error

      toast({
        title: "Success",
        description: "Inventory item added successfully",
      })

      onSuccess()
      reset()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add inventory item",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Inventory Item</DialogTitle>
          <DialogDescription>Add a new ingredient or supply item</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Item Name</Label>
            <Input id="name" placeholder="e.g., Chicken Breast" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="unit">Unit</Label>
              <Input id="unit" placeholder="e.g., kg, liters, pieces" {...register("unit")} />
              {errors.unit && <p className="text-sm text-destructive mt-1">{errors.unit.message}</p>}
            </div>

            <div>
              <Label htmlFor="unit_cost">Unit Cost (KES)</Label>
              <Input
                id="unit_cost"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register("unit_cost")}
              />
              {errors.unit_cost && <p className="text-sm text-destructive mt-1">{errors.unit_cost.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantity">Current Stock</Label>
              <Input
                id="quantity"
                type="number"
                placeholder="0"
                {...register("quantity_in_stock")}
              />
              {errors.quantity_in_stock && (
                <p className="text-sm text-destructive mt-1">{errors.quantity_in_stock.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="reorder_level">Reorder Level</Label>
              <Input
                id="reorder_level"
                type="number"
                placeholder="10"
                {...register("reorder_level")}
              />
              {errors.reorder_level && (
                <p className="text-sm text-destructive mt-1">{errors.reorder_level.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="supplier">Supplier (Optional)</Label>
            <Input id="supplier" placeholder="Supplier name" {...register("supplier")} />
            {errors.supplier && <p className="text-sm text-destructive mt-1">{errors.supplier.message}</p>}
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Adding..." : "Add Item"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
