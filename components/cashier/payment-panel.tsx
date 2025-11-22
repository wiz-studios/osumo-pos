"use client"

import { useState } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"

interface Order {
    id: string
    table_number: string | null
    order_type: string
    total: number
    order_items: Array<{
        id: string
        quantity: number
        menu_item: {
            name: string
        }
        unit_price: number
        subtotal: number
    }>
}

interface PaymentPanelProps {
    order: Order | null
    onCompletePayment: (paymentMethod: 'cash' | 'mpesa', paymentData: any) => void
    processing: boolean
}

export function PaymentPanel({ order, onCompletePayment, processing }: PaymentPanelProps) {
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mpesa'>('mpesa')
    const [amountReceived, setAmountReceived] = useState<string>('')
    const [phoneNumber, setPhoneNumber] = useState<string>('')
    const [transactionCode, setTransactionCode] = useState<string>('')

    if (!order) {
        return (
            <Card className="h-full flex items-center justify-center">
                <CardContent className="text-center text-muted-foreground p-4 sm:p-6">
                    <p className="text-sm sm:text-lg">Select an order to process payment</p>
                </CardContent>
            </Card>
        )
    }

    const handleSubmit = () => {
        if (paymentMethod === 'cash') {
            onCompletePayment('cash', {
                amount_received: parseFloat(amountReceived)
            })
        } else {
            onCompletePayment('mpesa', {
                phone_number: phoneNumber,
                transaction_code: transactionCode
            })
        }
    }

    const calculateChange = () => {
        const received = parseFloat(amountReceived) || 0
        return Math.max(0, received - order.total)
    }

    const isValid = () => {
        if (paymentMethod === 'cash') {
            const received = parseFloat(amountReceived) || 0
            return received >= order.total
        } else {
            return phoneNumber.trim() !== '' && transactionCode.trim() !== ''
        }
    }

    // VAT calculation
    const VAT_RATE = 0.16
    const taxableAmount = order.total / (1 + VAT_RATE)
    const vatAmount = order.total - taxableAmount

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="p-3 sm:p-6">
                <CardTitle className="flex justify-between items-center text-base sm:text-lg">
                    <span className="truncate">{order.table_number ? `Table ${order.table_number}` : 'TAKEAWAY'}</span>
                    <span className="text-xs sm:text-sm font-normal text-muted-foreground capitalize ml-2">
                        {order.order_type}
                    </span>
                </CardTitle>
            </CardHeader>

            <CardContent className="flex-1 space-y-3 sm:space-y-4 p-3 sm:p-6">
                {/* Order Items */}
                <div className="space-y-1 sm:space-y-2">
                    <h3 className="font-semibold text-sm sm:text-base">Items</h3>
                    <div className="space-y-1 max-h-32 sm:max-h-40 overflow-y-auto">
                        {order.order_items.map((item) => (
                            <div key={item.id} className="flex justify-between text-xs sm:text-sm gap-2">
                                <span className="truncate">
                                    {item.quantity}× {item.menu_item?.name || 'Unknown Item'}
                                </span>
                                <span className="font-medium flex-shrink-0">
                                    KES {item.subtotal.toFixed(2)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <Separator />

                {/* Totals */}
                <div className="space-y-1">
                    <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-muted-foreground">Taxable Amount:</span>
                        <span>KES {taxableAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-muted-foreground">VAT (16%):</span>
                        <span>KES {vatAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-base sm:text-lg font-bold pt-2 border-t">
                        <span>TOTAL:</span>
                        <span className="text-primary">KES {order.total.toFixed(2)}</span>
                    </div>
                </div>

                <Separator />

                {/* Payment Method */}
                <div className="space-y-2 sm:space-y-3">
                    <Label className="text-sm sm:text-base">Payment Method</Label>
                    <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as 'cash' | 'mpesa')}>
                        <div className="flex items-center space-x-2 py-1">
                            <RadioGroupItem value="mpesa" id="mpesa" className="h-5 w-5" />
                            <Label htmlFor="mpesa" className="cursor-pointer text-sm sm:text-base">M-Pesa</Label>
                        </div>
                        <div className="flex items-center space-x-2 py-1">
                            <RadioGroupItem value="cash" id="cash" className="h-5 w-5" />
                            <Label htmlFor="cash" className="cursor-pointer text-sm sm:text-base">Cash</Label>
                        </div>
                    </RadioGroup>
                </div>

                {/* Payment Forms */}
                {paymentMethod === 'cash' ? (
                    <div className="space-y-2 sm:space-y-3">
                        <div>
                            <Label htmlFor="amount" className="text-sm sm:text-base">Amount Received</Label>
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={amountReceived}
                                onChange={(e) => setAmountReceived(e.target.value)}
                                className="text-base sm:text-lg h-10 sm:h-11"
                            />
                        </div>
                        {amountReceived && (
                            <div className="p-2 sm:p-3 bg-muted rounded-md">
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold text-sm sm:text-base">Change:</span>
                                    <span className="text-lg sm:text-xl font-bold text-green-600">
                                        KES {calculateChange().toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-2 sm:space-y-3">
                        <div>
                            <Label htmlFor="phone" className="text-sm sm:text-base">Phone Number</Label>
                            <Input
                                id="phone"
                                type="tel"
                                placeholder="0712345678"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                className="h-10 sm:h-11"
                            />
                            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                                Format: 07XX, 01XX, or 254XX
                            </p>
                        </div>
                        <div>
                            <Label htmlFor="txn" className="text-sm sm:text-base">M-Pesa Transaction Code</Label>
                            <Input
                                id="txn"
                                type="text"
                                placeholder="ABC123XYZ"
                                value={transactionCode}
                                onChange={(e) => setTransactionCode(e.target.value.toUpperCase())}
                                className="uppercase h-10 sm:h-11"
                            />
                            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                                6-12 alphanumeric characters
                            </p>
                        </div>
                    </div>
                )}
            </CardContent>

            <CardFooter className="p-3 sm:p-6">
                <Button
                    className="w-full h-11 sm:h-12 text-base sm:text-lg"
                    onClick={handleSubmit}
                    disabled={!isValid() || processing}
                >
                    {processing ? 'Processing...' : 'Complete Payment'}
                </Button>
            </CardFooter>
        </Card>
    )
}
