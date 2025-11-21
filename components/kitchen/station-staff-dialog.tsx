"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"

interface KitchenStation {
  id: string
  name: string
}

interface StaffMember {
  id: string
  first_name: string
  last_name: string
  assigned: boolean
}

interface StationStaffDialogProps {
  station: KitchenStation
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function StationStaffDialog({ station, open, onOpenChange, onSuccess }: StationStaffDialogProps) {
  const { toast } = useToast()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStaff()
  }, [])

  const fetchStaff = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: staffData } = await supabase.from("staff").select("id, first_name, last_name").eq("role", "kitchen")

      const { data: assignedData } = await supabase
        .from("kitchen_staff_assignments")
        .select("staff_id")
        .eq("kitchen_station_id", station.id)

      const assignedIds = new Set(assignedData?.map((d) => d.staff_id) || [])

      const staffWithStatus = (staffData || []).map((s) => ({
        ...s,
        assigned: assignedIds.has(s.id),
      }))

      setStaff(staffWithStatus)
    } catch (error) {
      console.error("Error fetching staff:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStaff = async (staffId: string, isAssigned: boolean) => {
    try {
      if (isAssigned) {
        await supabase
          .from("kitchen_staff_assignments")
          .delete()
          .eq("staff_id", staffId)
          .eq("kitchen_station_id", station.id)
      } else {
        await supabase.from("kitchen_staff_assignments").insert({
          staff_id: staffId,
          kitchen_station_id: station.id,
        })
      }

      setStaff(staff.map((s) => (s.id === staffId ? { ...s, assigned: !isAssigned } : s)))
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update staff assignment",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Staff to {station.name}</DialogTitle>
          <DialogDescription>Select kitchen staff to work at this station</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : staff.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No kitchen staff available</div>
        ) : (
          <div className="space-y-3">
            {staff.map((member) => (
              <div key={member.id} className="flex items-center gap-3">
                <Checkbox
                  id={member.id}
                  checked={member.assigned}
                  onCheckedChange={() => handleToggleStaff(member.id, member.assigned)}
                />
                <label htmlFor={member.id} className="cursor-pointer flex-1">
                  {member.first_name} {member.last_name}
                </label>
              </div>
            ))}
          </div>
        )}

        <Button type="button" onClick={onSuccess} className="w-full">
          Done
        </Button>
      </DialogContent>
    </Dialog>
  )
}
