"use client"

import type React from "react"

import { useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

interface AddStationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function AddStationDialog({ open, onOpenChange, onSuccess }: AddStationDialogProps) {
  const { toast } = useToast()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const [formData, setFormData] = useState({
    name: "",
    station_type: "general",
    max_active_orders: 5,
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { data: staffData } = await supabase.from("staff").select("restaurant_id").eq("id", user.id).single()

      const { error } = await supabase.from("kitchen_stations").insert({
        restaurant_id: staffData?.restaurant_id,
        ...formData,
      })

      if (error) throw error

      toast({
        title: "Success",
        description: "Kitchen station added successfully",
      })

      onSuccess()
      setFormData({
        name: "",
        station_type: "general",
        max_active_orders: 5,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add station",
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
          <DialogTitle>Add Kitchen Station</DialogTitle>
          <DialogDescription>Create a new kitchen workstation</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Station Name</Label>
            <Input
              id="name"
              placeholder="e.g., Grill 1, Fryer, Prep"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="station_type">Station Type</Label>
            <Select
              value={formData.station_type}
              onValueChange={(value) => setFormData({ ...formData, station_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="grill">Grill</SelectItem>
                <SelectItem value="fryer">Fryer</SelectItem>
                <SelectItem value="prep">Prep</SelectItem>
                <SelectItem value="dessert">Dessert</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="max_active_orders">Max Active Orders</Label>
            <Input
              id="max_active_orders"
              type="number"
              min="1"
              value={formData.max_active_orders}
              onChange={(e) => setFormData({ ...formData, max_active_orders: Number.parseInt(e.target.value) || 5 })}
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Adding..." : "Add Station"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
