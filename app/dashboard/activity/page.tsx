"use client"

import { useState, useEffect } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ProtectedPage } from "@/components/auth/protected-page"
import { format, formatDistanceToNow } from "date-fns"
import {
    CreditCard,
    Package,
    Tag,
    AlertCircle,
    Edit,
    LogIn,
    LogOut,
    ChevronDown,
    ChevronRight
} from "lucide-react"
import type { ActivityLog, StaffMember, ActivityActionType } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface ActivityLogWithStaff extends ActivityLog {
    staff?: StaffMember
}

/**
 * ActivityPage Component
 * 
 * Displays a log of sensitive actions taken within the application (e.g., payments, stock adjustments).
 * Allows filtering by staff member and action type.
 * Supports real-time updates via Supabase subscriptions.
 */
export default function ActivityPage() {
    const [logs, setLogs] = useState<ActivityLogWithStaff[]>([])
    const [staff, setStaff] = useState<StaffMember[]>([])
    const [loading, setLoading] = useState(true)
    const [filterStaff, setFilterStaff] = useState<string>("all")
    const [filterAction, setFilterAction] = useState<string>("all")
    const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set())

    useEffect(() => {
        fetchData()
        setupRealtime()
    }, [])

    /**
     * Fetches initial activity logs and staff data.
     * Restricts data to the current user's restaurant.
     */
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

            // Fetch activity logs with staff info
            const { data: logsData } = await supabase
                .from("activity_logs")
                .select(`
                    *,
                    staff:staff_id(*)
                `)
                .eq("restaurant_id", currentStaff.restaurant_id)
                .order("created_at", { ascending: false })
                .limit(100)

            if (logsData) setLogs(logsData as ActivityLogWithStaff[])
        } catch (error) {
            console.error("Error fetching activity logs:", error)
        } finally {
            setLoading(false)
        }
    }

    /**
     * Sets up a real-time subscription to the 'activity_logs' table.
     * Listens for new INSERT events and updates the logs list live.
     */
    const setupRealtime = () => {
        const supabase = getSupabaseClient()

        const channel = supabase
            .channel('activity-logs-realtime')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'activity_logs'
                },
                async (payload: any) => {
                    // Fetch the full log with staff info
                    const { data } = await supabase
                        .from('activity_logs')
                        .select('*, staff:staff_id(*)')
                        .eq('id', payload.new.id)
                        .single()

                    if (data) {
                        setLogs(prev => [data as ActivityLogWithStaff, ...prev])
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }

    /**
     * Returns the appropriate icon component based on the action type.
     */
    const getActionIcon = (actionType: string) => {
        const icons: Record<string, any> = {
            payment_processed: CreditCard,
            payment_failed: AlertCircle,
            stock_adjusted: Package,
            discount_applied: Tag,
            order_voided: AlertCircle,
            order_modified: Edit,
            staff_login: LogIn,
            staff_logout: LogOut,
        }
        const Icon = icons[actionType] || AlertCircle
        return <Icon className="h-4 w-4" />
    }

    /**
     * Returns a styled Badge component representing the action type.
     */
    const getActionBadge = (actionType: string) => {
        const variants: Record<string, any> = {
            payment_processed: "default",
            payment_failed: "destructive",
            stock_adjusted: "secondary",
            discount_applied: "outline",
            order_voided: "destructive",
            order_modified: "secondary",
            staff_login: "outline",
            staff_logout: "outline",
        }

        const labels: Record<string, string> = {
            payment_processed: "Payment Processed",
            payment_failed: "Payment Failed",
            stock_adjusted: "Stock Adjusted",
            discount_applied: "Discount Applied",
            order_voided: "Order Voided",
            order_modified: "Order Modified",
            staff_login: "Staff Login",
            staff_logout: "Staff Logout",
        }

        return (
            <Badge variant={variants[actionType] || "outline"} className="gap-1">
                {getActionIcon(actionType)}
                {labels[actionType] || actionType.replace(/_/g, " ")}
            </Badge>
        )
    }

    const toggleLogExpansion = (logId: string) => {
        setExpandedLogs(prev => {
            const newSet = new Set(prev)
            if (newSet.has(logId)) {
                newSet.delete(logId)
            } else {
                newSet.add(logId)
            }
            return newSet
        })
    }

    /**
     * Formats the JSON details of a log entry into a readable array of strings.
     */
    const formatDetails = (log: ActivityLogWithStaff) => {
        const details = log.details
        if (!details) return null

        const items: string[] = []

        if (details.payment_method) {
            items.push(`Payment: ${details.payment_method.toUpperCase()}`)
        }
        if (details.amount) {
            items.push(`Amount: KES ${details.amount.toLocaleString()}`)
        }
        if (details.transaction_id_masked) {
            items.push(`Transaction: ${details.transaction_id_masked}`)
        }
        if (details.phone_masked) {
            items.push(`Phone: ${details.phone_masked}`)
        }
        if (details.item_name) {
            items.push(`Item: ${details.item_name}`)
        }
        if (details.quantity_change) {
            items.push(`Quantity: ${details.quantity_change > 0 ? '+' : ''}${details.quantity_change}`)
        }
        if (details.adjustment_type) {
            items.push(`Type: ${details.adjustment_type}`)
        }
        if (details.old_quantity !== undefined && details.new_quantity !== undefined) {
            items.push(`Stock: ${details.old_quantity} → ${details.new_quantity}`)
        }
        if (details.reason) {
            items.push(`Reason: ${details.reason}`)
        }
        if (details.notes) {
            items.push(`Notes: ${details.notes}`)
        }

        return items
    }

    const filteredLogs = logs.filter(log => {
        if (filterStaff !== "all" && log.staff_id !== filterStaff) return false
        if (filterAction !== "all" && log.action_type !== filterAction) return false
        return true
    })

    const uniqueActions = Array.from(new Set(logs.map(l => l.action_type)))

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
                                    {action.replace(/_/g, " ")}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button
                        variant="outline"
                        className="ml-auto"
                        onClick={async () => {
                            try {
                                const response = await fetch('/api/logs/download-daily');
                                if (!response.ok) throw new Error('Download failed');

                                const blob = await response.blob();
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `osumo-activity-${new Date().toISOString().slice(0, 10)}.txt`;
                                document.body.appendChild(a);
                                a.click();
                                window.URL.revokeObjectURL(url);
                            } catch (error) {
                                console.error('Download error:', error);
                                // Could add toast here
                            }
                        }}
                    >
                        <span className="mr-2">📥</span>
                        Download Today's Log
                    </Button>
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
                            <div className="space-y-3">
                                {filteredLogs.map((log) => {
                                    const isExpanded = expandedLogs.has(log.id)
                                    const detailItems = formatDetails(log)
                                    const hasDetails = detailItems && detailItems.length > 0

                                    return (
                                        <Card key={log.id} className="overflow-hidden">
                                            <div className="p-4">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1 space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-semibold">
                                                                {log.staff ? `${log.staff.first_name} ${log.staff.last_name}` : "Unknown"}
                                                            </span>
                                                            <span className="text-muted-foreground">•</span>
                                                            <span className="text-sm text-muted-foreground" title={format(new Date(log.created_at), "PPpp")}>
                                                                {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                                                            </span>
                                                        </div>
                                                        {hasDetails && (
                                                            <Collapsible open={isExpanded}>
                                                                <CollapsibleTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-auto p-0 text-sm text-muted-foreground hover:text-foreground"
                                                                        onClick={() => toggleLogExpansion(log.id)}
                                                                    >
                                                                        {isExpanded ? (
                                                                            <ChevronDown className="h-3 w-3 mr-1" />
                                                                        ) : (
                                                                            <ChevronRight className="h-3 w-3 mr-1" />
                                                                        )}
                                                                        {isExpanded ? "Hide" : "Show"} details
                                                                    </Button>
                                                                </CollapsibleTrigger>
                                                                <CollapsibleContent className="mt-2">
                                                                    <div className="text-sm space-y-1 pl-4 border-l-2 border-muted">
                                                                        {detailItems.map((item, idx) => (
                                                                            <div key={idx} className="text-muted-foreground">
                                                                                {item}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </CollapsibleContent>
                                                            </Collapsible>
                                                        )}
                                                    </div>
                                                    <div>
                                                        {getActionBadge(log.action_type)}
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    )
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </ProtectedPage>
    )
}
