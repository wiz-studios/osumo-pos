"use client"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ReceiptData } from "@/lib/receipt-generator"
import { Printer, X } from "lucide-react"

interface ReceiptDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    receipt: ReceiptData | null
}

export function ReceiptDialog({ open, onOpenChange, receipt }: ReceiptDialogProps) {
    if (!receipt) return null

    const handlePrint = () => {
        window.print()
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
                <DialogTitle className="sr-only">Payment Receipt</DialogTitle>

                {/* Modern Receipt Design */}
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 relative">
                    {/* Close Button */}
                    <button
                        onClick={() => onOpenChange(false)}
                        className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/50 transition-colors"
                    >
                        <X className="h-5 w-5 text-slate-600" />
                    </button>

                    {/* Receipt Paper Effect */}
                    <div className="bg-white shadow-xl rounded-lg overflow-hidden border border-slate-200">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6 text-center">
                            <div className="font-bold text-3xl tracking-wide mb-1">OSUMO</div>
                            <div className="text-sm opacity-90">Authentic Kenyan Cuisine</div>
                            <div className="text-xs opacity-75 mt-2">PIN: P051234567X</div>
                        </div>

                        {/* Receipt Content - Scrollable */}
                        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                            {/* Receipt Info */}
                            <div className="space-y-1 text-sm border-b border-dashed border-slate-300 pb-4">
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Receipt No:</span>
                                    <span className="font-mono font-semibold">{receipt.receiptNumber.slice(-12)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Date:</span>
                                    <span className="font-medium">{receipt.date} {receipt.time}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Cashier:</span>
                                    <span className="font-medium">{receipt.cashier}</span>
                                </div>
                            </div>

                            {/* Items */}
                            <div className="space-y-3">
                                <h3 className="font-semibold text-sm text-slate-700 uppercase tracking-wide">Order Items</h3>
                                {receipt.items.map((item, i) => (
                                    <div key={i} className="flex justify-between items-start gap-3">
                                        <div className="flex-1">
                                            <div className="font-medium text-slate-900">{item.name}</div>
                                            <div className="text-xs text-slate-500">
                                                {item.quantity} × KES {item.price.toFixed(2)}
                                            </div>
                                        </div>
                                        <div className="font-semibold text-slate-900 tabular-nums">
                                            KES {item.total.toFixed(2)}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Totals */}
                            <div className="space-y-2 border-t border-dashed border-slate-300 pt-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Subtotal (Taxable):</span>
                                    <span className="font-medium tabular-nums">KES {receipt.taxableAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">VAT (16%):</span>
                                    <span className="font-medium tabular-nums">KES {receipt.vatAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold border-t-2 border-slate-300 pt-2 mt-2">
                                    <span>TOTAL:</span>
                                    <span className="tabular-nums">KES {receipt.total.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Payment Details */}
                            <div className="bg-slate-50 -mx-6 px-6 py-4">
                                <div className="text-sm space-y-1">
                                    <div className="flex justify-between font-semibold">
                                        <span className="text-slate-700">Payment Method:</span>
                                        <span className="text-emerald-700">{receipt.paymentMethod}</span>
                                    </div>
                                    {receipt.paymentDetails && (
                                        <div className="text-xs text-slate-600 mt-2">
                                            {receipt.paymentDetails}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* QR Code */}
                            <div className="text-center py-4 border-t border-dashed border-slate-300">
                                <div className="inline-block bg-slate-100 p-3 rounded">
                                    <div className="text-xs text-slate-500 mb-1">KRA Verification Code</div>
                                    <div className="font-mono text-xs text-slate-700">{receipt.qrCode}</div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="text-center text-sm space-y-1 pb-2">
                                <div className="font-semibold text-slate-800">Thank you for dining with us!</div>
                                <div className="text-xs text-slate-500">We hope to see you again soon</div>
                                <div className="text-xs text-slate-400 mt-3">Karibu Tena! 🇰🇪</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 p-4 bg-slate-50 border-t">
                    <Button
                        variant="outline"
                        className="flex-1"
                        onClick={handlePrint}
                    >
                        <Printer className="h-4 w-4 mr-2" />
                        Print Receipt
                    </Button>
                    <Button
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => onOpenChange(false)}
                    >
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
