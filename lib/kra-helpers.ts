import QRCode from 'qrcode'
import { format } from 'date-fns'
import type { Order, OrderItem, Restaurant, Invoice } from './types'

const VAT_RATE = 16 // Kenya VAT rate: 16%

/**
 * Generate a unique invoice number for the day
 * Format: INV-YYYYMMDD-XXX
 */
export function generateInvoiceNumber(date: Date, sequenceNumber: number): string {
    const dateStr = format(date, 'yyyyMMdd')
    const seq = sequenceNumber.toString().padStart(3, '0')
    return `INV-${dateStr}-${seq}`
}

/**
 * Calculate VAT from VAT-inclusive amount
 * In Kenya, prices are typically VAT-inclusive
 */
export function calculateVAT(totalAmount: number): {
    taxableAmount: number
    vatAmount: number
    totalAmount: number
} {
    const taxableAmount = totalAmount / (1 + VAT_RATE / 100)
    const vatAmount = totalAmount - taxableAmount

    return {
        taxableAmount: Math.round(taxableAmount * 100) / 100,
        vatAmount: Math.round(vatAmount * 100) / 100,
        totalAmount
    }
}

/**
 * Generate QR code data URL for KRA verification
 */
export async function generateQRCode(invoiceData: {
    invoiceNumber: string
    kraPin: string
    totalAmount: number
}): Promise<string> {
    // Mock KRA verification URL
    const verificationUrl = `https://tims.kra.go.ke/verify?inv=${invoiceData.invoiceNumber}&pin=${invoiceData.kraPin}&amt=${invoiceData.totalAmount}`

    try {
        // Generate QR code as data URL
        const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
            width: 200,
            margin: 1,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        })
        return qrDataUrl
    } catch (error) {
        console.error('QR code generation failed:', error)
        return ''
    }
}

/**
 * Format KRA-compliant receipt text.
 * Generates a plain text representation of the receipt suitable for printing.
 * Includes:
 * - Header (Business Name, PIN, Invoice #)
 * - Itemized list
 * - Tax breakdown (VAT)
 * - Footer (Payment info, QR placeholder)
 */
export function formatKRAReceipt(
    order: Order & { order_items?: OrderItem[] },
    invoice: Invoice,
    restaurant: Restaurant
): string {
    const isVATRegistered = restaurant.vat_registered
    const businessName = restaurant.business_name || restaurant.name
    const kraPin = restaurant.kra_pin || 'Not Set'

    let receipt = ''

    // Header
    receipt += `${businessName.toUpperCase()}\n`
    receipt += `KRA PIN: ${kraPin}\n`

    if (isVATRegistered) {
        receipt += `TAX INVOICE\n`
        receipt += `Invoice #: ${invoice.invoice_number}\n`
    } else {
        receipt += `Receipt #: ${invoice.invoice_number}\n`
    }

    receipt += `Date: ${format(new Date(invoice.created_at), 'dd MMM yyyy')}\n`
    receipt += `Time: ${format(new Date(invoice.created_at), 'HH:mm')}\n`
    receipt += `${'='.repeat(40)}\n`

    // Items
    if (order.order_items) {
        order.order_items.forEach(item => {
            const itemName = item.menu_item?.name || 'Item'
            const qty = item.quantity
            const price = item.subtotal

            receipt += `${qty}x ${itemName}\n`
            receipt += `${' '.repeat(30)}KES ${price.toFixed(2)}\n`
        })
    }

    receipt += `${'-'.repeat(40)}\n`

    // Totals
    if (isVATRegistered && invoice.taxable_amount && invoice.vat_amount) {
        receipt += `Subtotal (Excl. VAT):${' '.repeat(10)}KES ${invoice.taxable_amount.toFixed(2)}\n`
        receipt += `VAT (${VAT_RATE}%):${' '.repeat(22)}KES ${invoice.vat_amount.toFixed(2)}\n`
        receipt += `${'-'.repeat(40)}\n`
        receipt += `TOTAL (Incl. VAT):${' '.repeat(12)}KES ${invoice.total_amount.toFixed(2)}\n`
    } else {
        receipt += `TOTAL:${' '.repeat(26)}KES ${invoice.total_amount.toFixed(2)}\n`
    }

    receipt += `${'='.repeat(40)}\n`

    // Payment info
    if (order.payment_method) {
        receipt += `Payment: ${order.payment_method.toUpperCase()}\n`
    }

    // QR Code placeholder
    receipt += `\n[QR CODE]\n`
    receipt += `Scan to verify on KRA TIMS\n`
    receipt += `${invoice.is_mock_tims ? '(Mock TIMS - Demo Mode)\n' : ''}`
    receipt += `\n`

    // Footer
    receipt += `Thank you! Karibu tena!\n`
    receipt += `Served by: ${order.staff_id || 'Staff'}\n`

    return receipt
}

/**
 * Get the next sequence number for today
 */
export async function getNextSequenceNumber(
    supabase: any,
    restaurantId: string,
    date: Date
): Promise<number> {
    const dateStr = format(date, 'yyyy-MM-dd')

    const { data, error } = await supabase
        .from('invoices')
        .select('sequence_number')
        .eq('restaurant_id', restaurantId)
        .eq('invoice_date', dateStr)
        .order('sequence_number', { ascending: false })
        .limit(1)

    if (error) {
        console.error('Error fetching sequence number:', error)
        return 1
    }

    if (!data || data.length === 0) {
        return 1
    }

    return data[0].sequence_number + 1
}
