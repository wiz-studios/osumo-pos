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
  requires_id?: boolean
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
  kitchen_status?: "new" | "in_progress" | "ready" | "served"
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

export type ActivityActionType =
  // Payment Operations
  | 'payment_processed'
  | 'payment_failed'

  // Inventory Management
  | 'stock_adjusted'

  // Staff Authentication
  | 'staff_login'
  | 'staff_logout'

  // Order Management
  | 'order_created'
  | 'order_modified'
  | 'order_voided'
  | 'order_sent_to_kitchen'
  | 'order_sent_to_cashier'

  // Discounts & Price Adjustments
  | 'discount_applied'
  | 'price_override'

  // Menu Management
  | 'menu_item_created'
  | 'menu_item_updated'
  | 'menu_item_deleted'
  | 'menu_item_availability_changed'

  // Staff Management
  | 'staff_created'
  | 'staff_updated'
  | 'staff_deleted'
  | 'staff_role_changed'
  | 'staff_pin_changed'

  // Reports & Analytics
  | 'report_viewed'
  | 'report_exported'

export interface ActivityLogDetails {
  // Common fields
  notes?: string
  reason?: string

  // Payment-specific
  payment_method?: 'cash' | 'mpesa'
  amount?: number
  transaction_id_masked?: string
  phone_masked?: string

  // Stock-specific
  item_name?: string
  quantity_change?: number
  adjustment_type?: 'spoilage' | 'wastage' | 'restock' | 'correction'
  old_quantity?: number
  new_quantity?: number

  // Order-specific
  order_number?: string
  table_number?: string
  order_type?: string
  order_total?: number
  items_count?: number

  // Discount-specific
  discount_amount?: number
  discount_percentage?: number
  original_price?: number
  new_price?: number

  // Menu-specific
  menu_item_name?: string
  price?: number
  category?: string
  old_price?: number
  new_price_value?: number
  availability?: boolean

  // Staff-specific
  staff_name?: string
  role?: string
  old_role?: string
  new_role?: string

  // Report-specific
  report_name?: string
  date_range?: string
  export_format?: string
}

export interface ActivityLog {
  id: string
  restaurant_id: string
  staff_id: string
  action_type: ActivityActionType | string
  target_id?: string
  target_type?: string
  details?: ActivityLogDetails
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

export interface MenuItemSuggestion {
  id: string
  restaurant_id: string
  trigger_item_id: string
  suggested_item_id?: string
  suggestion_message?: string
  created_at: string
  suggested_item?: MenuItem
}
