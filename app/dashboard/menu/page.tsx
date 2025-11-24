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
  const [deletingCategory, setDeletingCategory] = useState<MenuCategory | null>(null)
  const [activeTabValue, setActiveTabValue] = useState<string>('')

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

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return

    const supabase = getSupabaseClient()

    try {
      // Get all items in this category
      const itemsInCategory = items.filter(i => i.category_id === deletingCategory.id)

      // Delete all items and their recipe ingredients
      if (itemsInCategory.length > 0) {
        const itemIds = itemsInCategory.map(item => item.id)

        // Delete recipe ingredients for all items in this category
        await supabase
          .from("recipe_ingredients")
          .delete()
          .in("menu_item_id", itemIds)

        // Delete all menu items in this category
        await supabase
          .from("menu_items")
          .delete()
          .in("id", itemIds)
      }

      // Delete the category
      const { error } = await supabase
        .from("menu_categories")
        .delete()
        .eq("id", deletingCategory.id)

      if (error) {
        toast({ title: "Error", description: "Failed to delete category", variant: "destructive" })
      } else {
        toast({
          title: "Success",
          description: `Category and ${itemsInCategory.length} item(s) deleted`
        })
        setCategories(categories.filter(c => c.id !== deletingCategory.id))
        setItems(items.filter(i => i.category_id !== deletingCategory.id))
        // Switch to first category if we deleted the active one
        if (activeTabValue === deletingCategory.id && categories.length > 1) {
          setActiveTabValue(categories.filter(c => c.id !== deletingCategory.id)[0].id)
        }
      }
    } catch (error) {
      console.error("Error deleting category:", error)
      toast({ title: "Error", description: "Failed to delete category", variant: "destructive" })
    }

    setDeletingCategory(null)
  }

  // Filter items based on search query (across ALL categories)
  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Set initial active tab
  useEffect(() => {
    if (categories.length > 0 && !activeTabValue) {
      setActiveTabValue(categories[0].id)
    }
  }, [categories, activeTabValue])

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
        <Tabs value={activeTabValue} onValueChange={setActiveTabValue}>
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
                  .filter((item) => searchQuery ? true : item.category_id === category.id)
                  .map((item) => (
                    <ModernMenuCard
                      key={item.id}
                      item={item}
                      onClick={() => setEditingItem(item)}
                      isAdmin={true}
                    />
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
          onItemDeleted={(itemId) => {
            setItems(items.filter(i => i.id !== itemId))
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
          <DialogFooter className="flex-col sm:flex-row gap-2">
            {editingCategory && (
              <Button
                variant="destructive"
                onClick={() => {
                  setDeletingCategory(editingCategory)
                  setShowCategoryDialog(false)
                }}
                className="sm:mr-auto"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Category
              </Button>
            )}
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="outline" onClick={() => setShowCategoryDialog(false)} className="flex-1 sm:flex-none">Cancel</Button>
              <Button onClick={handleCategorySubmit} className="flex-1 sm:flex-none">Save</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Category Confirmation Dialog */}
      <Dialog open={!!deletingCategory} onOpenChange={(open) => !open && setDeletingCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete <span className="font-semibold text-foreground">{deletingCategory?.name}</span>?
            </p>
            {deletingCategory && items.filter(i => i.category_id === deletingCategory.id).length > 0 && (
              <p className="text-sm text-destructive mt-2">
                ⚠️ This will also delete {items.filter(i => i.category_id === deletingCategory.id).length} item(s) in this category.
              </p>
            )}
            <p className="text-sm text-muted-foreground mt-2">
              This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingCategory(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteCategory}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
