# Authentication Flow Review - Findings and Recommendations

## Executive Summary

This document provides a comprehensive review of the authentication flow in the Osumo application. The review covers login, signup, session management, protected routes, role-based access control, and OAuth callback handling.

## 1. Login Flow Review

### Current Implementation
- **File**: `app/auth/login/page.tsx`
- **Method**: Client-side form submission using Supabase `signInWithPassword`
- **Redirect**: Uses `window.location.href` for full page navigation

### Issues Identified

1. **Missing Error Handling**
   - No try-catch block around the login call
   - If an exception occurs (network error, etc.), it won't be caught
   - The loading state may not be reset in all error scenarios

2. **No Input Validation**
   - Relies solely on HTML5 `required` attribute
   - No client-side email format validation
   - No password strength feedback

3. **Inconsistent Error Display**
   - Error messages are displayed but could be more user-friendly
   - No distinction between different error types (network, auth, etc.)

### Recommendations

```typescript
// Add try-catch and better error handling
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault()
  setLoading(true)
  setError("")

  try {
    const supabase = getSupabaseClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    window.location.href = "/dashboard"
  } catch (err) {
    console.error("Login error:", err)
    setError("An unexpected error occurred. Please try again.")
    setLoading(false)
  }
}
```

## 2. Signup Flow Review

### Current Implementation
- **File**: `app/auth/signup/page.tsx`
- **Process**: 
  1. Create user in Supabase Auth
  2. Call API to create restaurant and staff records
  3. Handle email verification flow

### Issues Identified

1. **Critical: No Rollback on Failure**
   - If restaurant creation fails after user creation, the user account is orphaned
   - No cleanup mechanism if the API call fails
   - User exists in auth but has no restaurant/staff record

2. **Missing Validation**
   - No password strength requirements
   - No email format validation beyond HTML5
   - No duplicate email check before signup

3. **Race Condition Risk**
   - User creation and restaurant creation are separate operations
   - If API call fails, user is left in inconsistent state

4. **Error Handling Gaps**
   - API errors are caught but user account may already be created
   - No transaction-like behavior to ensure atomicity

### Recommendations

1. **Add Transaction-like Behavior**
   - Consider using Supabase database functions to create user, restaurant, and staff in a single transaction
   - Or implement cleanup: delete user if restaurant creation fails

2. **Add Password Validation**
   ```typescript
   const validatePassword = (password: string) => {
     if (password.length < 8) return "Password must be at least 8 characters"
     if (!/[A-Z]/.test(password)) return "Password must contain an uppercase letter"
     if (!/[a-z]/.test(password)) return "Password must contain a lowercase letter"
     if (!/[0-9]/.test(password)) return "Password must contain a number"
     return null
   }
   ```

3. **Improve Error Recovery**
   ```typescript
   // If restaurant creation fails, attempt to clean up user
   if (!response.ok) {
     // Optionally delete the user account
     await supabase.auth.admin.deleteUser(userId)
     setError(result.error || "Failed to create restaurant profile")
     setLoading(false)
     return
   }
   ```

## 3. Session Management Review

### Current Implementation
- **Middleware**: `lib/supabase/middleware.ts` - Refreshes session on every request
- **Server Client**: `lib/supabase/server.ts` - Singleton pattern with cookie handling
- **Client**: `lib/supabase/client.ts` - Browser client singleton

### Issues Identified

1. **Server Client Singleton Issue**
   - `getSupabaseServer()` uses a singleton pattern
   - Cookies are read once when client is created
   - If cookies change during request, the singleton won't reflect changes
   - This can cause stale session data

2. **Middleware Session Refresh**
   - Only calls `getSession()` which refreshes if needed
   - Doesn't validate session is actually valid
   - No error handling if refresh fails

3. **Cookie Update Handling**
   - Server client has try-catch for cookie updates but silently fails
   - No logging or error reporting if cookie updates fail

### Recommendations

1. **Fix Server Client Singleton**
   ```typescript
   // Don't use singleton - create new client per request
   export const getSupabaseServer = async () => {
     const cookieStore = await cookies()
     return createServerClient(
       process.env.NEXT_PUBLIC_SUPABASE_URL || "",
       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
       {
         cookies: {
           getAll() {
             return cookieStore.getAll()
           },
           setAll(cookiesToSet) {
             try {
               cookiesToSet.forEach(({ name, value, options }) => 
                 cookieStore.set(name, value, options)
               )
             } catch (err) {
               console.error("Failed to set cookies:", err)
             }
           },
         },
       },
     )
   }
   ```

2. **Improve Middleware Error Handling**
   ```typescript
   export const updateSession = async (request: NextRequest) => {
     // ... existing code ...
     
     try {
       const { data: { session }, error } = await supabase.auth.getSession()
       if (error) {
         console.error("Session refresh error:", error)
       }
     } catch (err) {
       console.error("Middleware error:", err)
     }
     
     return supabaseResponse
   }
   ```

## 4. Protected Routes Review

### Current Implementation
- **Server-side**: `app/dashboard/layout.tsx` uses `getCurrentUser()` directly
- **Utilities**: `lib/utils/protected-route.ts` provides `requireAuth()` and `requireRole()` but they're NOT USED
- **Client-side**: `components/auth/role-guard.tsx` for client components

### Issues Identified

1. **Inconsistent Patterns**
   - `requireAuth()` and `requireRole()` are defined but never used
   - Dashboard pages use manual `getCurrentUser()` checks
   - Some pages have no auth checks at all (client components)

2. **RoleGuard Component Issues**
   - Line 38: Checks `!allowedRoles.includes(userRole)` but `userRole` can be `null` or `undefined`
   - This will always redirect if role is null, even if it's just loading
   - No proper null checking before the includes check

