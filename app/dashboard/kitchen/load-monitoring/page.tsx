"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

interface StationLoad {
  id: string
  name: string
  max_active_orders: number
  active_order_count: number
  assigned_staff_count: number
}

export default function KitchenLoadMonitoringPage() {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const [stationLoads, setStationLoads] = useState<StationLoad[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStationLoads()
    const interval = setInterval(fetchStationLoads, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchStationLoads = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
        return
      }

      // Get stations with their active order counts
      const { data: stations, error } = await supabase
        .from("kitchen_stations")
        .select(`
          id,
          name,
          max_active_orders,
          kitchen_staff_assignments(id),
          order_items(id)
        `)
        .eq("is_active", true)

      if (error) throw error

      const loads = (stations || []).map((station) => ({
        id: station.id,
        name: station.name,
        max_active_orders: station.max_active_orders,
        active_order_count: station.order_items?.length || 0,
        assigned_staff_count: station.kitchen_staff_assignments?.length || 0,
      }))

      setStationLoads(loads)
    } catch (error) {
      console.error("Error fetching station loads:", error)
    } finally {
      setLoading(false)
    }
  }

  const getLoadStatus = (station: StationLoad) => {
    const utilization = (station.active_order_count / station.max_active_orders) * 100

    if (utilization >= 90) return { label: "Critical", variant: "destructive", color: "bg-destructive" }
    if (utilization >= 70) return { label: "High", variant: "secondary", color: "bg-yellow-500" }
    if (utilization >= 40) return { label: "Moderate", variant: "outline", color: "bg-blue-500" }
    return { label: "Low", variant: "outline", color: "bg-green-500" }
  }

  const totalCapacity = stationLoads.reduce((sum, s) => sum + s.max_active_orders, 0)
  const totalActiveOrders = stationLoads.reduce((sum, s) => sum + s.active_order_count, 0)
  const averageUtilization = totalCapacity > 0 ? (totalActiveOrders / totalCapacity) * 100 : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Kitchen Load Monitoring</h1>
        <p className="text-muted-foreground mt-1">Real-time station capacity and efficiency</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Stations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stationLoads.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalActiveOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Capacity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCapacity}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Avg Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageUtilization.toFixed(0)}%</div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : stationLoads.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No active stations</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {stationLoads.map((station) => {
            const status = getLoadStatus(station)
            const utilization = (station.active_order_count / station.max_active_orders) * 100

            return (
              <Card key={station.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{station.name}</CardTitle>
                    <Badge variant={status.variant as any}>{status.label}</Badge>
                  </div>
                  <CardDescription>{station.assigned_staff_count} staff assigned</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">
                        Orders: {station.active_order_count}/{station.max_active_orders}
                      </span>
                      <span className="text-sm font-bold">{utilization.toFixed(0)}%</span>
                    </div>
                    <Progress value={utilization} className="h-2" />
                  </div>

                  <div className="pt-2 border-t">
                    <div className="text-xs text-muted-foreground">
                      Capacity: {station.active_order_count} of {station.max_active_orders} orders
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Orders per cook: {(station.active_order_count / station.assigned_staff_count).toFixed(1)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
