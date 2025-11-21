"use client"

import { useEffect, useState } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface TableStatus {
  tableNumber: number
  status: "available" | "occupied" | "reserved"
  orderId?: string
  customerName?: string
}

export default function TablesPage() {
  const [tables, setTables] = useState<TableStatus[]>([])
  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = getSupabaseClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data: staff } = await supabase.from("staff").select("restaurant_id").eq("user_id", user.id).single()

      const resId = staff?.restaurant_id
      setRestaurantId(resId)

      // Fetch active orders for dine-in
      const { data: orders } = await supabase
        .from("orders")
        .select("*")
        .eq("restaurant_id", resId)
        .eq("order_type", "dine-in")
        .neq("status", "paid")

      // Create table list with statuses
      const tableList: TableStatus[] = []
      for (let i = 1; i <= 20; i++) {
        const order = orders?.find((o) => o.table_number === i)
        tableList.push({
          tableNumber: i,
          status: order ? "occupied" : "available",
          orderId: order?.id,
          customerName: order?.customer_name,
        })
      }

      setTables(tableList)
      setLoading(false)
    }

    fetchData()
  }, [])

  const handleToggleReserve = (tableNumber: number) => {
    setTables(
      tables.map((t) =>
        t.tableNumber === tableNumber
          ? {
              ...t,
              status: t.status === "reserved" ? "available" : "reserved",
            }
          : t,
      ),
    )
  }

  if (loading) return <div className="p-6">Loading...</div>

  const statusColors = {
    available: "bg-green-100 border-green-300 text-green-700",
    occupied: "bg-red-100 border-red-300 text-red-700",
    reserved: "bg-yellow-100 border-yellow-300 text-yellow-700",
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Floor Plan</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {tables.map((table) => (
          <Card
            key={table.tableNumber}
            className={`cursor-pointer border-2 transition-all hover:shadow-lg ${statusColors[table.status]}`}
          >
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold mb-2">T{table.tableNumber}</p>
              <p className="text-xs capitalize mb-3">{table.status}</p>
              {table.status === "occupied" && <p className="text-xs mb-2">{table.customerName || "Occupied"}</p>}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleToggleReserve(table.tableNumber)}
                className="w-full text-xs"
              >
                {table.status === "reserved" ? "Release" : "Reserve"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Legend</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
            <span className="text-sm">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
            <span className="text-sm">Occupied</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
            <span className="text-sm">Reserved</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
