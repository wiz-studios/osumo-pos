"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ReceiptData } from "@/lib/receipt-generator"
import { Printer } from "lucide-react"

interface ReceiptDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    receipt: ReceiptData | null
}

export function ReceiptDialog({ open, onOpenChange, receipt }: ReceiptDialogProps) {
    if (!receipt) return null

    // Format receipt lines for thermal printer (32 characters wide)
    const formatLine = (left: string, right: string, width: number = 32) => {
        const spaces = width - left.length - right.length
        return left + ' '.repeat(Math.max(0, spaces)) + right
    }

    const centerText = (text: string, width: number = 32) => {
        const spaces = Math.floor((width - text.length) / 2)
        return ' '.repeat(Math.max(0, spaces)) + text
    }

    const divider = '─'.repeat(32)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>Receipt</DialogTitle>
                </DialogHeader>

                {/* Thermal printer compatible: 32 chars, monospace */}
                <div className="font-mono text-xs max-w-[32ch] whitespace-pre bg-white p-4 border rounded-md">
                    {/* Header */}
                    <div className="text-center font-bold">
                        {centerText('RESTAURANT NAME')}
                        {'\n'}
                        {centerText('PIN: P051234567X')}
                        {'\n'}
                        {divider}
                        {'\n'}
                    </div>

                    {/* Receipt Info */}
                    <div>
                        Receipt: {receipt.receiptNumber.slice(-15)}
                        {'\n'}
                        Date: {receipt.date} {receipt.time}
                        {'\n'}
                        Cashier: {receipt.cashier}
                        {'\n'}
                        {divider}
                        {'\n'}
                    </div>

                    {/* Items */}
                    <div>
                        {receipt.items.map((item, i) => (
                            <div key={i}>
                                {formatLine(
                                    `${item.quantity}× ${item.name.slice(0, 18)}`,
                                    item.total.toFixed(2)
                                )}
                                {'\n'}
                            </div>
                        ))}
                        {divider}
                        {'\n'}
                    </div>

                    {/* Totals */}
                    <div>
                        {formatLine('Taxable Amount:', receipt.taxableAmount.toFixed(2))}
                        {'\n'}
                        {formatLine('VAT (16%):', receipt.vatAmount.toFixed(2))}
                        {'\n'}
                        {formatLine('TOTAL:', receipt.total.toFixed(2))}
                        {'\n'}
                        {divider}
                        {'\n'}
                    </div>

                    {/* Payment */}
                    <div>
                        Payment: {receipt.paymentMethod}
                        {'\n'}
                        {receipt.paymentDetails && (
                            <>
                                {receipt.paymentDetails.split(' - ').map((line, i) => (
                                    <div key={i}>
                                        {line.length > 32 ? line.slice(0, 32) : line}
                                        {'\n'}
                                    </div>
                                ))}
                            </>
                        )}
                        {divider}
                        {'\n'}
                    </div>

                    {/* QR Code Placeholder */}
                    <div className="text-center">
                        {centerText('[QR CODE]')}
                        {'\n'}
                        {centerText(receipt.qrCode || '')}
                        {'\n'}
                        {divider}
                        {'\n'}
                    </div>

                    {/* Footer */}
                    <div className="text-center">
                        {centerText('Thank you for your visit!')}
                        {'\n'}
                        {centerText('Come again soon')}
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => window.print()}>
                        <Printer className="h-4 w-4 mr-2" />
                        Print
                    </Button>
                    <Button onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
