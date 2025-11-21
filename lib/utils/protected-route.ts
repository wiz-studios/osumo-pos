import { getCurrentUser, getUserRole } from "@/lib/utils/auth"
import { redirect } from "next/navigation"
import type { UserRole } from "@/lib/types"

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/auth/login")
  }
  return user
}

export async function requireRole(allowedRoles: UserRole[]) {
  const user = await requireAuth()
  const role = await getUserRole()

  if (!role || !allowedRoles.includes(role as UserRole)) {
    redirect("/dashboard")
  }

  return user
}
