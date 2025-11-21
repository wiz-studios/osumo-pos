"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit2, Trash2, Users } from "lucide-react"
import { AddStationDialog } from "@/components/kitchen/add-station-dialog"
import { EditStationDialog } from "@/components/kitchen/edit-station-dialog"
import { StationStaffDialog } from "@/components/kitchen/station-staff-dialog"

interface KitchenStation {
  id: string
  name: string
  station_type: string
  max_active_orders: number
  is_active: boolean
  active_order_count?: number
  assigned_staff_count?: number
}

export default function StationsPage() {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const [stations, setStations] = useState<KitchenStation[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingStation, setEditingStation] = useState<KitchenStation | null>(null)
  const [managingStaffStation, setManagingStaffStation] = useState<KitchenStation | null>(null)

  useEffect(() => {
    fetchStations()
  }, [])

  const fetchStations = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data, error } = await supabase
        .from("kitchen_stations")
        .select(`
          *,
          kitchen_staff_assignments(id)
        `)
        .order("name")

      if (error) throw error

      // Transform data to include staff count
      const stationsWithCount = (data || []).map((station) => ({
        ...station,
        assigned_staff_count: station.kitchen_staff_assignments?.length || 0,
      }))

      setStations(stationsWithCount)
    } catch (error) {
      console.error("Error fetching stations:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this station?")) return

    try {
      const { error } = await supabase.from("kitchen_stations").delete().eq("id", id)

      if (error) throw error
      setStations(stations.filter((s) => s.id !== id))
    } catch (error) {
      console.error("Error deleting station:", error)
    }
  }

  const getCapacityStatus = (station: KitchenStation) => {
    const activeOrders = station.active_order_count || 0
    const capacity = station.max_active_orders
    const percentage = (activeOrders / capacity) * 100

    if (percentage >= 80) return { label: "At Capacity", variant: "destructive" }
    if (percentage >= 50) return { label: "Busy", variant: "secondary" }
    return { label: "Available", variant: "outline" }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Kitchen Stations</h1>
          <p className="text-muted-foreground mt-1">Manage stations and staff assignments</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Station
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Stations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stations.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Stations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stations.filter((s) => s.is_active).length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Staff Assigned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stations.reduce((sum, s) => sum + (s.assigned_staff_count || 0), 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kitchen Stations</CardTitle>
          <CardDescription>Manage kitchen workstations and their capacity</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : stations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No stations yet. Create one to get started.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Station Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Max Orders</TableHead>
                  <TableHead>Assigned Staff</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stations.map((station) => {
                  const status = getCapacityStatus(station)
                  return (
                    <TableRow key={station.id}>
                      <TableCell className="font-medium">{station.name}</TableCell>
                      <TableCell className="capitalize">{station.station_type}</TableCell>
                      <TableCell>{station.max_active_orders}</TableCell>
                      <TableCell>{station.assigned_staff_count || 0}</TableCell>
                      <TableCell>
                        {station.is_active ? (
                          <Badge variant={status.variant as any}>{status.label}</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setManagingStaffStation(station)}
                          title="Manage Staff"
                        >
                          <Users className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setEditingStation(station)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(station.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AddStationDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={() => {
          fetchStations()
          setShowAddDialog(false)
        }}
      />

      {editingStation && (
        <EditStationDialog
          station={editingStation}
          open={!!editingStation}
          onOpenChange={() => setEditingStation(null)}
          onSuccess={() => {
            fetchStations()
            setEditingStation(null)
          }}
        />
      )}

      {managingStaffStation && (
        <StationStaffDialog
          station={managingStaffStation}
          open={!!managingStaffStation}
          onOpenChange={() => setManagingStaffStation(null)}
          onSuccess={() => {
            fetchStations()
            setManagingStaffStation(null)
          }}
        />
      )}
    </div>
  )
}
