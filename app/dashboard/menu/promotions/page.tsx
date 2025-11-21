"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit2, Trash2 } from "lucide-react"
import { AddPromotionDialog } from "@/components/menu/add-promotion-dialog"
import { EditPromotionDialog } from "@/components/menu/edit-promotion-dialog"

interface PriceModifier {
  id: string
  name: string
  modifier_type: "percentage" | "fixed_amount"
  modifier_value: number
  valid_from?: string
  valid_until?: string
  is_active: boolean
  start_time?: string
  end_time?: string
}

export default function PromotionsPage() {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const [promotions, setPromotions] = useState<PriceModifier[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingPromotion, setEditingPromotion] = useState<PriceModifier | null>(null)

  useEffect(() => {
    fetchPromotions()
  }, [])

  const fetchPromotions = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data, error } = await supabase.from("price_modifiers").select("*").order("name")

      if (error) throw error
      setPromotions(data || [])
    } catch (error) {
      console.error("Error fetching promotions:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this promotion?")) return

    try {
      const { error } = await supabase.from("price_modifiers").delete().eq("id", id)

      if (error) throw error
      setPromotions(promotions.filter((p) => p.id !== id))
    } catch (error) {
      console.error("Error deleting promotion:", error)
    }
  }

  const formatModifierValue = (type: string, value: number) => {
    return type === "percentage" ? `${value}%` : `KES ${value.toFixed(2)}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Promotions & Pricing</h1>
          <p className="text-muted-foreground mt-1">Manage price modifiers and special offers</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Promotion
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Promotions</CardTitle>
          <CardDescription>Special pricing and discounts</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : promotions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No promotions yet. Create one to get started.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Time Range</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promotions.map((promo) => (
                  <TableRow key={promo.id}>
                    <TableCell className="font-medium">{promo.name}</TableCell>
                    <TableCell className="capitalize">{promo.modifier_type.replace("_", " ")}</TableCell>
                    <TableCell>{formatModifierValue(promo.modifier_type, promo.modifier_value)}</TableCell>
                    <TableCell>
                      {promo.start_time && promo.end_time ? (
                        <span className="text-sm">
                          {promo.start_time} - {promo.end_time}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">All day</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {promo.is_active ? <Badge>Active</Badge> : <Badge variant="outline">Inactive</Badge>}
                    </TableCell>
                    <TableCell className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setEditingPromotion(promo)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(promo.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AddPromotionDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={() => {
          fetchPromotions()
          setShowAddDialog(false)
        }}
      />

      {editingPromotion && (
        <EditPromotionDialog
          promotion={editingPromotion}
          open={!!editingPromotion}
          onOpenChange={() => setEditingPromotion(null)}
          onSuccess={() => {
            fetchPromotions()
            setEditingPromotion(null)
          }}
        />
      )}
    </div>
  )
}
