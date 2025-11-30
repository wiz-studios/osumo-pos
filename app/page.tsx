import { redirect } from "next/navigation"

/**
 * HomePage Component
 * 
 * The entry point of the application.
 * Currently redirects all traffic to the login page.
 * Authentication flow will handle subsequent redirects to the dashboard.
 */
export default function HomePage() {
  // Always redirect to login - auth layout will handle redirecting authenticated users to dashboard
  redirect("/auth/login")
}
