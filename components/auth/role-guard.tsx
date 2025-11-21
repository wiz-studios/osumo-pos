"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import type { UserRole } from "@/lib/types"

interface RoleGuardProps {
  allowedRoles: UserRole[]
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function RoleGuard({ allowedRoles, children, fallback }: RoleGuardProps) {
  const [role, setRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkRole = async () => {
      const supabase = getSupabaseClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data } = await supabase.from("staff").select("role").eq("user_id", user.id).single()

      const userRole = data?.role as UserRole
      setRole(userRole)

      // Check if userRole exists before checking if it's in allowedRoles
      if (!userRole || !allowedRoles.includes(userRole)) {
        router.push("/dashboard")
      }

      setLoading(false)
    }

    checkRole()
  }, [allowedRoles, router])

  if (loading) return <div>Loading...</div>

  if (!role || !allowedRoles.includes(role)) {
    return fallback || <div>Access Denied</div>
  }

  return <>{children}</>
}
