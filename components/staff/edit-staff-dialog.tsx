"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { getSupabaseClient } from "@/lib/supabase/client"
import { hashPin } from "@/lib/auth-helpers"
import { useToast } from "@/hooks/use-toast"
import type { StaffMember } from "@/lib/types"

interface EditStaffDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    staff: StaffMember
    onSuccess: () => void
}

export function EditStaffDialog({ open, onOpenChange, staff, onSuccess }: EditStaffDialogProps) {
    const { toast } = useToast()
    const [loading, setLoading] = useState(false)
    const [firstName, setFirstName] = useState(staff.first_name || "")
    const [lastName, setLastName] = useState(staff.last_name || "")
    const [role, setRole] = useState(staff.role)
    const [phone, setPhone] = useState(staff.phone || "")
    const [email, setEmail] = useState(staff.email || "")
    const [active, setActive] = useState(staff.active)
    const [resetPin, setResetPin] = useState(false)
    const [newPin, setNewPin] = useState("")
    const [confirmPin, setConfirmPin] = useState("")

    useEffect(() => {
        setFirstName(staff.first_name || "")
        setLastName(staff.last_name || "")
        setRole(staff.role)
        setPhone(staff.phone || "")
        setEmail(staff.email || "")
        setActive(staff.active)
        setResetPin(false)
        setNewPin("")
        setConfirmPin("")
    }, [staff])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (resetPin) {
            if (newPin.length !== 4 || !/^\d+$/.test(newPin)) {
                toast({
                    title: "Invalid PIN",
                    description: "PIN must be exactly 4 digits.",
                    variant: "destructive",
                })
                return
            }
            if (newPin !== confirmPin) {
                toast({
                    title: "PIN Mismatch",
                    description: "PINs don't match.",
                    variant: "destructive",
                })
                return
            }
        }

        setLoading(true)
        const supabase = getSupabaseClient()

        try {
            const updateData: any = {
                first_name: firstName,
                last_name: lastName,
                role,
                phone: phone || null,
                email: email || null,
                active
            }

            if (resetPin) {
                updateData.pin_hash = await hashPin(newPin)
            }

            const { error } = await supabase
                .from("staff")
                .update(updateData)
                .eq("id", staff.id)

            if (error) throw error

            toast({
                title: "Staff Updated",
                description: `${firstName} ${lastName} has been updated successfully.`,
            })

            onSuccess()
            onOpenChange(false)
        } catch (error: any) {
            console.error("Error updating staff:", error)
            toast({
                title: "Error",
                description: error.message || "Failed to update staff member.",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Edit Staff Member</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">First Name</Label>
                            <Input
                                id="firstName"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input
                                id="lastName"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Select value={role} onValueChange={(value: any) => setRole(value)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="manager">Manager (Full Access)</SelectItem>
                                <SelectItem value="cashier">Cashier/Waiter</SelectItem>
                                <SelectItem value="kitchen">Kitchen Staff</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                            id="phone"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center space-x-2">
                        <Switch
                            id="active"
                            checked={active}
                            onCheckedChange={setActive}
                        />
                        <Label htmlFor="active">Active</Label>
                    </div>

                    <div className="border-t pt-4">
                        <div className="flex items-center space-x-2 mb-3">
                            <Switch
                                id="resetPin"
                                checked={resetPin}
                                onCheckedChange={setResetPin}
                            />
                            <Label htmlFor="resetPin">Reset PIN</Label>
                        </div>

                        {resetPin && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="newPin">New PIN</Label>
                                    <Input
                                        id="newPin"
                                        type="password"
                                        maxLength={4}
                                        placeholder="1234"
                                        value={newPin}
                                        onChange={(e) => setNewPin(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirmPin">Confirm PIN</Label>
                                    <Input
                                        id="confirmPin"
                                        type="password"
                                        maxLength={4}
                                        placeholder="1234"
                                        value={confirmPin}
                                        onChange={(e) => setConfirmPin(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
