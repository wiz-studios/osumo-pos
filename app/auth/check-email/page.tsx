import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function CheckEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Check Your Email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            We've sent a confirmation link to your email. Please click the link to verify your account.
          </p>
          <p className="text-sm text-muted-foreground">Once verified, you can sign in to your account.</p>
          <Link href="/auth/login" className="text-primary hover:underline inline-block">
            Back to Login
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
