"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingCart,
  ChefHat,
  CreditCard,
  Receipt,
  BarChart3,
  LogOut,
  Users,
  Activity,
  Settings,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useStaffRole } from "@/hooks/use-staff-role"
import { signOut } from "@/lib/utils/auth-client"

interface SidebarProps {
  className?: string
  onNavigate?: () => void
}

export function Sidebar({ className, onNavigate }: SidebarProps) {
  const pathname = usePathname()
  const { role, staffName, loading } = useStaffRole()
  const displayName = staffName?.trim() || "Admin user"
  const displayRole = role ? role : "administrator"

  const menuItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ["manager"],
    },
    {
      label: "POS",
      href: "/dashboard/pos",
      icon: ShoppingCart,
      roles: ["manager", "waiter", "cashier"],
    },
    {
      label: "Kitchen",
      href: "/dashboard/kitchen",
      icon: ChefHat,
      roles: ["manager", "kitchen"],
    },
    {
      label: "Cashier",
      href: "/dashboard/cashier",
      icon: CreditCard,
      roles: ["manager", "cashier"],
    },
    {
      label: "Receipts",
      href: "/dashboard/receipts",
      icon: Receipt,
      roles: ["manager", "cashier"],
    },
    {
      label: "Menu",
      href: "/dashboard/menu",
      icon: UtensilsCrossed,
      roles: ["manager"],
    },
    {
      label: "Inventory",
      href: "/dashboard/inventory",
      icon: ChefHat,
      roles: ["manager"],
    },
    {
      label: "Reports",
      href: "/dashboard/reports",
      icon: BarChart3,
      roles: ["manager"],
    },
    {
      label: "Staff",
      href: "/dashboard/staff",
      icon: Users,
      roles: ["manager"],
    },
    {
      label: "Activity",
      href: "/dashboard/activity",
      icon: Activity,
      roles: ["manager"],
    },
    {
      label: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
      roles: ["manager"],
    },
  ]

  const handleSignOut = async () => {
    await signOut()
    window.location.href = "/auth/login"
  }

  const visibleItems = menuItems.filter((item) => {
    const normalizedRole = role?.toLowerCase()
    if (normalizedRole === 'admin') return true
    return !normalizedRole || item.roles.includes(normalizedRole)
  })

  return (
    <div className={cn("w-64 border-r border-border bg-card p-4 flex flex-col", className)}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">NRB POS</h1>
        <p className="text-sm text-muted-foreground">Restaurant System</p>
        <div className="mt-4 rounded-lg border border-border/70 bg-muted/30 p-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Current user</p>
          {loading ? (
            <div className="mt-2 h-10 w-full animate-pulse rounded-md bg-muted" />
          ) : (
            <div className="mt-2 flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-foreground">{displayName}</p>
                <p className="text-sm capitalize text-muted-foreground">{displayRole}</p>
              </div>
              {role && (
                <Badge variant="secondary" className="capitalize">
                  {role}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 space-y-2">
        {visibleItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link key={item.href} href={item.href} onClick={onNavigate}>
              <button
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors",
                  isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
                )}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            </Link>
          )
        })}
      </nav>

      <Button onClick={handleSignOut} variant="outline" className="w-full flex items-center gap-2 bg-transparent">
        <LogOut size={18} />
        Sign Out
      </Button>
    </div>
  )
}
