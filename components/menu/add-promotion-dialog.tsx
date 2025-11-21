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

interface AddPromotionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function AddPromotionDialog({ open, onOpenChange, onSuccess }: AddPromotionDialogProps) {
  const { toast } = useToast()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const [formData, setFormData] = useState({
    name: "",
    modifier_type: "percentage" as "percentage" | "fixed_amount",
    modifier_value: 0,
    start_time: "",
    end_time: "",
    valid_from: "",
    valid_until: "",
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

      const { error } = await supabase.from("price_modifiers").insert({
        restaurant_id: staffData?.restaurant_id,
        ...formData,
        is_active: true,
      })

      if (error) throw error

      toast({
        title: "Success",
        description: "Promotion added successfully",
      })

      onSuccess()
      setFormData({
        name: "",
        modifier_type: "percentage",
        modifier_value: 0,
        start_time: "",
        end_time: "",
        valid_from: "",
        valid_until: "",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add promotion",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Promotion</DialogTitle>
          <DialogDescription>Create a new price modifier or special offer</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Promotion Name</Label>
            <Input
              id="name"
              placeholder="e.g., Happy Hour, Weekend Special"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="modifier_type">Modifier Type</Label>
            <Select
              value={formData.modifier_type}
              onValueChange={(value) =>
                setFormData({ ...formData, modifier_type: value as "percentage" | "fixed_amount" })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Percentage Discount</SelectItem>
                <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="modifier_value">
              {formData.modifier_type === "percentage" ? "Discount %" : "Discount (KES)"}
            </Label>
            <Input
              id="modifier_value"
              type="number"
              step="0.01"
              placeholder="0"
              value={formData.modifier_value}
              onChange={(e) => setFormData({ ...formData, modifier_value: Number.parseFloat(e.target.value) || 0 })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_time">Start Time (Optional)</Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="end_time">End Time (Optional)</Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
              />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Adding..." : "Add Promotion"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
