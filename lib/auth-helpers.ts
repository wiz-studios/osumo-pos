import bcrypt from 'bcryptjs'
import { getSupabaseClient } from './supabase/client'

/**
 * Hash a 4-digit PIN using bcrypt
 */
export async function hashPin(pin: string): Promise<string> {
    const saltRounds = 10
    return await bcrypt.hash(pin, saltRounds)
}

/**
 * Verify a PIN against a hash
 */
export async function verifyPin(pin: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(pin, hash)
}

/**
 * Log an activity to the activity_logs table
 */
export async function logActivity(
    staffId: string,
    restaurantId: string,
    action: string,
    details?: any
): Promise<void> {
    const supabase = getSupabaseClient()

    await supabase.from('activity_logs').insert({
        staff_id: staffId,
        restaurant_id: restaurantId,
        action,
        details
    })
}

/**
 * Check if a role has permission to perform an action.
 * Implements a simple Role-Based Access Control (RBAC) system.
 * - Managers have full access ('*').
 * - Other roles have specific allowed actions.
 */
export function checkPermission(role: string, action: string): boolean {
    const permissions: Record<string, string[]> = {
        manager: ['*'], // Full access
        cashier: ['take_orders', 'process_payments', 'view_menu'],
        kitchen: ['view_orders', 'update_order_status', 'view_inventory']
    }

    const rolePermissions = permissions[role] || []

    // Manager has all permissions
    if (rolePermissions.includes('*')) return true

    // Check specific permission
    return rolePermissions.includes(action)
}

/**
 * Get full staff name
 */
export function getStaffName(staff: { first_name?: string; last_name?: string }): string {
    if (staff.first_name && staff.last_name) {
        return `${staff.first_name} ${staff.last_name}`
    }
    return staff.first_name || staff.last_name || 'Unknown'
}