3. **Missing Auth Checks**
   - Many client-side pages (settings, orders, etc.) only check auth in `useEffect`
   - No server-side protection for these routes
   - Users could potentially access pages before auth check completes

4. **Settings Page Security Issue**
   - Uses `supabase.auth.admin.createUser()` from client-side
   - This requires admin privileges and should NOT be called from client
   - Should be moved to an API route with proper server-side admin client

### Recommendations

1. **Use requireAuth/requireRole Utilities**
   ```typescript
   // In dashboard pages, use:
   import { requireAuth, requireRole } from "@/lib/utils/protected-route"
   
   export default async function SomePage() {
     await requireAuth() // or requireRole(["manager"])
     // ... rest of page
   }
   ```

2. **Fix RoleGuard Component**
   ```typescript
   if (!userRole || !allowedRoles.includes(userRole)) {
     router.push("/dashboard")
     return
   }
   ```

3. **Move Admin Operations to API**
   - Create `/api/auth/invite-staff` route
   - Use `getSupabaseAdmin()` server-side
   - Remove `supabase.auth.admin` calls from client

4. **Add Server-Side Protection to All Routes**
   - Ensure all dashboard routes have server-side auth checks
   - Use layout.tsx for route-level protection
   - Use page-level checks for role-specific routes

## 5. OAuth Callback Review

### Current Implementation
- **File**: `app/api/auth/callback/route.ts`
- **Process**: Exchanges code for session, redirects to dashboard

### Issues Identified

1. **No Error Message Passing**
   - On error, redirects to login but doesn't pass error message
   - User doesn't know why authentication failed

2. **No Code Validation**
   - Doesn't validate the code parameter format
   - No rate limiting on callback endpoint

3. **Unsafe Redirect**
   - Uses `next` parameter from query string without validation
   - Could be used for open redirect vulnerability
   - Should validate `next` is a safe internal URL

### Recommendations

1. **Add Error Message Passing**
   ```typescript
   if (error) {
     return NextResponse.redirect(
       new URL(`/auth/login?error=${encodeURIComponent(error.message)}`, request.url)
     )
   }
   ```

2. **Validate Redirect URL**
   ```typescript
   const next = searchParams.get("next") || "/dashboard"
   const safeNext = next.startsWith("/") && !next.startsWith("//") 
     ? next 
     : "/dashboard"
   ```

3. **Add Code Validation**
   ```typescript
   if (!code || typeof code !== "string" || code.length < 20) {
     return NextResponse.redirect(
       new URL("/auth/login?error=invalid_code", request.url)
     )
   }
   ```

## 6. Additional Security Issues

### Issues Found

1. **Settings Page Admin API Call**
   - **Critical**: `app/dashboard/settings/page.tsx` line 52
   - Uses `supabase.auth.admin.createUser()` from client
   - This should NEVER be called from client-side code
   - Requires service role key which should only be on server

2. **No CSRF Protection**
   - No CSRF tokens on forms
   - API routes don't validate request origin

3. **No Rate Limiting**
   - Login/signup endpoints have no rate limiting
   - Vulnerable to brute force attacks

4. **SignOut Implementation**
   - `lib/utils/auth.ts` has `signOut()` but it's not used
   - Sidebar implements its own signOut
   - Inconsistent implementation

### Recommendations

1. **Move Admin Operations to Server**
   ```typescript
   // Create app/api/auth/invite-staff/route.ts
   export async function POST(request: NextRequest) {
     const { email, role, restaurantId } = await request.json()
     const admin = getSupabaseAdmin()
     // ... create user and staff record
   }
   ```

2. **Add Rate Limiting**
   - Use middleware or API route middleware
   - Limit login attempts per IP
   - Use libraries like `@upstash/ratelimit`

3. **Standardize SignOut**
   - Use the utility from `lib/utils/auth.ts`
   - Or remove unused utility and keep sidebar implementation

## 7. Code Quality Issues

### Issues Found

1. **Unused Code**
   - `requireAuth()` and `requireRole()` are defined but never used
   - `signOut()` in `lib/utils/auth.ts` is not used

2. **Inconsistent Error Handling**
   - Some places use try-catch, others don't
   - Error messages vary in format and detail

3. **Missing Type Safety**
   - Some places use `as UserRole` without proper validation
   - Role checks don't validate against known roles

## 8. Summary of Critical Issues

### High Priority

1. **Settings Page Admin API Call** - Security vulnerability
2. **Signup Rollback** - Data consistency issue
3. **Server Client Singleton** - Session management bug
4. **OAuth Redirect Validation** - Security vulnerability

### Medium Priority

1. **Inconsistent Auth Patterns** - Code maintainability
2. **RoleGuard Null Check** - Logic bug
3. **Missing Error Handling** - User experience
4. **No Rate Limiting** - Security concern

### Low Priority

1. **Unused Code** - Code cleanup
2. **Password Validation** - User experience
3. **Error Message Consistency** - User experience

## 9. Recommended Action Plan

### Phase 1: Critical Security Fixes
1. Move admin API calls to server-side routes
2. Fix OAuth redirect validation
3. Add signup rollback mechanism

### Phase 2: Session Management
1. Fix server client singleton issue
2. Improve middleware error handling
3. Add proper cookie update logging

### Phase 3: Code Consistency
1. Standardize auth checks using requireAuth/requireRole
2. Fix RoleGuard component
3. Remove unused code

### Phase 4: Enhancements
1. Add password validation
2. Add rate limiting
3. Improve error messages
4. Add CSRF protection

## Conclusion

The authentication flow is functional but has several critical security and reliability issues that need to be addressed. The most urgent issues are the client-side admin API calls and the lack of rollback in the signup flow. Once these are fixed, the system will be more secure and reliable.

