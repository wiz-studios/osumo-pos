"use client"

import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card } from "@/components/ui/card"

interface TableSelectorProps {
    orderType: 'dine-in' | 'takeaway'
    onOrderTypeChange: (type: 'dine-in' | 'takeaway') => void
    selectedTable: string
    onTableChange: (table: string) => void
}

export function TableSelector({
    orderType,
    onOrderTypeChange,
    selectedTable,
    onTableChange
}: TableSelectorProps) {
    // Generate table list (1-20)
    const tables = Array.from({ length: 20 }, (_, i) => `Table ${i + 1}`)

    return (
        <Card className="p-4 space-y-4 bg-card border-2">
            <div className="space-y-2">
                <Label className="text-base font-semibold">Order Type</Label>
                <RadioGroup
                    value={orderType}
                    onValueChange={(v) => onOrderTypeChange(v as 'dine-in' | 'takeaway')}
                    className="flex gap-4"
                >
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="dine-in" id="dine-in" />
                        <Label htmlFor="dine-in" className="cursor-pointer font-normal">
                            🍽️ Dine-in
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="takeaway" id="takeaway" />
                        <Label htmlFor="takeaway" className="cursor-pointer font-normal">
                            📦 Takeaway
                        </Label>
                    </div>
                </RadioGroup>
            </div>

            {orderType === 'dine-in' && (
                <div className="space-y-2">
                    <Label className="text-base font-semibold">
                        Select Table <span className="text-destructive">*</span>
                    </Label>
                    <Select value={selectedTable} onValueChange={onTableChange}>
                        <SelectTrigger
                            className={`h-12 text-base ${!selectedTable ? "border-destructive border-2" : ""}`}
                        >
                            <SelectValue placeholder="Choose a table..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                            {tables.map(table => (
                                <SelectItem key={table} value={table} className="text-base">
                                    {table}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {!selectedTable && (
                        <p className="text-sm text-destructive">
                            Table selection is required for dine-in orders
                        </p>
                    )}
                </div>
            )}

            {orderType === 'takeaway' && (
                <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                    ℹ️ This order will be marked as Takeaway
                </div>
            )}
        </Card>
    )
}
