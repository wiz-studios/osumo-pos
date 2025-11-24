-- Create RPC for deducting inventory stock
-- This function is called from the POS page when an order is completed

CREATE OR REPLACE FUNCTION deduct_inventory_stock(
  p_inventory_item_id UUID,
  p_quantity DECIMAL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE inventory_items
  SET 
    quantity_in_stock = quantity_in_stock - p_quantity,
    updated_at = NOW()
  WHERE id = p_inventory_item_id;
END;
$$;
