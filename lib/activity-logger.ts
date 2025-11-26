import { getSupabaseClient } from "./supabase/client"
import type { ActivityActionType, ActivityLogDetails } from "./types"

/**
 * Centralized activity logging utility for audit trail
 * Logs all sensitive actions in the POS system
 */

interface LogActivityParams {
    actionType: ActivityActionType | string
    targetId?: string
    targetType?: string
    details?: ActivityLogDetails
    staffId?: string
    restaurantId?: string
}

/**
 * Main function to log an activity
 * Automatically resolves staff_id and restaurant_id if not provided
 */
export async function logActivity({
    actionType,
    targetId,
    targetType,
    details,
    staffId,
    restaurantId,
}: LogActivityParams): Promise<void> {
    try {
        console.log('🔍 Activity Logger: Starting log for', actionType)
        const supabase = getSupabaseClient()

        // Get current user if staff_id not provided
        let finalStaffId = staffId
        let finalRestaurantId = restaurantId

        if (!finalStaffId || !finalRestaurantId) {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                console.warn('❌ Cannot log activity: No authenticated user')
                return
            }

            console.log('✅ User authenticated:', user.id)

            const { data: staff, error: staffError } = await supabase
                .from('staff')
                .select('id, restaurant_id')
                .eq('user_id', user.id)
                .single()

            if (staffError) {
                console.error('❌ Staff query error:', staffError)
            }

            if (!staff) {
                console.warn('❌ Cannot log activity: Staff record not found for user', user.id)
                return
            }

            console.log('✅ Staff found:', staff.id, 'Restaurant:', staff.restaurant_id)

            finalStaffId = finalStaffId || staff.id
            finalRestaurantId = finalRestaurantId || staff.restaurant_id
        }

        // Insert activity log
        console.log('📝 Inserting activity log:', {
            staff_id: finalStaffId,
            restaurant_id: finalRestaurantId,
            action_type: actionType,
            target_id: targetId,
            target_type: targetType,
        })

        const { error } = await supabase
            .from('activity_logs')
            .insert({
                staff_id: finalStaffId,
                restaurant_id: finalRestaurantId,
                action_type: actionType,
                target_id: targetId,
                target_type: targetType,
                details: details || {},
            })

        if (error) {
            console.error('❌ Failed to log activity:', error)
            // Don't throw - logging failures shouldn't break operations
        } else {
            console.log('✅ Activity logged successfully!')
        }
    } catch (error) {
        console.error('❌ Activity logging error:', error)
        // Silently fail - logging is non-critical
    }
}

/**
 * Helper: Log payment processing
 */
export async function logPayment({
    orderId,
    paymentMethod,
    amount,
    transactionId,
    phone,
    success = true,
    errorMessage,
    staffId,
    restaurantId,
}: {
    orderId: string
    paymentMethod: 'cash' | 'mpesa'
    amount: number
    transactionId?: string
    phone?: string
    success?: boolean
    errorMessage?: string
    staffId?: string
    restaurantId?: string
}): Promise<void> {
    const details: ActivityLogDetails = {
        payment_method: paymentMethod,
        amount,
    }

    // Mask sensitive data
    if (transactionId) {
        details.transaction_id_masked = maskTransactionId(transactionId)
    }
    if (phone) {
        details.phone_masked = maskPhone(phone)
    }
    if (errorMessage) {
        details.notes = errorMessage
    }

    await logActivity({
        actionType: success ? 'payment_processed' : 'payment_failed',
        targetId: orderId,
        targetType: 'order',
        details,
        staffId,
        restaurantId,
    })
}

/**
 * Helper: Log stock adjustment
 */
export async function logStockAdjustment({
    inventoryItemId,
    itemName,
    quantityChange,
    adjustmentType,
    reason,
    oldQuantity,
    newQuantity,
    staffId,
    restaurantId,
}: {
    inventoryItemId: string
    itemName: string
    quantityChange: number
    adjustmentType: 'spoilage' | 'wastage' | 'restock' | 'correction'
    reason?: string
    oldQuantity?: number
    newQuantity?: number
    staffId?: string
    restaurantId?: string
}): Promise<void> {
    await logActivity({
        actionType: 'stock_adjusted',
        targetId: inventoryItemId,
        targetType: 'inventory',
        details: {
            item_name: itemName,
            quantity_change: quantityChange,
            adjustment_type: adjustmentType,
            reason,
            old_quantity: oldQuantity,
            new_quantity: newQuantity,
        },
        staffId,
        restaurantId,
    })
}

/**
 * Helper: Log discount application
 */
export async function logDiscount({
    orderId,
    discountAmount,
    discountPercentage,
    reason,
    staffId,
    restaurantId,
}: {
    orderId: string
    discountAmount?: number
    discountPercentage?: number
    reason?: string
    staffId?: string
    restaurantId?: string
}): Promise<void> {
    await logActivity({
        actionType: 'discount_applied',
        targetId: orderId,
        targetType: 'order',
        details: {
            discount_amount: discountAmount,
            discount_percentage: discountPercentage,
            reason,
        },
        staffId,
        restaurantId,
    })
}

/**
 * Helper: Log order void
 */
export async function logOrderVoid({
    orderId,
    reason,
    orderTotal,
    staffId,
    restaurantId,
}: {
    orderId: string
    reason: string
    orderTotal?: number
    staffId?: string
    restaurantId?: string
}): Promise<void> {
    await logActivity({
        actionType: 'order_voided',
        targetId: orderId,
        targetType: 'order',
        details: {
            reason,
            amount: orderTotal,
        },
        staffId,
        restaurantId,
    })
}

/**
 * Helper: Log staff login
 */
export async function logStaffLogin({
    staffId,
    restaurantId,
}: {
    staffId: string
    restaurantId: string
}): Promise<void> {
    await logActivity({
        actionType: 'staff_login',
        details: {
            notes: 'Staff logged in via PIN',
        },
        staffId,
        restaurantId,
    })
}

// Utility functions for data masking

function maskTransactionId(txnId: string): string {
    if (txnId.length <= 4) return '***'
    return txnId.slice(0, 3) + '***' + txnId.slice(-4)
}

function maskPhone(phone: string): string {
    // Remove any non-digit characters
    const digits = phone.replace(/\D/g, '')
    if (digits.length <= 4) return '***'
    return '***' + digits.slice(-4)
}
