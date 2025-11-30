"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase/client"
import { verifyPin } from "@/lib/auth-helpers"
import { logStaffLogin } from "@/lib/activity-logger"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Lock } from "lucide-react"
import type { StaffMember } from "@/lib/types"

export default function StaffLoginPage() {
    const router = useRouter()
    const [staff, setStaff] = useState<StaffMember[]>([])
    const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)
    const [pin, setPin] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [failedAttempts, setFailedAttempts] = useState(0)

    useEffect(() => {
        fetchStaff()
    }, [])

    const fetchStaff = async () => {
        const supabase = getSupabaseClient()
        const { data } = await supabase
            .from("staff")
            .select("*")
            .eq("active", true)
            .order("first_name")

        if (data) setStaff(data)
    }

    const handlePinInput = (value: string) => {
        if (value.length <= 4 && /^\d*$/.test(value)) {
            setPin(value)
            setError("")

            if (value.length === 4) {
                handleLogin(value)
            }
        }
    }

    const handleLogin = async (pinValue: string) => {
        if (!selectedStaff || !selectedStaff.pin_hash) {
            setError("Staff member has no PIN set")
            return
        }

        if (failedAttempts >= 3) {
            setError("Too many failed attempts. Please contact admin.")
            return
        }

        setLoading(true)
        setError("")

        try {
            const isValid = await verifyPin(pinValue, selectedStaff.pin_hash)

            if (isValid) {
                // Clear any existing staff data first (defensive cleanup)
                localStorage.removeItem("current_staff_id")
                localStorage.removeItem("current_staff_name")
                localStorage.removeItem("current_staff_role")

                // Store fresh staff session data
                localStorage.setItem("current_staff_id", selectedStaff.id)
                localStorage.setItem("current_staff_name", `${selectedStaff.first_name} ${selectedStaff.last_name}`)
                localStorage.setItem("current_staff_role", selectedStaff.role)

                // Log login activity
                await logStaffLogin({
                    staffId: selectedStaff.id,
                    restaurantId: selectedStaff.restaurant_id
                })

                // Redirect to POS (staff don't need the main dashboard)
                router.push("/dashboard/pos")
            } else {
                setFailedAttempts(prev => prev + 1)
                setError("Incorrect PIN")
                setPin("")
            }
        } catch (error) {
            console.error("Login error:", error)
            setError("Login failed. Please try again.")
            setPin("")
        } finally {
            setLoading(false)
        }
    }

    const getInitials = (staff: StaffMember) => {
        const first = staff.first_name?.[0] || ""
        const last = staff.last_name?.[0] || ""
        return (first + last).toUpperCase()
    }

    if (!selectedStaff) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
                <Card className="w-full max-w-2xl">
                    <CardHeader>
                        <CardTitle className="text-2xl text-center">Select Staff Member</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {staff.map((member) => (
                                <button
                                    key={member.id}
                                    onClick={() => setSelectedStaff(member)}
                                    className="flex flex-col items-center gap-3 p-4 rounded-lg border-2 border-transparent hover:border-primary hover:bg-accent transition-all"
                                >
                                    <Avatar className="h-16 w-16">
                                        <AvatarFallback className="text-lg font-semibold">
                                            {getInitials(member)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="text-center">
                                        <p className="font-medium">{member.first_name}</p>
                                        <p className="text-sm text-muted-foreground capitalize">{member.role}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <div className="flex flex-col items-center gap-4">
                        <Avatar className="h-20 w-20">
                            <AvatarFallback className="text-2xl font-semibold">
                                {getInitials(selectedStaff)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="text-center">
                            <CardTitle className="text-xl">
                                {selectedStaff.first_name} {selectedStaff.last_name}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground capitalize">{selectedStaff.role}</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex items-center justify-center gap-2 text-muted-foreground mb-4">
                            <Lock className="h-4 w-4" />
                            <span className="text-sm">Enter your 4-digit PIN</span>
                        </div>

                        <PasswordInput
                            inputMode="numeric"
                            maxLength={4}
                            value={pin}
                            onChange={(e) => handlePinInput(e.target.value)}
                            className="text-center text-2xl tracking-widest"
                            placeholder="••••"
                            autoFocus
                            disabled={loading || failedAttempts >= 3}
                        />

                        {error && (
                            <p className="text-sm text-destructive text-center">{error}</p>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                                setSelectedStaff(null)
                                setPin("")
                                setError("")
                                setFailedAttempts(0)
                            }}
                        >
                            Back
                        </Button>
                        <Button
                            className="flex-1"
                            onClick={() => handleLogin(pin)}
                            disabled={pin.length !== 4 || loading || failedAttempts >= 3}
                        >
                            {loading ? "Verifying..." : "Login"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
