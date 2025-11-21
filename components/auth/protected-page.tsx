"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useStaffRole } from "@/hooks/use-staff-role"

interface ProtectedPageProps {
    children: React.ReactNode
    allowedRoles: string[]
    redirectTo?: string
}

export function ProtectedPage({ children, allowedRoles, redirectTo = "/dashboard" }: ProtectedPageProps) {
    const router = useRouter()
    const { role, loading: roleLoading } = useStaffRole()
    const [isAuthorized, setIsAuthorized] = useState(false)

    useEffect(() => {
        // Wait for role to load
        if (roleLoading) return

        if (!role) {
            // No role means not logged in via staff login
            router.push('/auth/staff-login')
            return
        }

        if (!allowedRoles.includes(role)) {
            // User doesn't have permission
            router.push(redirectTo)
            return
        }

        setIsAuthorized(true)
    }, [role, roleLoading, allowedRoles, redirectTo, router])

    if (roleLoading || !isAuthorized) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Checking permissions...</p>
                </div>
            </div>
        )
    }

    return <>{children}</>
}
