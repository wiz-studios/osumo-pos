"use client"

import { Card, CardContent } from "@/components/ui/card"
import type { Order } from "@/lib/types"

interface ReceiptComponentProps {
  order: Order
  paymentAmount: number
  paymentMethod: string
  reference?: string
}

export function ReceiptComponent({ order, paymentAmount, paymentMethod, reference }: ReceiptComponentProps) {
  return (
    <div className="w-full max-w-sm mx-auto print:max-w-none">
      <Card className="border-4 border-foreground bg-background print:border-black">
        <CardContent className="p-4 font-mono text-sm space-y-2 text-center print:p-0">
          {/* Header */}
          <div className="space-y-1">
            <p className="font-bold text-lg">NRB POS</p>
            <p className="text-xs">Restaurant Management System</p>
            <p className="text-xs">Nairobi, Kenya</p>
          </div>

          <div className="border-t border-foreground py-2 text-xs">
            <p>Receipt #{order.id.slice(0, 8)}</p>
            <p>{new Date(order.created_at).toLocaleString()}</p>
          </div>

          {/* Order Details */}
          <div className="border-t border-foreground py-2 text-xs text-left">
            <p>
              <span className="w-16 inline-block">Type:</span>
              {order.order_type.toUpperCase()}
            </p>
            {order.table_number && (
              <p>
                <span className="w-16 inline-block">Table:</span>
                {order.table_number}
              </p>
            )}
            {order.customer_name && (
              <p>
                <span className="w-16 inline-block">Customer:</span>
                {order.customer_name}
              </p>
            )}
          </div>

          {/* Items */}
          <div className="border-t border-b border-foreground py-2">
            <div className="text-left text-xs space-y-1">
              <div className="flex justify-between font-bold">
                <span>Item</span>
                <span>Amount</span>
              </div>
              {order.order_items?.map((item, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>
                    {item.quantity}x {item.menu_item?.name}
                  </span>
                  <span>KES {item.subtotal.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="space-y-1 text-xs font-bold text-left">
            <div className="flex justify-between">
              <span>SUBTOTAL:</span>
              <span>KES {order.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg border-t border-foreground pt-1">
              <span>TOTAL:</span>
              <span>KES {order.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Info */}
          <div className="border-t border-foreground py-2 text-xs text-left">
            <p>
              <span className="font-bold">Payment Method:</span> {paymentMethod.toUpperCase()}
            </p>
            <p>
              <span className="font-bold">Amount Paid:</span> KES {paymentAmount.toFixed(2)}
            </p>
            {paymentAmount < order.total && (
              <p>
                <span className="font-bold">Balance Due:</span> KES {(order.total - paymentAmount).toFixed(2)}
              </p>
            )}
            {reference && (
              <p>
                <span className="font-bold">Reference:</span> {reference}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-foreground pt-2 text-xs">
            <p>Thank you for your purchase!</p>
            <p className="text-[10px] text-muted-foreground">{new Date().toLocaleTimeString()}</p>
          </div>

          <style>{`
            @media print {
              body {
                margin: 0;
                padding: 0;
              }
              .print\\:max-w-none {
                max-width: none !important;
              }
              .print\\:border-black {
                border-color: black !important;
              }
              .print\\:p-0 {
                padding: 0 !important;
              }
            }
          `}</style>
        </CardContent>
      </Card>
    </div>
  )
}
