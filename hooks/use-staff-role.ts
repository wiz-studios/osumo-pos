import { useState, useEffect } from 'react'

/**
 * Custom hook to manage staff role and permissions.
 * Reads staff details from localStorage for performance.
 * Listens for storage events to sync state across tabs/windows.
 */
export function useStaffRole() {
    const [role, setRole] = useState<string | null>(null)
    const [staffId, setStaffId] = useState<string | null>(null)
    const [staffName, setStaffName] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Function to read staff info from localStorage
        const loadStaffData = () => {
            const storedRole = localStorage.getItem('current_staff_role')
            const storedId = localStorage.getItem('current_staff_id')
            const storedName = localStorage.getItem('current_staff_name')

            setRole(storedRole)
            setStaffId(storedId)
            setStaffName(storedName)
            setLoading(false)
        }

        // Load initial data
        loadStaffData()

        // Listen for storage changes (e.g., from logout or login)
        const handleStorageChange = (e: StorageEvent) => {
            // Only react to changes in staff-related keys
            if (e.key === 'current_staff_role' ||
                e.key === 'current_staff_id' ||
                e.key === 'current_staff_name' ||
                e.key === null) { // null means localStorage.clear() was called
                loadStaffData()
            }
        }

        window.addEventListener('storage', handleStorageChange)

        // Cleanup listener on unmount
        return () => {
            window.removeEventListener('storage', handleStorageChange)
        }
    }, [])

    const isManager = role === 'manager'
    const isCashier = role === 'cashier'
    const isKitchen = role === 'kitchen'

    /**
     * Checks if the current staff member has access to a specific feature.
     * Maps features to allowed roles.
     */
    const canAccess = (feature: string): boolean => {
        if (!role) return false

        // Manager has access to everything
        if (isManager) return true

        // Define feature permissions
        const permissions: Record<string, string[]> = {
            'menu': ['manager'],
            'staff': ['manager'],
            'reports': ['manager'],
            'inventory': ['manager'],
            'inventory_view': ['manager', 'kitchen'],
            'pos': ['manager', 'cashier'],
            'orders': ['manager', 'cashier', 'kitchen'],
            'activity': ['manager']
        }

        return permissions[feature]?.includes(role) || false
    }

    return {
        role,
        staffId,
        staffName,
        loading,
        isManager,
        isCashier,
        isKitchen,
        canAccess
    }
}
