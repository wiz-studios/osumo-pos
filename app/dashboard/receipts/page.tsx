"use client"

import { useState, useEffect } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { useStaffRole } from "@/hooks/use-staff-role"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { ReceiptDialog } from "@/components/cashier/receipt-dialog"
import { Search, Calendar, Receipt, Printer, Eye } from "lucide-react"
import { format } from "date-fns"

interface SavedReceipt {
    id: string
    receipt_number: string
    receipt_generated_at: string
    paid_at: string
    table_number: string | null
    order_type: string
    total: number
    payment_method: string
    receipt_data: any
    cashier_id: string
}

export default function ReceiptsPage() {
    const { staffId, role, staffName } = useStaffRole()
    const { toast } = useToast()

    const [receipts, setReceipts] = useState<SavedReceipt[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedDate, setSelectedDate] = useState("")
    const [selectedReceipt, setSelectedReceipt] = useState<any>(null)
    const [receiptOpen, setReceiptOpen] = useState(false)

    useEffect(() => {
        if (staffId) {
            fetchReceipts()
        }
    }, [staffId, selectedDate])

    const fetchReceipts = async () => {
        setLoading(true)
        const supabase = getSupabaseClient()

        try {
            let query = supabase
                .from('orders')
                .select('*')
                .not('receipt_number', 'is', null)
                .order('receipt_generated_at', { ascending: false })

            // Role-based filtering
            if (role === 'cashier') {
                query = query.eq('cashier_id', staffId)
            }

            // Date filter
            if (selectedDate) {
                const startOfDay = new Date(selectedDate)
                startOfDay.setHours(0, 0, 0, 0)
                const endOfDay = new Date(selectedDate)
                endOfDay.setHours(23, 59, 59, 999)

                query = query
                    .gte('paid_at', startOfDay.toISOString())
                    .lte('paid_at', endOfDay.toISOString())
            }

            const { data, error } = await query.limit(100)

            if (error) throw error

            setReceipts(data as SavedReceipt[])
        } catch (error: any) {
            console.error('Error fetching receipts:', error)
            toast({
                title: "Error",
                description: "Failed to load receipts",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    const viewReceipt = async (receipt: SavedReceipt) => {
        // Log receipt access for audit trail
        const supabase = getSupabaseClient()
        await supabase
            .from('receipt_access_logs')
            .insert({
                order_id: receipt.id,
                receipt_number: receipt.receipt_number,
                accessed_by: staffId,
                access_type: 'view',
                accessed_at: new Date().toISOString()
            })

        // Show receipt dialog
        setSelectedReceipt(receipt.receipt_data)
        setReceiptOpen(true)
    }

    const filteredReceipts = receipts.filter(receipt => {
        if (!searchTerm) return true
        const search = searchTerm.toLowerCase()
        return (
            receipt.receipt_number.toLowerCase().includes(search) ||
            receipt.table_number?.toLowerCase().includes(search) ||
            receipt.payment_method.toLowerCase().includes(search)
        )
    })

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">Receipt History</h1>
                <p className="text-muted-foreground">
                    View and reprint past receipts
                    {role === 'cashier' && ' (showing only your receipts)'}
                </p>
            </div>

            {/* Search & Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Search className="h-5 w-5" />
                        Search & Filter
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block">
                                Search Receipt Number or Table
                            </label>
                            <Input
                                placeholder="e.g., KRA-20251121-... or Table 5"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-2 block">
                                Filter by Date
                            </label>
                            <Input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setSearchTerm("")
                                setSelectedDate("")
                            }}
                        >
                            Clear Filters
                        </Button>
                        <Button onClick={fetchReceipts}>
                            Refresh
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Receipt List */}
            <div className="space-y-3">
                {loading ? (
                    <Card>
                        <CardContent className="py-12">
                            <p className="text-center text-muted-foreground">Loading receipts...</p>
                        </CardContent>
                    </Card>
                ) : filteredReceipts.length === 0 ? (
                    <Card>
                        <CardContent className="py-12">
                            <div className="text-center">
                                <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <p className="text-muted-foreground">No receipts found</p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    filteredReceipts.map((receipt) => (
                        <Card key={receipt.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                                        {/* Receipt Number */}
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">Receipt No.</p>
                                            <p className="font-mono font-semibold text-sm">
                                                {receipt.receipt_number.slice(-12)}
                                            </p>
                                        </div>

                                        {/* Date & Time */}
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">Date & Time</p>
                                            <p className="font-medium text-sm">
                                                {format(new Date(receipt.paid_at), 'MMM dd, yyyy')}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {format(new Date(receipt.paid_at), 'HH:mm')}
                                            </p>
                                        </div>

                                        {/* Table/Type */}
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">Order</p>
                                            <Badge variant="outline">
                                                {receipt.table_number || receipt.order_type}
                                            </Badge>
                                        </div>

                                        {/* Amount & Payment */}
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">Total</p>
                                            <p className="font-bold">KES {receipt.total.toFixed(2)}</p>
                                            <p className="text-xs text-emerald-600">
                                                {receipt.payment_method.toUpperCase()}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="ml-4">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => viewReceipt(receipt)}
                                        >
                                            <Eye className="h-4 w-4 mr-2" />
                                            View
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Receipt Dialog */}
            {selectedReceipt && (
                <ReceiptDialog
                    open={receiptOpen}
                    onOpenChange={setReceiptOpen}
                    receipt={selectedReceipt}
                />
            )}
        </div>
    )
}
