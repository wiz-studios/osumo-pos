"use client"

import { useState, useEffect } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ProtectedPage } from "@/components/auth/protected-page"
import { format } from "date-fns"
import type { ActivityLog, StaffMember } from "@/lib/types"

export default function ActivityPage() {
    const [logs, setLogs] = useState<(ActivityLog & { staff?: StaffMember })[]>([])
    const [staff, setStaff] = useState<StaffMember[]>([])
    const [loading, setLoading] = useState(true)
    const [filterStaff, setFilterStaff] = useState<string>("all")
    const [filterAction, setFilterAction] = useState<string>("all")

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
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

            // Fetch staff
            const { data: staffData } = await supabase
                .from("staff")
                .select("*")
                .eq("restaurant_id", currentStaff.restaurant_id)

            if (staffData) setStaff(staffData)

            // Fetch activity logs
            const { data: logsData } = await supabase
                .from("activity_logs")
                .select("*, staff:staff_id(*)")
                .eq("restaurant_id", currentStaff.restaurant_id)
                .order("created_at", { ascending: false })
                .limit(100)

            if (logsData) setLogs(logsData as any)
        } catch (error) {
            console.error("Error fetching activity logs:", error)
        } finally {
            setLoading(false)
        }
    }

    const getActionBadge = (action: string) => {
        const variants: Record<string, any> = {
            void_item: "destructive",
            discount: "secondary",
            stock_adjust: "default",
            login: "outline"
        }
        return <Badge variant={variants[action] || "outline"}>{action.replace("_", " ")}</Badge>
    }

    const filteredLogs = logs.filter(log => {
        if (filterStaff !== "all" && log.staff_id !== filterStaff) return false
        if (filterAction !== "all" && log.action !== filterAction) return false
        return true
    })

    const uniqueActions = Array.from(new Set(logs.map(l => l.action)))

    if (loading) {
        return <div className="flex items-center justify-center h-screen">Loading...</div>
    }

    return (
        <ProtectedPage allowedRoles={["manager"]}>
            <div className="space-y-6 p-6">
                <div>
                    <h1 className="text-3xl font-bold">Activity Log</h1>
                    <p className="text-muted-foreground mt-1">Audit trail of sensitive actions</p>
                </div>

                <div className="flex gap-4">
                    <Select value={filterStaff} onValueChange={setFilterStaff}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Filter by staff" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Staff</SelectItem>
                            {staff.map((member) => (
                                <SelectItem key={member.id} value={member.id}>
                                    {member.first_name} {member.last_name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={filterAction} onValueChange={setFilterAction}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Filter by action" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Actions</SelectItem>
                            {uniqueActions.map((action) => (
                                <SelectItem key={action} value={action}>
                                    {action.replace("_", " ")}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity ({filteredLogs.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {filteredLogs.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <p>No activity logs found.</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Time</TableHead>
                                        <TableHead>Staff</TableHead>
                                        <TableHead>Action</TableHead>
                                        <TableHead>Details</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredLogs.map((log) => (
                                        <TableRow key={log.id}>
                                            <TableCell className="text-sm">
                                                {format(new Date(log.created_at), "MMM dd, HH:mm")}
                                            </TableCell>
                                            <TableCell>
                                                {log.staff ? `${log.staff.first_name} ${log.staff.last_name}` : "Unknown"}
                                            </TableCell>
                                            <TableCell>{getActionBadge(log.action)}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {log.details ? (
                                                    <pre className="text-xs">{JSON.stringify(log.details, null, 2)}</pre>
                                                ) : (
                                                    "-"
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </ProtectedPage>
    )
}
