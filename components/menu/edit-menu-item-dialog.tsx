"use client"

import { useState, useEffect } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trash2 } from "lucide-react"
import type { MenuCategory, MenuItem, InventoryItem, RecipeIngredient } from "@/lib/types"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { logMenuItemUpdated, logMenuItemDeleted } from "@/lib/activity-logger"

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
  available: z.boolean().default(true),
  image_url: z.string().optional(),
})

type MenuItemFormValues = z.infer<typeof menuItemSchema>

interface EditMenuItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: MenuItem
  categories: MenuCategory[]
  onItemUpdated: (item: MenuItem) => void
  onItemDeleted?: (itemId: string) => void
}

export function EditMenuItemDialog({ open, onOpenChange, item, categories, onItemUpdated, onItemDeleted }: EditMenuItemDialogProps) {
  const [loading, setLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [recipeIngredients, setRecipeIngredients] = useState<{ inventory_item_id: string, quantity_required: number }[]>([])
  const [selectedIngredient, setSelectedIngredient] = useState("")
  const [ingredientQuantity, setIngredientQuantity] = useState("1")

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
      name: item.name,
      description: item.description || "",
      price: item.price,
      cost_price: item.cost_price || 0,
      categoryId: item.category_id,
      prepTime: item.prep_time_minutes,
      isVegan: item.is_vegan,
      isSpicy: item.is_spicy,
      isDailySpecial: item.is_daily_special,
      available: item.available,
      image_url: item.image_url || "",
    },
  })

  const categoryId = watch("categoryId")

  useEffect(() => {
    if (open) {
      fetchInventoryItems()
      fetchRecipeIngredients()
    }
  }, [open, item.id])

  useEffect(() => {
    if (item) {
      reset({
        name: item.name,
        description: item.description || "",
        price: item.price,
        cost_price: item.cost_price || 0,
        categoryId: item.category_id,
        prepTime: item.prep_time_minutes,
        isVegan: item.is_vegan,
        isSpicy: item.is_spicy,
        isDailySpecial: item.is_daily_special,
        available: item.available,
        image_url: item.image_url || "",
      })
    }
  }, [item, reset])

  const fetchInventoryItems = async () => {
    const supabase = getSupabaseClient()
    const { data } = await supabase
      .from("inventory_items")
      .select("*")
      .order("name")
    if (data) setInventoryItems(data)
  }

  const fetchRecipeIngredients = async () => {
    const supabase = getSupabaseClient()
    const { data } = await supabase
      .from("recipe_ingredients")
      .select("inventory_item_id, quantity_required")
      .eq("menu_item_id", item.id)
    if (data) setRecipeIngredients(data)
  }

  const addIngredient = () => {
    if (!selectedIngredient || !ingredientQuantity) return
    const qty = parseFloat(ingredientQuantity)
    if (qty <= 0) return

    setRecipeIngredients(prev => {
      const existing = prev.find(r => r.inventory_item_id === selectedIngredient)
      if (existing) {
        return prev.map(r => r.inventory_item_id === selectedIngredient ? { ...r, quantity_required: qty } : r)
      }
      return [...prev, { inventory_item_id: selectedIngredient, quantity_required: qty }]
    })
    setSelectedIngredient("")
    setIngredientQuantity("1")
  }

  const removeIngredient = (inventoryItemId: string) => {
    setRecipeIngredients(prev => prev.filter(r => r.inventory_item_id !== inventoryItemId))
  }

  const onSubmit = async (data: MenuItemFormValues) => {
    setLoading(true)
    const supabase = getSupabaseClient()

    try {
      // Update menu item
      const { data: updatedItem, error } = await supabase
        .from("menu_items")
        .update({
          name: data.name,
          description: data.description,
          price: data.price,
          cost_price: data.cost_price,
          category_id: data.categoryId,
          prep_time_minutes: data.prepTime,
          is_vegan: data.isVegan,
          is_spicy: data.isSpicy,
          is_daily_special: data.isDailySpecial,
          available: data.available,
          image_url: data.image_url || null,
        })
        .eq("id", item.id)
        .select()
        .single()

      if (error) throw error

      // Update recipe ingredients
      // Delete existing
      await supabase.from("recipe_ingredients").delete().eq("menu_item_id", item.id)

      // Insert new ones
      if (recipeIngredients.length > 0) {
        const { data: { user } } = await supabase.auth.getUser()
        const { data: staff } = await supabase.from("staff").select("restaurant_id").eq("user_id", user?.id).single()

        await supabase.from("recipe_ingredients").insert(
          recipeIngredients.map(r => ({
            restaurant_id: staff?.restaurant_id,
            menu_item_id: item.id,
            inventory_item_id: r.inventory_item_id,
            quantity_required: r.quantity_required
          }))
        )
      }

      if (updatedItem) {
        // Calculate changes for logging
        const changes: string[] = []
        if (item.name !== data.name) changes.push(`Name: ${item.name} -> ${data.name}`)
        if (item.price !== data.price) changes.push(`Price: ${item.price} -> ${data.price}`)
        if (item.available !== data.available) changes.push(`Availability: ${item.available} -> ${data.available}`)
        if (item.category_id !== data.categoryId) changes.push('Category changed')
        if (item.is_daily_special !== data.isDailySpecial) changes.push(`Daily Special: ${item.is_daily_special} -> ${data.isDailySpecial}`)

        if (changes.length > 0) {
          await logMenuItemUpdated({
            itemId: item.id,
            itemName: item.name,
            changes,
            restaurantId: item.restaurant_id
          })
        }

        onItemUpdated(updatedItem as MenuItem)
        onOpenChange(false)
      }
    } catch (error) {
      console.error("Error updating menu item:", error)
    }

    setLoading(false)
  }

  const handleDelete = async () => {
    setLoading(true)
    const supabase = getSupabaseClient()

    try {
      // Delete recipe ingredients first
      await supabase.from("recipe_ingredients").delete().eq("menu_item_id", item.id)

      // Delete menu item
      const { error } = await supabase
        .from("menu_items")
        .delete()
        .eq("id", item.id)

      if (error) throw error

      // Log activity
      await logMenuItemDeleted({
        itemId: item.id,
        itemName: item.name,
        restaurantId: item.restaurant_id
      })

      if (onItemDeleted) {
        onItemDeleted(item.id)
      }
      setShowDeleteConfirm(false)
      onOpenChange(false)
    } catch (error) {
      console.error("Error deleting menu item:", error)
    }

    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Menu Item</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="recipe">Recipe & Ingredients</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4 pt-4">
              <div>
                <Label htmlFor="name">Item Name</Label>
                <Input id="name" {...register("name")} />
                {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" {...register("description")} />
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={categoryId} onValueChange={(value) => setValue("categoryId", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.categoryId && <p className="text-sm text-destructive mt-1">{errors.categoryId.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Price (KES)</Label>
                  <Input
                    id="price"
                    type="number"
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

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isVegan"
                    checked={watch("isVegan")}
                    onCheckedChange={(checked) => setValue("isVegan", checked as boolean)}
                  />
                  <Label htmlFor="isVegan">Vegan</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isSpicy"
                    checked={watch("isSpicy")}
                    onCheckedChange={(checked) => setValue("isSpicy", checked as boolean)}
                  />
                  <Label htmlFor="isSpicy">Spicy</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isDailySpecial"
                    checked={watch("isDailySpecial")}
                    onCheckedChange={(checked) => setValue("isDailySpecial", checked as boolean)}
                  />
                  <Label htmlFor="isDailySpecial" className="text-red-500 font-medium">
                    Daily Special 🔥
                  </Label>
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <Switch
                    id="available"
                    checked={watch("available")}
                    onCheckedChange={(checked) => setValue("available", checked)}
                  />
                  <Label htmlFor="available">Available on Menu</Label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="recipe" className="space-y-4 pt-4">
              <div className="bg-muted/30 p-4 rounded-lg border">
                <h3 className="font-semibold mb-2">Recipe Management</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Link inventory items to this menu item. When sold, these ingredients will be automatically deducted from stock.
                </p>

                <div className="space-y-3 mb-6">
                  {recipeIngredients.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                      No ingredients linked yet.
                    </div>
                  ) : (
                    recipeIngredients.map((recipe) => {
                      const invItem = inventoryItems.find(i => i.id === recipe.inventory_item_id)
                      return (
                        <div key={recipe.inventory_item_id} className="flex items-center justify-between p-3 bg-card border rounded-lg shadow-sm">
                          <div>
                            <span className="font-medium">{invItem?.name}</span>
                            <div className="text-sm text-muted-foreground">
                              Requires: <strong>{recipe.quantity_required}</strong> {invItem?.unit}
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => removeIngredient(recipe.inventory_item_id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )
                    })
                  )}
                </div>

                <div className="flex gap-2 items-end border-t pt-4">
                  <div className="flex-1 space-y-2">
                    <Label>Ingredient</Label>
                    <Select value={selectedIngredient} onValueChange={setSelectedIngredient}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select ingredient..." />
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
                  <div className="w-24 space-y-2">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={ingredientQuantity}
                      onChange={(e) => setIngredientQuantity(e.target.value)}
                      min="0"
                      step="0.001"
                    />
                  </div>
                  <Button type="button" onClick={addIngredient} disabled={!selectedIngredient}>
                    Add
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t mt-4">
            <Button
              type="button"
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
              className="sm:mr-auto"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Item
            </Button>
            <div className="flex gap-2 flex-1">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Menu Item</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete <span className="font-semibold text-foreground">{item.name}</span>?
            </p>
            <p className="text-sm text-destructive mt-2">
              ⚠️ This action cannot be undone. All recipe ingredients will also be removed.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              {loading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
