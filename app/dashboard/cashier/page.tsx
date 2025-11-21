"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase/client"
import { useStaffRole } from "@/hooks/use-staff-role"
import { useToast } from "@/hooks/use-toast"
import { PendingOrdersQueue } from "@/components/cashier/pending-orders-queue"
import { PaymentPanel } from "@/components/cashier/payment-panel"
import { ReceiptDialog } from "@/components/cashier/receipt-dialog"
import { generateKRAReceipt, ReceiptData } from "@/lib/receipt-generator"
import { normalizePhone, isValidKenyanPhone } from "@/lib/phone-utils"
import { CreditCard } from "lucide-react"

interface OrderWithItems {
    id: string
    table_number: string | null
    order_type: string
    status: string
    total: number
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
    const { role, staffId, loading: roleLoading } = useStaffRole()
    const { toast } = useToast()

    const [pendingOrders, setPendingOrders] = useState<OrderWithItems[]>([])
    const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null)
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState(false)
    const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)
    const [receiptOpen, setReceiptOpen] = useState(false)

    // Role-based access control
    useEffect(() => {
        if (!roleLoading && role !== 'cashier') {
            router.push('/unauthorized')
        }
    }, [role, roleLoading, router])

    // Fetch pending orders
    useEffect(() => {
        if (staffId && role === 'cashier') {
            fetchPendingOrders()
            setupRealtime()
        }
    }, [staffId, role])

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
                (payload) => {
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
            const paymentDetails = paymentMethod === 'cash'
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

            // 3. Update order (with double-payment prevention)
            const { error: updateError } = await supabase
                .from('orders')
                .update({
                    status: 'paid',
                    payment_status: 'paid',
                    payment_method: paymentMethod,
                    cashier_id: staffId,
                    paid_at: new Date().toISOString(),
                    payment_details: paymentDetails
                })
                .eq('id', selectedOrder.id)
                .eq('status', 'pending_payment')  // 🔒 CRITICAL: Prevents double-payment

            if (updateError) throw updateError

            // 4. Log event (DO NOT store full transaction details in logs)
            const { error: eventError } = await supabase
                .from('order_events')
                .insert({
                    order_id: selectedOrder.id,
                    from_status: 'pending_payment',
                    to_status: 'paid',
                    triggered_by: staffId,
                    event_type: 'payment',
                    metadata: {
                        payment_method: paymentMethod,
                        amount: selectedOrder.total,
                        timestamp: new Date().toISOString()
                        // 🔒 Security: Never log full TXN IDs or phone numbers
                    }
                })

            if (eventError) console.error('Event logging error:', eventError)

            // 5. Generate receipt
            const receipt = generateKRAReceipt(selectedOrder, paymentDetails)

            // 6. Show receipt
            setReceiptData(receipt)
            setReceiptOpen(true)

            // 7. Clear selection
            setSelectedOrder(null)

            toast({
                title: "Payment Complete",
                description: `Order paid via ${paymentMethod.toUpperCase()}`
            })

        } catch (error: any) {
            console.error('Payment error:', error)
            toast({
                title: "Payment Failed",
                description: error.message,
                variant: "destructive"
            })
        } finally {
            setProcessing(false)
        }
    }

    if (roleLoading || loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-lg">Loading cashier dashboard...</div>
            </div>
        )
    }

    if (role !== 'cashier') {
        return null  // Will redirect via useEffect
    }

    return (
        <div className="h-screen flex flex-col p-6 gap-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <CreditCard className="h-8 w-8 text-primary" />
                <div>
                    <h1 className="text-3xl font-bold">Cashier Dashboard</h1>
                    <p className="text-muted-foreground">
                        {pendingOrders.length} pending {pendingOrders.length === 1 ? 'order' : 'orders'}
                    </p>
                </div>
            </div>

            {/* Two-Panel Layout */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-6 overflow-hidden">
                {/* Left Panel: Pending Orders Queue (40%) */}
                <div className="lg:col-span-2 overflow-y-auto">
                    <h2 className="text-xl font-semibold mb-4">Pending Orders</h2>
                    <PendingOrdersQueue
                        orders={pendingOrders}
                        selectedOrderId={selectedOrder?.id || null}
                        onSelectOrder={setSelectedOrder}
                    />
                </div>

                {/* Right Panel: Payment Panel (60%) */}
                <div className="lg:col-span-3 overflow-y-auto">
                    <h2 className="text-xl font-semibold mb-4">Payment</h2>
                    <PaymentPanel
                        order={selectedOrder}
                        onCompletePayment={handleCompletePayment}
                        processing={processing}
                    />
                </div>
            </div>

            {/* Receipt Dialog */}
            <ReceiptDialog
                open={receiptOpen}
                onOpenChange={setReceiptOpen}
                receipt={receiptData}
            />
        </div>
    )
}
