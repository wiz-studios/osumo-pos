"use client"

import { useState, useEffect } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import type { MenuCategory, MenuItem } from "@/lib/types"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

const menuItemSchema = z.object({
  name: z.string().min(1, "Name is required").max(30, "Name must be 30 characters or less"),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Price must be non-negative"),
  cost_price: z.coerce.number().min(0, "Cost price must be non-negative").optional(),
  categoryId: z.string().min(1, "Category is required"),
  prepTime: z.coerce.number().min(0).optional(),
  isVegan: z.boolean().default(false),
  isSpicy: z.boolean().default(false),
  isDailySpecial: z.boolean().default(false),
  image_url: z.string().optional(),
})

type MenuItemFormValues = z.infer<typeof menuItemSchema>

interface AddMenuItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  restaurantId: string
  categories: MenuCategory[]
  onItemAdded: (item: MenuItem) => void
  onCategoryCreated?: (category: MenuCategory) => void
}

export function AddMenuItemDialog({
  open,
  onOpenChange,
  restaurantId,
  categories,
  onItemAdded,
  onCategoryCreated,
}: AddMenuItemDialogProps) {
  const [loading, setLoading] = useState(false)
  const [creatingCategory, setCreatingCategory] = useState(false)
  const [localCategories, setLocalCategories] = useState<MenuCategory[]>(categories)
  const [newCategoryName, setNewCategoryName] = useState("")

  useEffect(() => {
    setLocalCategories(categories)
  }, [categories])

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MenuItemFormValues>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      cost_price: 0,
      categoryId: "",
      prepTime: 15,
      isVegan: false,
      isSpicy: false,
      isDailySpecial: false,
      image_url: "",
    },
  })

  const categoryId = watch("categoryId")

  const handleCreateDefaultCategory = async () => {
    if (!restaurantId) return
    setCreatingCategory(true)
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from("menu_categories")
      .insert({
        restaurant_id: restaurantId,
        name: "General",
        display_order:
          (localCategories.reduce((max, c) => Math.max(max, (c as any).display_order ?? 0), 0) || 0) + 1,
        is_visible: true,
      })
      .select()
      .single()

    if (!error && data) {
      const created = data as MenuCategory
      setLocalCategories([...localCategories, created])
      setValue("categoryId", created.id)
      onCategoryCreated?.(created)
    }
    setCreatingCategory(false)
  }

  const handleCreateNamedCategory = async () => {
    if (!restaurantId || !newCategoryName.trim()) return
    setCreatingCategory(true)
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from("menu_categories")
      .insert({
        restaurant_id: restaurantId,
        name: newCategoryName.trim(),
        display_order:
          (localCategories.reduce((max, c) => Math.max(max, (c as any).display_order ?? 0), 0) || 0) + 1,
        is_visible: true,
      })
      .select()
      .single()

    if (!error && data) {
      const created = data as MenuCategory
      setLocalCategories([...localCategories, created])
      setValue("categoryId", created.id)
      onCategoryCreated?.(created)
      setNewCategoryName("")
    }
    setCreatingCategory(false)
  }

  const onSubmit = async (data: MenuItemFormValues) => {
    setLoading(true)
    const supabase = getSupabaseClient()

    const { data: newItem, error } = await supabase
      .from("menu_items")
      .insert({
        restaurant_id: restaurantId,
        category_id: data.categoryId,
        name: data.name,
        description: data.description,
        price: data.price,
        cost_price: data.cost_price,
        prep_time_minutes: data.prepTime,
        is_vegan: data.isVegan,
        is_spicy: data.isSpicy,
        is_daily_special: data.isDailySpecial,
        image_url: data.image_url || null,
        available: true,
      })
      .select()
      .single()

    if (!error && newItem) {
      onItemAdded(newItem as MenuItem)
      reset()
      onOpenChange(false)
    }

    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Menu Item</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Item Name</Label>
            <Input id="name" placeholder="e.g., 1/4 Grilled Chicken" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" placeholder="Item description" {...register("description")} />
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            {localCategories.length === 0 ? (
              <>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">No categories yet.</span>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCreateDefaultCategory}
                    disabled={creatingCategory}
                  >
                    {creatingCategory ? "Creating..." : "Create default (General)"}
                  </Button>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Input
                    placeholder="New category name"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCreateNamedCategory}
                    disabled={creatingCategory || newCategoryName.trim().length === 0}
                  >
                    {creatingCategory ? "Adding..." : "Add category"}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Select value={categoryId} onValueChange={(value) => setValue("categoryId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {localCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.categoryId && (
                  <p className="text-sm text-destructive mt-1">{errors.categoryId.message}</p>
                )}
                <div className="mt-3 flex items-center gap-2">
                  <Input
                    placeholder="New category name"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCreateNamedCategory}
                    disabled={creatingCategory || newCategoryName.trim().length === 0}
                  >
                    {creatingCategory ? "Adding..." : "Add category"}
                  </Button>
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">Price (KES)</Label>
              <Input
                id="price"
                type="number"
                placeholder="0.00"
                step="0.01"
                {...register("price")}
              />
              {errors.price && <p className="text-sm text-destructive mt-1">{errors.price.message}</p>}
            </div>

            <div>
              <Label htmlFor="cost_price">Cost Price (Optional)</Label>
              <Input
                id="cost_price"
                type="number"
                placeholder="0.00"
                step="0.01"
                {...register("cost_price")}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="prepTime">Prep Time (min)</Label>
            <Input id="prepTime" type="number" {...register("prepTime")} />
          </div>

          <div>
            <Label htmlFor="image_url">Image URL (Optional)</Label>
            <Input
              id="image_url"
              placeholder="/images/menu/item-name.jpg"
              {...register("image_url")}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Path to image file in /public/images/menu/ directory
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isVegan"
                onCheckedChange={(checked) => setValue("isVegan", checked as boolean)}
              />
              <Label htmlFor="isVegan">Vegan</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isSpicy"
                onCheckedChange={(checked) => setValue("isSpicy", checked as boolean)}
              />
              <Label htmlFor="isSpicy">Spicy</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isDailySpecial"
                onCheckedChange={(checked) => setValue("isDailySpecial", checked as boolean)}
              />
              <Label htmlFor="isDailySpecial" className="text-red-500 font-medium">
                Daily Special 🔥
              </Label>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Adding..." : "Add Item"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
