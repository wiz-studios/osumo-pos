"use client"

import { useState, useEffect } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit2, UserCheck, UserX } from "lucide-react"
import { AddStaffDialog } from "@/components/staff/add-staff-dialog"
import { EditStaffDialog } from "@/components/staff/edit-staff-dialog"
import { ProtectedPage } from "@/components/auth/protected-page"
import { getStaffName } from "@/lib/auth-helpers"
import type { StaffMember } from "@/lib/types"

export default function StaffPage() {
    const [staff, setStaff] = useState<StaffMember[]>([])
    const [loading, setLoading] = useState(true)
    const [showAddDialog, setShowAddDialog] = useState(false)
    const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null)

    useEffect(() => {
        fetchStaff()
    }, [])

    const fetchStaff = async () => {
        setLoading(true)
        const supabase = getSupabaseClient()

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: currentStaff } = await supabase
                .from("staff")
                .select("restaurant_id")
                .eq("user_id", user.id)
                .single()

            if (!currentStaff?.restaurant_id) return

            const { data, error } = await supabase
                .from("staff")
                .select("*")
                .eq("restaurant_id", currentStaff.restaurant_id)
                .order("created_at", { ascending: false })

            if (error) throw error
            setStaff(data || [])
        } catch (error) {
            console.error("Error fetching staff:", error)
        } finally {
            setLoading(false)
        }
    }

    const getRoleBadge = (role: string) => {
        const variants: Record<string, any> = {
            manager: "default",
            cashier: "secondary",
            kitchen: "outline"
        }
        return <Badge variant={variants[role] || "outline"}>{role}</Badge>
    }

    const activeStaff = staff.filter(s => s.active)
    const inactiveStaff = staff.filter(s => !s.active)

    if (loading) {
        return <div className="flex items-center justify-center h-screen">Loading...</div>
    }

    return (
        <ProtectedPage allowedRoles={["manager"]}>
            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Staff Management</h1>
                        <p className="text-muted-foreground mt-1">Manage staff members and permissions</p>
                    </div>
                    <Button 
                        onClick={(e) => {
                            e.preventDefault()
                            setShowAddDialog(true)
                        }} 
                        className="gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Add Staff
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{staff.length}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">Active</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{activeStaff.length}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-muted-foreground">{inactiveStaff.length}</div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Staff Members</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {staff.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <p>No staff members yet.</p>
                                <p className="text-sm mt-1">Click "Add Staff" to get started.</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Phone</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {staff.map((member) => (
                                        <TableRow key={member.id}>
                                            <TableCell className="font-medium">
                                                {getStaffName(member)}
                                            </TableCell>
                                            <TableCell>{getRoleBadge(member.role)}</TableCell>
                                            <TableCell>{member.phone || "-"}</TableCell>
                                            <TableCell>{member.email || "-"}</TableCell>
                                            <TableCell>
                                                {member.active ? (
                                                    <div className="flex items-center gap-1 text-green-600">
                                                        <UserCheck className="h-4 w-4" />
                                                        <span className="text-sm">Active</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1 text-muted-foreground">
                                                        <UserX className="h-4 w-4" />
                                                        <span className="text-sm">Inactive</span>
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setEditingStaff(member)}
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                {showAddDialog && (
                    <AddStaffDialog
                        open={showAddDialog}
                        onOpenChange={(open) => {
                            setShowAddDialog(open)
                            if (!open) {
                                // Reset any form state when closing
                            }
                        }}
                        onSuccess={() => {
                            fetchStaff()
                            setShowAddDialog(false)
                        }}
                    />
                )}

                {editingStaff && (
                    <EditStaffDialog
                        open={!!editingStaff}
                        onOpenChange={() => setEditingStaff(null)}
                        staff={editingStaff}
                        onSuccess={fetchStaff}
                    />
                )}
            </div>
        </ProtectedPage>
    )
}
