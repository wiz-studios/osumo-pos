"use client"

import type React from "react"

import { useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

interface TimeAvailability {
  id: string
  menu_item_id: string
  day_of_week: number
  available_from: string
  available_until: string
  is_available: boolean
}

interface MenuItem {
  id: string
  name: string
}

interface EditAvailabilityDialogProps {
  availability: TimeAvailability
  menuItems: MenuItem[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EditAvailabilityDialog({
  availability,
  menuItems,
  open,
  onOpenChange,
  onSuccess,
}: EditAvailabilityDialogProps) {
  const { toast } = useToast()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const [formData, setFormData] = useState({
    available_from: availability.available_from,
    available_until: availability.available_until,
    is_available: availability.is_available,
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.from("menu_item_time_availability").update(formData).eq("id", availability.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Availability updated successfully",
      })

      onSuccess()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update availability",
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
          <DialogTitle>Edit Availability</DialogTitle>
          <DialogDescription>Set availability for {DAYS[availability.day_of_week]}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="available_from">Available From</Label>
              <Input
                id="available_from"
                type="time"
                value={formData.available_from}
                onChange={(e) => setFormData({ ...formData, available_from: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="available_until">Available Until</Label>
              <Input
                id="available_until"
                type="time"
                value={formData.available_until}
                onChange={(e) => setFormData({ ...formData, available_until: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="is_available"
              checked={formData.is_available}
              onCheckedChange={(checked) => setFormData({ ...formData, is_available: checked as boolean })}
            />
            <Label htmlFor="is_available" className="cursor-pointer">
              Item is available during these hours
            </Label>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Updating..." : "Update Availability"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
