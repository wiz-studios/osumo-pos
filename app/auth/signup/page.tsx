"use client"

import type React from "react"
import { useState } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const validatePassword = (password: string): string | null => {
  if (password.length < 8) return "Password must be at least 8 characters"
  if (!/[A-Z]/.test(password)) return "Password must contain an uppercase letter"
  if (!/[a-z]/.test(password)) return "Password must contain a lowercase letter"
  if (!/[0-9]/.test(password)) return "Password must contain a number"
  return null
}

export default function SignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [restaurantName, setRestaurantName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [emailError, setEmailError] = useState("")

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setPasswordError("")
    setEmailError("")

    // Validate email format
    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address")
      setLoading(false)
      return
    }

    // Validate password
    const passwordValidationError = validatePassword(password)
    if (passwordValidationError) {
      setPasswordError(passwordValidationError)
      setLoading(false)
      return
    }

    try {
      const supabase = getSupabaseClient()

      // Step 1: Sign up the user in Supabase Auth
      const { data: authData, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      })

      if (signupError) {
        // Provide user-friendly error messages
        let userFriendlyMessage = signupError.message
        if (signupError.message.includes("User already registered")) {
          userFriendlyMessage = "An account with this email already exists. Please sign in instead."
        } else if (signupError.message.includes("Password")) {
          userFriendlyMessage = "Password does not meet requirements. Please check and try again."
        } else if (signupError.message.includes("Invalid email")) {
          userFriendlyMessage = "Please enter a valid email address."
        }
        setError(userFriendlyMessage)
        setLoading(false)
        return
      }

      if (!authData?.user?.id) {
        setError("Unable to create your account. Please try again or contact support if the problem persists.")
        setLoading(false)
        return
      }

      const userId = authData.user.id

      // Call API route to create restaurant and staff (using service role key on server)
      const response = await fetch("/api/auth/create-restaurant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          firstName,
          lastName,
          restaurantName: restaurantName || `${firstName} ${lastName}'s Restaurant`,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        // Attempt to clean up the user account if restaurant creation fails
        try {
          await fetch("/api/auth/cleanup-user", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ userId }),
          })
        } catch (cleanupError) {
          console.error("Failed to cleanup user after signup failure:", cleanupError)
          // Continue even if cleanup fails - user can contact support
        }

        setError(result.error || "Your account was created, but we couldn't set up your restaurant profile. Please contact support for assistance.")
        setLoading(false)
        return
      }

      // If email confirmation is required, there will be no active session yet
      if (!authData.session) {
        window.location.href = "/auth/check-email"
      } else {
        // Use full page navigation to ensure server-side auth checks work
        window.location.href = "/dashboard"
      }
    } catch (err) {
      console.error("Signup error:", err)
      setError("An unexpected error occurred. Please try again. If the problem persists, contact support.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Sign up for NRB POS</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            {error && <div className="bg-destructive/10 text-destructive text-sm p-3 rounded">{error}</div>}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="restaurantName">Restaurant Name</Label>
              <Input
                id="restaurantName"
                placeholder="Your Restaurant"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
              />
            </div>

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
              <PasswordInput
                id="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (e.target.value) {
                    const validationError = validatePassword(e.target.value)
                    setPasswordError(validationError || "")
                  } else {
                    setPasswordError("")
                  }
                }}
                required
              />
              {passwordError && <p className="text-sm text-destructive mt-1">{passwordError}</p>}
              {!passwordError && password && (
                <p className="text-sm text-green-600 mt-1">Password meets requirements</p>
              )}
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Creating account..." : "Sign Up"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
