import { redirect } from "next/navigation"

export default function HomePage() {
  // Always redirect to login - auth layout will handle redirecting authenticated users to dashboard
  redirect("/auth/login")
}
