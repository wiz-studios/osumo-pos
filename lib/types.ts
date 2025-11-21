export type UserRole = "manager" | "waiter" | "cashier" | "kitchen"

export interface StaffMember {
  id: string
  user_id: string
  restaurant_id: string
  role: UserRole
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  active: boolean
  pin_hash?: string
  created_at: string
}

export interface MenuCategory {
  id: string
  restaurant_id: string
  name: string
  display_order?: number
  is_visible: boolean
  created_at: string
}

export interface MenuItem {
  id: string
  restaurant_id: string
  category_id: string
  name: string
  description?: string
  price: number
  cost_price?: number
  image_url?: string
  available: boolean
  prep_time_minutes: number
  is_vegan: boolean
  is_spicy: boolean
  is_daily_special: boolean
  special_expiry?: string
  created_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  menu_item_id: string
  quantity: number
  unit_price: number
  subtotal: number
  notes?: string
  item_status: "new" | "in_progress" | "ready" | "served"
  created_at: string
  menu_item?: MenuItem
}

export interface Order {
  id: string
  restaurant_id: string
  table_number?: number
  customer_name?: string
  order_type: "dine-in" | "takeaway" | "delivery"
  status: "new" | "in_progress" | "completed" | "paid"
  total: number
  discount?: number
  staff_id?: string
  payment_method?: string
  payment_status: "unpaid" | "partial" | "paid"
  created_at: string
  updated_at: string
  order_items?: OrderItem[]
}

export interface Payment {
  id: string
  order_id: string
  amount: number
  payment_method: "cash" | "card" | "m-pesa" | "airtel"
  reference?: string
  cash_received?: number
  change_given?: number
  mpesa_phone?: string
  status: "pending" | "completed" | "failed"
  created_at: string
}

export interface InventoryItem {
  id: string
  restaurant_id: string
  name: string
  unit: string
  quantity_in_stock: number
  reorder_level: number
  unit_cost: number
  supplier?: string
  last_restocked_at?: string
  created_at: string
  updated_at: string
}

export interface RecipeIngredient {
  id: string
  restaurant_id: string
  menu_item_id: string
  inventory_item_id: string
  quantity_required: number
  created_at: string
  updated_at: string
  inventory_item?: InventoryItem
}

export interface InventoryTransaction {
  id: string
  restaurant_id: string
  inventory_item_id: string
  transaction_type: 'purchase' | 'sale' | 'adjustment' | 'spoilage' | 'wastage'
  quantity: number
  reference_id?: string
  notes?: string
  created_by: string
  created_at: string
}

export interface ActivityLog {
  id: string
  restaurant_id: string
  staff_id: string
  action: string
  details?: any
  created_at: string
}

export interface Restaurant {
  id: string
  name: string
  business_name?: string
  kra_pin?: string
  vat_registered: boolean
  created_at: string
}

export interface Invoice {
  id: string
  restaurant_id: string
  order_id: string
  invoice_number: string
  invoice_date: string
  sequence_number: number
  total_amount: number
  taxable_amount?: number
  vat_amount?: number
  qr_code_data?: string
  is_mock_tims: boolean
  created_at: string
}
