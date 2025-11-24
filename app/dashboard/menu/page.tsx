"use client"

import { useEffect, useState } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Circle, Plus, Edit2, Trash2, MoveVertical, Eye, EyeOff } from "lucide-react"
import Image from "next/image"
import { AddMenuItemDialog } from "@/components/menu/add-menu-item-dialog"
import { EditMenuItemDialog } from "@/components/menu/edit-menu-item-dialog"
import type { MenuCategory, MenuItem } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

export default function MenuPage() {
  const { toast } = useToast()
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [showCategoryDialog, setShowCategoryDialog] = useState(false)
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null)
  const [categoryFormName, setCategoryFormName] = useState("")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const supabase = getSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { data: staff } = await supabase.from("staff").select("restaurant_id").eq("user_id", user.id).single()

    if (staff?.restaurant_id) {
      setRestaurantId(staff.restaurant_id)
      await Promise.all([fetchCategories(staff.restaurant_id), fetchItems(staff.restaurant_id)])
    }
    setLoading(false)
  }

  const fetchCategories = async (resId: string) => {
    const supabase = getSupabaseClient()
    const { data } = await supabase
      .from("menu_categories")
      .select("*")
      .eq("restaurant_id", resId)
      .order("display_order", { ascending: true })

    if (data) setCategories(data)
  }

  const fetchItems = async (resId: string) => {
    const supabase = getSupabaseClient()
    const { data } = await supabase
      .from("menu_items")
      .select("*")
      .eq("restaurant_id", resId)
      .order("name")

    if (data) setItems(data)
  }

  const handleCategorySubmit = async () => {
    if (!restaurantId || !categoryFormName.trim()) return

    const supabase = getSupabaseClient()

    if (editingCategory) {
      const { error } = await supabase
        .from("menu_categories")
        .update({ name: categoryFormName.trim() })
        .eq("id", editingCategory.id)

      if (error) {
        toast({ title: "Error", description: "Failed to update category", variant: "destructive" })
      } else {
        toast({ title: "Success", description: "Category updated" })
        fetchCategories(restaurantId)
      }
    } else {
      const { error } = await supabase
        .from("menu_categories")
        .insert({
          restaurant_id: restaurantId,
          name: categoryFormName.trim(),
          display_order: categories.length + 1,
          is_visible: true
        })

      if (error) {
        toast({ title: "Error", description: "Failed to create category", variant: "destructive" })
      } else {
        toast({ title: "Success", description: "Category created" })
        fetchCategories(restaurantId)
      }
    }
    setShowCategoryDialog(false)
    setEditingCategory(null)
    setCategoryFormName("")
  }

  const toggleCategoryVisibility = async (category: MenuCategory) => {
    const supabase = getSupabaseClient()
    const { error } = await supabase
      .from("menu_categories")
      .update({ is_visible: !category.is_visible })
      .eq("id", category.id)

    if (!error) {
      setCategories(categories.map(c => c.id === category.id ? { ...c, is_visible: !c.is_visible } : c))
    }
  }

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) return <div className="p-6">Loading...</div>

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Menu Management</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">Manage categories and items for your menu</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={() => {
              setEditingCategory(null)
              setCategoryFormName("")
              setShowCategoryDialog(true)
            }}
            className="flex-1 sm:flex-none"
          >
            Manage Categories
          </Button>
          <Button
            onClick={() => setShowAddDialog(true)}
            className="gap-2 flex-1 sm:flex-none"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Item</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      <div className="mb-4">
        <Input
          placeholder="Search menu items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:max-w-md"
        />
      </div>

      {categories.length > 0 ? (
        <Tabs defaultValue={categories[0]?.id}>
          <TabsList className="w-full justify-start overflow-x-auto">
            {categories.map((category) => {
              const count = filteredItems.filter((i) => i.category_id === category.id).length
              return (
                <TabsTrigger key={category.id} value={category.id} className="gap-2">
                  {category.name}
                  <span className="text-xs bg-muted px-1.5 rounded-full">{count}</span>
                  {!category.is_visible && <EyeOff className="h-3 w-3 text-muted-foreground" />}
                </TabsTrigger>
              )
            })}
          </TabsList>

          {categories.map((category) => (
            <TabsContent key={category.id} value={category.id} className="mt-4 md:mt-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 mb-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  <h2 className="text-lg sm:text-xl font-semibold">{category.name}</h2>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                    <Switch
                      checked={category.is_visible}
                      onCheckedChange={() => toggleCategoryVisibility(category)}
                    />
                    <Label>Visible on POS</Label>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingCategory(category)
                    setCategoryFormName(category.name)
                    setShowCategoryDialog(true)
                  }}
                  className="w-full sm:w-auto"
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit Category
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredItems
                  .filter((item) => item.category_id === category.id)
                  .map((item) => (
                    <Card key={item.id} className={`relative ${!item.available ? 'opacity-60' : ''}`}>
                      {item.image_url && (
                        <div className="relative w-full h-48 overflow-hidden rounded-t-lg">
                          <Image
                            src={item.image_url}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                        </div>
                      )}
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-lg">{item.name}</CardTitle>
                              {item.is_daily_special && (
                                <Badge variant="destructive" className="text-[10px] h-5">Special</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                          </div>
                          <Circle
                            size={12}
                            className={`mt-1 ${item.available ? "fill-green-500 text-green-500" : "fill-gray-400 text-gray-400"}`}
                          />
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-lg">KES {item.price}</span>
                          {item.prep_time_minutes > 0 && (
                            <span className="text-xs text-muted-foreground">{item.prep_time_minutes}min</span>
                          )}
                        </div>
                        <div className="flex gap-1 flex-wrap">
                          {item.is_vegan && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Vegan</span>
                          )}
                          {item.is_spicy && (
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">Spicy</span>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full gap-2"
                          onClick={() => setEditingItem(item)}
                        >
                          <Edit2 className="h-3 w-3" />
                          Edit Item
                        </Button>
                      </CardContent>
                    </Card>
                  ))}

                {filteredItems.filter((item) => item.category_id === category.id).length === 0 && (
                  <div className="col-span-full text-center py-12 border-2 border-dashed rounded-lg text-muted-foreground">
                    No items in this category.
                    <Button variant="link" onClick={() => setShowAddDialog(true)}>Add your first item</Button>
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground py-12">
            <p className="mb-4">No categories defined yet.</p>
            <Button onClick={() => {
              setEditingCategory(null)
              setCategoryFormName("")
              setShowCategoryDialog(true)
            }}>
              Create First Category
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add Item Dialog */}
      {restaurantId && (
        <AddMenuItemDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          restaurantId={restaurantId}
          categories={categories}
          onItemAdded={(newItem) => {
            setItems([...items, newItem])
            // Also refresh categories in case a new one was created
            fetchCategories(restaurantId)
          }}
          onCategoryCreated={(newCat) => setCategories([...categories, newCat])}
        />
      )}

      {/* Edit Item Dialog */}
      {editingItem && (
        <EditMenuItemDialog
          open={!!editingItem}
          onOpenChange={(open) => !open && setEditingItem(null)}
          item={editingItem}
          categories={categories}
          onItemUpdated={(updatedItem) => {
            setItems(items.map(i => i.id === updatedItem.id ? updatedItem : i))
            setEditingItem(null)
          }}
        />
      )}

      {/* Category Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Category" : "New Category"}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="catName">Category Name</Label>
            <Input
              id="catName"
              value={categoryFormName}
              onChange={(e) => setCategoryFormName(e.target.value)}
              placeholder="e.g., Breakfast"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCategoryDialog(false)}>Cancel</Button>
            <Button onClick={handleCategorySubmit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
