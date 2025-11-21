import { formatPhone } from './phone-utils'

export interface ReceiptData {
    receiptNumber: string
    orderNumber: string
    date: string
    time: string
    cashier: string
    items: Array<{
        name: string
        quantity: number
        price: number
        total: number
    }>
    taxableAmount: number  // Pre-VAT amount
    vatAmount: number      // VAT (16%)
    total: number          // VAT-inclusive
    paymentMethod: string
    paymentDetails?: string  // Display string for receipt
    qrCode?: string  // Future: actual KRA QR
}

interface Order {
    id: string
    total: number
    order_items: Array<{
        menu_item: {
            name: string
        }
        quantity: number
        unit_price: number
        subtotal: number
    }>
}

interface PaymentDetails {
    method: 'cash' | 'mpesa'
    amount_received?: number
    change_given?: number
    phone?: string
    transaction_id?: string
}

/**
 * Generate KRA-compliant receipt
 * ASSUMPTION: All prices are VAT-inclusive (standard in Kenya)
 */
export function generateKRAReceipt(
    order: Order,
    paymentDetails: PaymentDetails,
    cashierName?: string
): ReceiptData {
    const now = new Date()

    // VAT calculation (16% VAT rate in Kenya)
    // ASSUMPTION: order.total is VAT-inclusive
    const VAT_RATE = 0.16
    const taxableAmount = order.total / (1 + VAT_RATE)
    const vatAmount = order.total - taxableAmount

    // Format payment details for display
    let paymentDisplayText = ''
    if (paymentDetails.method === 'cash') {
        paymentDisplayText = `CASH - Received: KES ${paymentDetails.amount_received?.toFixed(2)}, Change: KES ${paymentDetails.change_given?.toFixed(2)}`
    } else if (paymentDetails.method === 'mpesa') {
        // Display local phone format on receipt
        const displayPhone = paymentDetails.phone ? formatPhone(paymentDetails.phone) : ''
        paymentDisplayText = `M-PESA - ${displayPhone} - ${paymentDetails.transaction_id}`
    }

    return {
        receiptNumber: `KRA-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${order.id.slice(0, 8).toUpperCase()}`,
        orderNumber: order.id.slice(0, 8).toUpperCase(),
        date: now.toLocaleDateString('en-KE'),
        time: now.toLocaleTimeString('en-KE', { hour12: false }),
        cashier: cashierName || 'Cashier',  // Use actual name or fallback
        items: order.order_items.map(item => ({
            name: item.menu_item.name,
            quantity: item.quantity,
            price: item.unit_price,
            total: item.subtotal
        })),
        taxableAmount,
        vatAmount,
        total: order.total,
        paymentMethod: paymentDetails.method.toUpperCase(),
        paymentDetails: paymentDisplayText,
        qrCode: `MOCK-QR-${order.id}`  // Mock for now, replace with KRA API
    }
}
