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

interface PriceModifier {
  id: string
  name: string
  modifier_type: "percentage" | "fixed_amount"
  modifier_value: number
  start_time?: string
  end_time?: string
  is_active: boolean
}

interface EditPromotionDialogProps {
  promotion: PriceModifier
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EditPromotionDialog({ promotion, open, onOpenChange, onSuccess }: EditPromotionDialogProps) {
  const { toast } = useToast()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const [formData, setFormData] = useState({
    name: promotion.name,
    modifier_type: promotion.modifier_type,
    modifier_value: promotion.modifier_value,
    start_time: promotion.start_time || "",
    end_time: promotion.end_time || "",
    is_active: promotion.is_active,
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.from("price_modifiers").update(formData).eq("id", promotion.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Promotion updated successfully",
      })

      onSuccess()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update promotion",
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
          <DialogTitle>Edit Promotion</DialogTitle>
          <DialogDescription>Update promotion details</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Promotion Name</Label>
            <Input
              id="name"
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
            {loading ? "Updating..." : "Update Promotion"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
