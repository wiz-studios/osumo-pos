"use client"

import { useState, useEffect } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { ProtectedPage } from "@/components/auth/protected-page"
import { Save } from "lucide-react"

/**
 * SettingsPage Component
 * 
 * Configures restaurant-wide settings, specifically for KRA TIMS integration.
 * Allows managers to set Business Name, KRA PIN, and VAT status.
 * These settings are used when generating invoices and receipts.
 */
export default function SettingsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [businessName, setBusinessName] = useState("")
  const [kraPin, setKraPin] = useState("")
  const [vatRegistered, setVatRegistered] = useState(false)
  const [restaurantId, setRestaurantId] = useState("")

  useEffect(() => {
    fetchSettings()
  }, [])

  /**
   * Fetches current KRA settings from the 'restaurants' table.
   */
  const fetchSettings = async () => {
    setLoading(true)
    const supabase = getSupabaseClient()

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: staff } = await supabase
        .from("staff")
        .select("restaurant_id")
        .eq("user_id", user.id)
        .single()

      if (!staff?.restaurant_id) return

      setRestaurantId(staff.restaurant_id)

      const { data: restaurant } = await supabase
        .from("restaurants")
        .select("business_name, kra_pin, vat_registered")
        .eq("id", staff.restaurant_id)
        .single()

      if (restaurant) {
        setBusinessName(restaurant.business_name || "")
        setKraPin(restaurant.kra_pin || "")
        setVatRegistered(restaurant.vat_registered || false)
      }
    } catch (error) {
      console.error("Error fetching settings:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!restaurantId) {
      toast({
        title: "Error",
        description: "Restaurant not found",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    const supabase = getSupabaseClient()

    try {
      const { error } = await supabase
        .from("restaurants")
        .update({
          business_name: businessName || null,
          kra_pin: kraPin || null,
          vat_registered: vatRegistered
        })
        .eq("id", restaurantId)

      if (error) throw error

      toast({
        title: "Settings Saved",
        description: "KRA settings have been updated successfully.",
      })
    } catch (error: any) {
      console.error("Error saving settings:", error)
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save settings.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <ProtectedPage allowedRoles={["manager"]}>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">Configure KRA TIMS integration</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>KRA TIMS Configuration</CardTitle>
            <CardDescription>
              Configure your business details for KRA-compliant receipts (Mock Mode)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                placeholder="e.g., Nyama Bora Ltd"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                This will appear on receipts and invoices
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="kraPin">KRA PIN</Label>
              <Input
                id="kraPin"
                placeholder="e.g., P051234567Z"
                value={kraPin}
                onChange={(e) => setKraPin(e.target.value)}
                maxLength={11}
              />
              <p className="text-sm text-muted-foreground">
                Your business KRA PIN number (11 characters)
              </p>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="vatRegistered">VAT Registered</Label>
                <p className="text-sm text-muted-foreground">
                  Enable if your business is registered for VAT (16%)
                </p>
              </div>
              <Switch
                id="vatRegistered"
                checked={vatRegistered}
                onCheckedChange={setVatRegistered}
              />
            </div>

            {vatRegistered && (
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>VAT Mode Enabled:</strong> Receipts will show VAT breakdown (16% split from total).
                  All prices are assumed to be VAT-inclusive.
                </p>
              </div>
            )}

            <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg">
              <p className="text-sm text-yellow-900 dark:text-yellow-100">
                <strong>Mock Mode:</strong> This is a simulation of KRA TIMS. No real API calls are made.
                Invoices will be marked as "(Mock TIMS - Demo Mode)".
              </p>
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </ProtectedPage>
  )
}
