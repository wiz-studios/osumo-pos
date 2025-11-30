"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getSupabaseClient } from "@/lib/supabase/client"
import { hashPin } from "@/lib/auth-helpers"
import { useToast } from "@/hooks/use-toast"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { logStaffCreated } from "@/lib/activity-logger"

const staffSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    role: z.enum(["manager", "cashier", "kitchen", "waiter"]),
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal("")),
    pin: z.string().length(4, "PIN must be exactly 4 digits").regex(/^\d+$/, "PIN must contain only numbers"),
    confirmPin: z.string()
}).refine((data) => data.pin === data.confirmPin, {
    message: "PINs don't match",
    path: ["confirmPin"],
})

type StaffFormValues = z.infer<typeof staffSchema>

interface AddStaffDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function AddStaffDialog({ open, onOpenChange, onSuccess }: AddStaffDialogProps) {
    const { toast } = useToast()
    const [loading, setLoading] = useState(false)

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors },
    } = useForm<StaffFormValues>({
        resolver: zodResolver(staffSchema),
        defaultValues: {
            role: "cashier"
        }
    })

    const role = watch("role")

    const onSubmit = async (data: StaffFormValues) => {
        setLoading(true)
        const supabase = getSupabaseClient()

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Not authenticated")

            // Use RPC to get restaurant ID to avoid RLS issues
            const { data: restaurantId, error: rpcError } = await supabase
                .rpc('get_my_restaurant_id')

            if (rpcError) {
                console.error("RPC Error getting restaurant ID:", rpcError)
                throw new Error("Failed to retrieve restaurant information")
            }

            if (!restaurantId) {
                console.error("No restaurant ID returned for user:", user.id)
                throw new Error("Restaurant not found. Please contact support.")
            }

            // Hash the PIN
            let pinHash;
            try {
                pinHash = await hashPin(data.pin)
            } catch (hashError) {
                console.error("Error hashing PIN:", hashError)
                throw new Error("Failed to secure PIN. Please try again.")
            }

            // For PIN-only staff, we leave user_id as null
            // The database schema must be updated to allow nullable user_id

            const { error } = await supabase.from("staff").insert({
                user_id: null,
                restaurant_id: restaurantId,
                first_name: data.firstName,
                last_name: data.lastName,
                role: data.role,
                phone: data.phone || null,
                email: data.email || null,
                pin_hash: pinHash,
                active: true
            })

            if (error) {
                console.error("Supabase Insert Error:", error)
                throw error
            }

            // Log activity
            await logStaffCreated({
                newStaffId: (await supabase.from('staff').select('id').eq('pin_hash', pinHash).single()).data?.id || 'unknown',
                staffName: `${data.firstName} ${data.lastName}`,
                role: data.role,
                restaurantId: restaurantId
            })

            toast({
                title: "Staff Added",
                description: `${data.firstName} ${data.lastName} has been added successfully.`,
            })

            reset()
            onSuccess()
            onOpenChange(false)
        } catch (error: any) {
            console.error("Error adding staff:", error)
            console.error("Error adding staff (stringified):", JSON.stringify(error, null, 2))

            let errorMessage = error.message || "Failed to add staff member."

            // Check for foreign key violation on user_id
            if (error.code === '23503' && error.details?.includes('user_id')) {
                errorMessage = "Database constraint error: The system requires a valid auth user for staff members. This is a known limitation in the current dev environment."
            }

            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive",
            })

            // Fallback alert in case toast doesn't show
            if (errorMessage.includes("Database constraint")) {
                alert(errorMessage)
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Add Staff Member</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">First Name</Label>
                            <Input id="firstName" {...register("firstName")} />
                            {errors.firstName && <p className="text-sm text-destructive">{errors.firstName.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input id="lastName" {...register("lastName")} />
                            {errors.lastName && <p className="text-sm text-destructive">{errors.lastName.message}</p>}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Select value={role} onValueChange={(value) => setValue("role", value as any)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="manager">Manager (Full Access)</SelectItem>
                                <SelectItem value="waiter">Waiter (Take Orders)</SelectItem>
                                <SelectItem value="cashier">Cashier (Process Payments)</SelectItem>
                                <SelectItem value="kitchen">Kitchen Staff (View Orders)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone (Optional)</Label>
                        <Input id="phone" placeholder="0712345678" {...register("phone")} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email (Optional)</Label>
                        <Input id="email" type="email" {...register("email")} />
                    </div>

                    <div className="border-t pt-4">
                        <p className="text-sm text-muted-foreground mb-3">Set a 4-digit PIN for login</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="pin">PIN</Label>
                                <PasswordInput
                                    id="pin"
                                    maxLength={4}
                                    placeholder="1234"
                                    {...register("pin")}
                                />
                                {errors.pin && <p className="text-sm text-destructive">{errors.pin.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPin">Confirm PIN</Label>
                                <PasswordInput
                                    id="confirmPin"
                                    maxLength={4}
                                    placeholder="1234"
                                    {...register("confirmPin")}
                                />
                                {errors.confirmPin && <p className="text-sm text-destructive">{errors.confirmPin.message}</p>}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Adding..." : "Add Staff"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
