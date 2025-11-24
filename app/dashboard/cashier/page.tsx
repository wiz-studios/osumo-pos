"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase/client"
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js"
import { useStaffRole } from "@/hooks/use-staff-role"
import { useToast } from "@/hooks/use-toast"
import { PendingOrdersQueue } from "@/components/cashier/pending-orders-queue"
import { PaymentPanel } from "@/components/cashier/payment-panel"
import { DailySalesStats } from "@/components/cashier/daily-sales-stats"
import { PaymentHistory } from "@/components/cashier/payment-history"
import { ReceiptDialog } from "@/components/cashier/receipt-dialog"
import { generateKRAReceipt, ReceiptData } from "@/lib/receipt-generator"
import { normalizePhone, isValidKenyanPhone } from "@/lib/phone-utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { CreditCard, History } from "lucide-react"

interface OrderWithItems {
    id: string
    table_number: string | null
    order_type: string
    status: string
    total: number
    payment_method: string | null
    payment_details: any
    paid_at?: string
    receipt_number?: string | null
    is_prepaid?: boolean
    sent_to_cashier_at: string
    order_items: Array<{
        id: string
        quantity: number
        unit_price: number
        subtotal: number
        menu_item: {
            name: string
        }
    }>
}

export default function CashierPage() {
    const router = useRouter()
    const { role, staffId, staffName, loading: roleLoading } = useStaffRole()
    const { toast } = useToast()

    const [pendingOrders, setPendingOrders] = useState<OrderWithItems[]>([])
    const [dailySales, setDailySales] = useState<OrderWithItems[]>([])
    const [paymentHistory, setPaymentHistory] = useState<OrderWithItems[]>([])
    const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null)
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState(false)
    const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)
    const [receiptOpen, setReceiptOpen] = useState(false)
    const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending')

    const isAdmin = role === 'manager' || role === 'admin'

    // Role-based access control
    useEffect(() => {
        if (!roleLoading && role !== 'cashier' && !isAdmin) {
            router.push('/unauthorized')
        }
    }, [role, roleLoading, router, isAdmin])

    // Fetch data
    useEffect(() => {
        if (staffId && (role === 'cashier' || isAdmin)) {
            fetchPendingOrders()
            if (isAdmin) {
                fetchDailySales()
            }
            const cleanup = setupRealtime()
            return cleanup
        }
    }, [staffId, role, isAdmin])

    const fetchPendingOrders = async () => {
        const supabase = getSupabaseClient()

        try {
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    id,
                    table_number,
                    order_type,
                    status,
                    total,
                    is_prepaid,
                    sent_to_cashier_at,
                    order_items (
                        id,
                        quantity,
                        unit_price,
                        subtotal,
                        menu_item:menu_items (
                            name
                        )
                    )
                `)
                .eq('status', 'pending_payment')
                .order('sent_to_cashier_at', { ascending: true })  // FIFO

            if (error) throw error

            console.log('📋 Cashier fetched pending orders:', {
                count: data?.length || 0,
                orders: data?.map((o: any) => ({
                    id: o.id,
                    status: o.status,
                    total: o.total,
                    sent_at: o.sent_to_cashier_at
                }))
            })

            setPendingOrders(data as OrderWithItems[])
        } catch (error: any) {
            console.error('Error fetching orders:', error)
            toast({
                title: "Error",
                description: "Failed to load pending orders",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    const fetchDailySales = async () => {
        const supabase = getSupabaseClient()

        try {
            // Get today's paid orders
            const today = new Date()
            today.setHours(0, 0, 0, 0)

            const { data, error } = await supabase
                .from('orders')
                .select('id, total, payment_method, status, table_number, order_type, sent_to_cashier_at, order_items(id, quantity, unit_price, subtotal, menu_item:menu_items(name))')
                .eq('status', 'paid')
                .gte('paid_at', today.toISOString())

            if (error) throw error

            setDailySales(data as OrderWithItems[])
        } catch (error: any) {
            console.error('Error fetching daily sales:', error)
        }
    }

    const fetchPaymentHistory = async () => {
        const supabase = getSupabaseClient()

        try {
            // Get paid orders from last 24 hours
            const twentyFourHoursAgo = new Date()
            twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

            const { data, error } = await supabase
                .from('orders')
                .select(`
                    id,
                    table_number,
                    order_type,
                    status,
                    total,
                    payment_method,
                    payment_details,
                    paid_at,
                    receipt_number,
                    sent_to_cashier_at,
                    order_items (
                        id,
                        quantity,
                        unit_price,
                        subtotal,
                        menu_item:menu_items (
                            name
                        )
                    )
                `)
                .eq('status', 'paid')
                .gte('paid_at', twentyFourHoursAgo.toISOString())
                .order('paid_at', { ascending: false })

            if (error) throw error

            setPaymentHistory(data as OrderWithItems[])
        } catch (error: any) {
            console.error('Error fetching payment history:', error)
            toast({
                title: "Error",
                description: "Failed to load payment history",
                variant: "destructive"
            })
        }
    }

    const setupRealtime = () => {
        const supabase = getSupabaseClient()

        const channel = supabase
            .channel('cashier-orders')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'orders',
                    filter: 'status=in.(pending_payment,paid)'
                },
                (payload: RealtimePostgresChangesPayload<any>) => {
                    if (payload.new.status === 'pending_payment') {
                        // New order or updated order
                        setPendingOrders(prev => {
                            const exists = prev.find(o => o.id === payload.new.id)
                            if (exists) {
                                return prev.map(o =>
                                    o.id === payload.new.id ? { ...o, ...payload.new } : o
                                )
                            } else {
                                // New order, refetch to get full data
                                fetchPendingOrders()
                                return prev
                            }
                        })
                    } else if (payload.new.status === 'paid') {
                        // Order was paid, remove from queue
                        setPendingOrders(prev => prev.filter(o => o.id !== payload.new.id))

                        // If this was the selected order, clear selection
                        if (selectedOrder?.id === payload.new.id) {
                            setSelectedOrder(null)
                            toast({
                                title: "Order Already Paid",
                                description: "This order was processed by another cashier",
                                variant: "default"
                            })
                        }
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }

    // Helper to serialize errors (captures non-enumerable Error props)
    const serializeError = (err: any) => {
        if (!err) return null
        try {
            // Copy all own property names (including non-enumerable) to a plain object
            const plain: any = {}
            Object.getOwnPropertyNames(err).forEach((k) => {
                // @ts-ignore
                plain[k] = err[k]
            })

            // Ensure common Error fields are present
            if (err instanceof Error) {
                plain.name = err.name
                plain.message = err.message
                plain.stack = err.stack
            }

            return plain
        } catch (e) {
            return { message: String(err) }
        }
    }

    const handleCompletePayment = async (
        paymentMethod: 'cash' | 'mpesa',
        paymentData: any
    ) => {
        if (!selectedOrder || !staffId) return

        setProcessing(true)
        const supabase = getSupabaseClient()

        try {
            // 1. Validate payment details
            if (paymentMethod === 'cash') {
                if (paymentData.amount_received < selectedOrder.total) {
                    throw new Error('Insufficient amount received')
                }
            }

            if (paymentMethod === 'mpesa') {
                if (!paymentData.phone_number || !paymentData.transaction_code) {
                    throw new Error('M-Pesa details required')
                }

                // Validate phone format
                if (!isValidKenyanPhone(paymentData.phone_number)) {
                    throw new Error('Invalid phone number format')
                }

                // Validate transaction code (6-12 alphanumeric)
                const normalizedTxn = paymentData.transaction_code.trim().toUpperCase()
                if (!/^[A-Z0-9]{6,12}$/.test(normalizedTxn)) {
                    throw new Error('Invalid transaction code (6-12 alphanumeric characters)')
                }
            }

            // 2. Prepare payment details (structured for security)
            type LocalPaymentDetails = {
                method: 'cash' | 'mpesa'
                amount_received?: number
                change_given?: number
                phone?: string
                transaction_id?: string
            }

            const paymentDetails: LocalPaymentDetails = paymentMethod === 'cash'
                ? {
                    method: 'cash',
                    amount_received: paymentData.amount_received,
                    change_given: paymentData.amount_received - selectedOrder.total
                }
                : {
                    method: 'mpesa',
                    phone: normalizePhone(paymentData.phone_number),  // Store normalized
                    transaction_id: paymentData.transaction_code.trim().toUpperCase()
                }

            // 3. Generate receipt BEFORE database update (we need the data)
            const receiptData = generateKRAReceipt(selectedOrder, paymentDetails, staffName || undefined)

            // 4. Update order with payment + receipt snapshot (with double-payment prevention)
            const updatePayload: any = {
                status: selectedOrder.is_prepaid ? 'in_kitchen' : 'paid',
                payment_status: 'paid',
                payment_method: paymentMethod,
                cashier_id: staffId,
                paid_at: new Date().toISOString(),
                payment_details: paymentDetails,
                // If prepaid, send to kitchen
                ...(selectedOrder.is_prepaid && {
                    kitchen_status: 'new',
                    sent_to_kitchen_at: new Date().toISOString()
                }),
                // 🧾 RECEIPT STORAGE (Immutable, KRA-compliant)
                receipt_number: receiptData.receiptNumber,
                receipt_generated_at: new Date().toISOString(),
                receipt_data: {
                    // Complete snapshot for retrieval
                    receiptNumber: receiptData.receiptNumber,
                    orderNumber: receiptData.orderNumber,
                    date: receiptData.date,
                    time: receiptData.time,
                    cashier: receiptData.cashier,
                    items: receiptData.items,
                    taxableAmount: receiptData.taxableAmount,
                    vatAmount: receiptData.vatAmount,
                    total: receiptData.total,
                    paymentMethod: receiptData.paymentMethod,
                    paymentDetails: receiptData.paymentDetails,
                    qrCode: receiptData.qrCode,
                    // Additional metadata for compliance
                    businessName: 'OSUMO',
                    kraPin: 'P051234567X',
                    orderType: selectedOrder.order_type,
                    tableNumber: selectedOrder.table_number
                }
            }

            const { error: updateError } = await supabase
                .from('orders')
                .update(updatePayload)
                .eq('id', selectedOrder.id)
                .eq('status', 'pending_payment')  // 🔒 CRITICAL: Prevents double-payment

            if (updateError) throw updateError

            // 5. Immediately remove from pending orders list (don't wait for realtime)
            setPendingOrders(prev => prev.filter(o => o.id !== selectedOrder.id))

            // 6. Log event (DO NOT store full transaction details in logs)
            const { error: eventError } = await supabase
                .from('order_events')
                .insert({
                    order_id: selectedOrder.id,
                    from_status: 'pending_payment',
                    to_status: selectedOrder.is_prepaid ? 'in_kitchen' : 'paid',
                    triggered_by: staffId,
                    event_type: 'payment',
                    metadata: {
                        payment_method: paymentMethod,
                        amount: selectedOrder.total,
                        receipt_number: receiptData.receiptNumber,
                        timestamp: new Date().toISOString(),
                        is_prepaid: selectedOrder.is_prepaid
                        // 🔒 Security: Never log full TXN IDs or phone numbers
                    }
                })

            if (eventError) console.error('Event logging error:', eventError)

            // 7. Show receipt
            setReceiptData(receiptData)
            setReceiptOpen(true)

            // 8. Clear selection
            setSelectedOrder(null)

            toast({
                title: "Payment Complete",
                description: `Order paid via ${paymentMethod.toUpperCase()}`
            })

        } catch (error: any) {
            // Serialize error so non-enumerable properties (like Error.message) are visible in console
            const serialized = serializeError(error)
            console.error('Payment error object:', serialized)

            // Provide a defensive fallback for the toast message
            const toastMessage = (serialized && (serialized.message || serialized.msg)) || 'An unknown error occurred. Check console for details.'

            toast({
                title: "Payment Failed",
                description: toastMessage,
                variant: "destructive"
            })
        } finally {
            setProcessing(false)
        }
    }

    const handleReprint = (order: OrderWithItems) => {
        try {
            const receipt = generateKRAReceipt(
                {
                    id: order.id,
                    total: order.total,
                    order_items: order.order_items
                },
                {
                    method: (order.payment_method || 'cash') as 'cash' | 'mpesa',
                    amount_received: order.payment_details?.amount_received,
                    change_given: order.payment_details?.change_given,
                    phone: order.payment_details?.phone_number,
                    transaction_id: order.payment_details?.transaction_code || order.payment_details?.mpesa_transaction_code
                },
                staffName || 'Staff'
            )

            setReceiptData(receipt)
            setReceiptOpen(true)

            toast({
                title: "Receipt Ready",
                description: "Receipt reprinted successfully"
            })
        } catch (error: any) {
            console.error('Error reprinting receipt:', error)
            toast({
                title: "Error",
                description: "Failed to reprint receipt",
                variant: "destructive"
            })
        }
    }

    if (roleLoading || loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-lg">Loading cashier dashboard...</div>
            </div>
        )
    }

    if (role !== 'cashier' && !isAdmin) {
        return null  // Will redirect via useEffect
    }

    return (
        <div className="h-screen flex flex-col p-3 sm:p-4 md:p-6 gap-3 sm:gap-4 md:gap-6">
            {/* Header */}
            <div className="flex items-center gap-2 sm:gap-3">
                <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                <div>
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Cashier Dashboard</h1>
                    <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
                        {pendingOrders.length} pending {pendingOrders.length === 1 ? 'order' : 'orders'}
                    </p>
                </div>
            </div>

            {/* Admin Stats */}
            {isAdmin && dailySales.length >= 0 && (
                <DailySalesStats orders={dailySales} />
            )}

            {/* Main Content */}
            <Tabs
                value={activeTab}
                onValueChange={(v) => {
                    setActiveTab(v as 'pending' | 'history')
                    if (v === 'history' && paymentHistory.length === 0) {
                        fetchPaymentHistory()
                    }
                }}
                className="flex-1 flex flex-col overflow-hidden"
            >
                <TabsList className="w-full grid grid-cols-2">
                    <TabsTrigger value="pending" className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        <span className="hidden sm:inline">Pending Payments</span>
                        <span className="sm:hidden">Pending</span>
                    </TabsTrigger>
                    {isAdmin && (
                        <TabsTrigger value="history" className="flex items-center gap-2">
                            <History className="h-4 w-4" />
                            <span className="hidden sm:inline">Payment History</span>
                            <span className="sm:hidden">History</span>
                        </TabsTrigger>
                    )}
                </TabsList>

                {/* Pending Payments Tab */}
                <TabsContent value="pending" className="flex-1 overflow-hidden mt-4">
                    <div className="h-full flex flex-col lg:grid lg:grid-cols-5 gap-4 md:gap-6 overflow-hidden">
                        {/* Left Panel: Pending Orders Queue - Hide on mobile when order is selected */}
                        <div className={`lg:col-span-2 overflow-y-auto ${selectedOrder ? 'hidden lg:block' : 'block'}`}>
                            <h2 className="text-lg md:text-xl font-semibold mb-4">Pending Orders</h2>
                            <PendingOrdersQueue
                                orders={pendingOrders}
                                selectedOrderId={selectedOrder?.id || null}
                                onSelectOrder={(order) => setSelectedOrder(order as OrderWithItems)}
                            />
                        </div>

                        {/* Right Panel: Payment Panel - Show on mobile only when order is selected */}
                        <div className={`lg:col-span-3 overflow-y-auto ${selectedOrder ? 'block' : 'hidden lg:block'}`}>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg md:text-xl font-semibold">Payment</h2>
                                {/* Back button for mobile */}
                                {selectedOrder && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSelectedOrder(null)}
                                        className="lg:hidden"
                                    >
                                        ← Back to Orders
                                    </Button>
                                )}
                            </div>
                            <PaymentPanel
                                order={selectedOrder}
                                onCompletePayment={handleCompletePayment}
                                processing={processing}
                            />
                        </div>
                    </div>
                </TabsContent>

                {/* Payment History Tab (Admin Only) */}
                <TabsContent value="history" className="flex-1 overflow-hidden mt-4">
                    <PaymentHistory
                        orders={paymentHistory}
                        onReprint={handleReprint}
                    />
                </TabsContent>
            </Tabs>

            {/* Receipt Dialog */}
            <ReceiptDialog
                open={receiptOpen}
                onOpenChange={setReceiptOpen}
                receipt={receiptData}
            />
        </div>
    )
}
