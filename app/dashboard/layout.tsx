"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/navigation/sidebar"
import { MobileNav } from "@/components/navigation/mobile-nav"
import { OnlineChecker } from "@/components/online-checker"
import { getSupabaseClient } from "@/lib/supabase/client"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      // Check if user is logged in via staff PIN (localStorage)
      const staffRole = localStorage.getItem('current_staff_role')

      if (staffRole) {
        // Staff PIN login - allow access
        setIsAuthenticated(true)
        setLoading(false)
        return
      }

      // Check if user is logged in via Supabase (admin)
      const supabase = getSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Admin login - allow access
        setIsAuthenticated(true)
      } else {
        // Not authenticated - redirect to login
        router.push('/auth/login')
      }

      setLoading(false)
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="flex h-screen bg-background">
      <OnlineChecker />
      <div className="hidden md:flex">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center p-4 border-b md:hidden bg-card">
          <MobileNav />
          <span className="ml-4 font-bold text-lg">NRB POS</span>
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
