"use client"

import type React from "react"

import { useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"

interface KitchenStation {
  id: string
  name: string
  station_type: string
  max_active_orders: number
  is_active: boolean
}

interface EditStationDialogProps {
  station: KitchenStation
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EditStationDialog({ station, open, onOpenChange, onSuccess }: EditStationDialogProps) {
  const { toast } = useToast()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const [formData, setFormData] = useState({
    name: station.name,
    station_type: station.station_type,
    max_active_orders: station.max_active_orders,
    is_active: station.is_active,
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.from("kitchen_stations").update(formData).eq("id", station.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Station updated successfully",
      })

      onSuccess()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update station",
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
          <DialogTitle>Edit Kitchen Station</DialogTitle>
          <DialogDescription>Update station configuration</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Station Name</Label>
            <Input
              id="name"
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

          <div className="flex items-center gap-2">
            <Checkbox
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked as boolean })}
            />
            <Label htmlFor="is_active" className="cursor-pointer">
              Station is active
            </Label>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Updating..." : "Update Station"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
