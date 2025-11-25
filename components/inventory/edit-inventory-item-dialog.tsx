"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import type { InventoryItem } from "@/lib/types"

const inventoryItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  unit: z.string().min(1, "Unit is required"),
  quantity_in_stock: z.coerce.number().min(0, "Quantity must be non-negative"),
  reorder_level: z.coerce.number().min(0, "Reorder level must be non-negative"),
  unit_cost: z.coerce.number().min(0, "Unit cost must be non-negative"),
  supplier: z.string().optional(),
})

type InventoryItemFormValues = z.infer<typeof inventoryItemSchema>

interface EditInventoryItemDialogProps {
  item: InventoryItem
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EditInventoryItemDialog({ item, open, onOpenChange, onSuccess }: EditInventoryItemDialogProps) {
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
      name: item.name,
      unit: item.unit,
      quantity_in_stock: item.quantity_in_stock,
      reorder_level: item.reorder_level,
      unit_cost: item.unit_cost,
      supplier: item.supplier || "",
    },
  })

  // Reset form when item changes
  useEffect(() => {
    if (item) {
      reset({
        name: item.name,
        unit: item.unit,
        quantity_in_stock: item.quantity_in_stock,
        reorder_level: item.reorder_level,
        unit_cost: item.unit_cost,
        supplier: item.supplier || "",
      })
    }
  }, [item, reset])

  const onSubmit = async (data: InventoryItemFormValues) => {
    setLoading(true)

    try {
      // Log the data being submitted
      console.log("Submitting inventory update:", data)

      // Ensure unit_cost is a number
      const updateData = {
        ...data,
        unit_cost: Number(data.unit_cost),
        quantity_in_stock: Number(data.quantity_in_stock),
        reorder_level: Number(data.reorder_level),
      }

      console.log("Processed update data:", updateData)
      console.log("Updating item with ID:", item.id)

      const { data: updatedData, error } = await supabase
        .from("inventory_items")
        .update(updateData)
        .eq("id", item.id)
        .select()

      console.log("Database response:", { updatedData, error })

      if (error) throw error

      toast({
        title: "Success",
        description: `Inventory item updated successfully. New unit cost: KES ${updateData.unit_cost}`,
      })

      onSuccess()
    } catch (error) {
      console.error("Error updating inventory item:", error)
      toast({
        title: "Error",
        description: "Failed to update inventory item",
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
          <DialogTitle>Edit Inventory Item</DialogTitle>
          <DialogDescription>Update item details and stock levels</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Item Name</Label>
            <Input id="name" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="unit">Unit</Label>
              <Input id="unit" {...register("unit")} />
              {errors.unit && <p className="text-sm text-destructive mt-1">{errors.unit.message}</p>}
            </div>

            <div>
              <Label htmlFor="unit_cost">Unit Cost (KES)</Label>
              <Input
                id="unit_cost"
                type="number"
                step="0.01"
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
                {...register("reorder_level")}
              />
              {errors.reorder_level && (
                <p className="text-sm text-destructive mt-1">{errors.reorder_level.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="supplier">Supplier (Optional)</Label>
            <Input id="supplier" {...register("supplier")} />
            {errors.supplier && <p className="text-sm text-destructive mt-1">{errors.supplier.message}</p>}
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Updating..." : "Update Item"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
