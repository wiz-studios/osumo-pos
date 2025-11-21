"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EditAvailabilityDialog } from "@/components/menu/edit-availability-dialog"

interface MenuItem {
  id: string
  name: string
  category: string
}

interface TimeAvailability {
  id: string
  menu_item_id: string
  day_of_week: number
  available_from: string
  available_until: string
  is_available: boolean
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

export default function AvailabilityPage() {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [availabilities, setAvailabilities] = useState<TimeAvailability[]>([])
  const [loading, setLoading] = useState(true)
  const [editingItem, setEditingItem] = useState<TimeAvailability | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data: items, error: itemsError } = await supabase
        .from("menu_items")
        .select("id, name, category:categories(name)")

      const { data: avail, error: availError } = await supabase.from("menu_item_time_availability").select("*")

      if (itemsError || availError) throw itemsError || availError

      setMenuItems(items || [])
      setAvailabilities(avail || [])
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Menu Availability</h1>
        <p className="text-muted-foreground mt-1">Set time-based availability for menu items</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Time-Based Availability</CardTitle>
          <CardDescription>Control when items are available (e.g., breakfast until 11am)</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : availabilities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No availability rules set. Click edit on menu items to configure.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Day</TableHead>
                  <TableHead>Available From</TableHead>
                  <TableHead>Available Until</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {availabilities.map((avail) => {
                  const item = menuItems.find((m) => m.id === avail.menu_item_id)
                  return (
                    <TableRow key={avail.id}>
                      <TableCell className="font-medium">{item?.name}</TableCell>
                      <TableCell>{DAYS[avail.day_of_week]}</TableCell>
                      <TableCell>{avail.available_from}</TableCell>
                      <TableCell>{avail.available_until}</TableCell>
                      <TableCell>
                        {avail.is_available ? (
                          <Badge>Available</Badge>
                        ) : (
                          <Badge variant="destructive">Unavailable</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <button onClick={() => setEditingItem(avail)} className="text-sm text-primary hover:underline">
                          Edit
                        </button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {editingItem && (
        <EditAvailabilityDialog
          availability={editingItem}
          menuItems={menuItems}
          open={!!editingItem}
          onOpenChange={() => setEditingItem(null)}
          onSuccess={() => {
            fetchData()
            setEditingItem(null)
          }}
        />
      )}
    </div>
  )
}
