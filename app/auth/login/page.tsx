"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * LoginPage Component
 * 
 * Handles user authentication via Supabase Auth.
 * Validates credentials and checks for a corresponding 'staff' record.
 * Stores staff session details (ID, Name, Role) in localStorage for quick access.
 */
export default function LoginPage() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [emailError, setEmailError] = useState("")

  // Check for error message from query params (e.g., from OAuth callback)
  useEffect(() => {
    const errorParam = searchParams.get("error")
    if (errorParam) {
      setError(decodeURIComponent(errorParam))
    }
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setEmailError("")

    // Validate email format
    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address")
      setLoading(false)
      return
    }

    try {
      const supabase = getSupabaseClient()

      // 1. Authenticate with Supabase
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        // Provide user-friendly error messages
        let userFriendlyMessage = error.message
        if (error.message.includes("Invalid login credentials")) {
          userFriendlyMessage = "Invalid email or password. Please try again."
        } else if (error.message.includes("Email not confirmed")) {
          userFriendlyMessage = "Please check your email and confirm your account before signing in."
        } else if (error.message.includes("Too many requests")) {
          userFriendlyMessage = "Too many login attempts. Please wait a moment and try again."
        }
        setError(userFriendlyMessage)
        setLoading(false)
        return
      }

      // 2. Fetch staff details for the logged-in user
      const { data: staffData, error: staffError } = await supabase
        .from("staff")
        .select("*")
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
        .single()

      if (staffData) {
        // Clear any existing staff data first (defensive cleanup)
        localStorage.removeItem("current_staff_id")
        localStorage.removeItem("current_staff_name")
        localStorage.removeItem("current_staff_role")

        // Store fresh staff session data
        localStorage.setItem("current_staff_id", staffData.id)
        localStorage.setItem("current_staff_name", `${staffData.first_name} ${staffData.last_name}`)
        localStorage.setItem("current_staff_role", staffData.role)
      }

      // Use full page navigation to ensure server-side auth checks work
      window.location.href = "/dashboard"
    } catch (err) {
      console.error("Login error:", err)
      setError("An unexpected error occurred. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">NRB POS</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Restaurant Management System</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && <div className="bg-destructive/10 text-destructive text-sm p-3 rounded">{error}</div>}

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (e.target.value && !validateEmail(e.target.value)) {
                    setEmailError("Please enter a valid email address")
                  } else {
                    setEmailError("")
                  }
                }}
                onBlur={(e) => {
                  if (e.target.value && !validateEmail(e.target.value)) {
                    setEmailError("Please enter a valid email address")
                  } else {
                    setEmailError("")
                  }
                }}
                required
              />
              {emailError && <p className="text-sm text-destructive mt-1">{emailError}</p>}
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Signing in..." : "Sign In"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/auth/signup" className="text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
